import { App } from "@tinyhttp/app";
import { tinyws } from "tinyws";
import * as dotenv from "@tinyhttp/dotenv";
import { json } from "milliparsec";

dotenv.config();

const PORT = 3000;

const RULES = `You will be given a strategy prompt for a game of Battlesnake. Output only one word in response to the strategy: up, down, left, or right.`;

var STRATEGY = "always go left";

var COLOR = "#008000"; // green

let boardStates = [];

let WS = null;

const app = new App();

app.use(tinyws());

app.all("/twilio", async (req, res) => {
  res.type("text/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <ConversationRelay voice="LG95yZDEHg6fCZdQjLqj" interruptible="none"  elevenlabsTextNormalization="on" ttsProvider="elevenlabs" url="wss://${process.env.NGROK_URL}/ws" welcomeGreeting="How would you like to customize your Battlesnake?" />
      </Connect>
    </Response>`
  );
});

app.get("/", (_req, res) =>
  res.json({
    apiversion: "1",
    author: "you",
    color: COLOR,
    head: "cosmic-horror",
    tail: "cosmic-horror",
    version: "0.0.1-beta",
  })
);

app.post("/start", (_req, res) => res.json({}));

app.use(json());

app.post("/move", async (req, res) => {
  console.log("Received board state:", req.body);
  boardStates.push(req.body);

  res.json({ move: await llmMove(req.body) });
});

app.post("/end", async (_req, res) => {
  try {
    if (WS) {
      WS.send(
        JSON.stringify({
          type: "text",
          token: "Generating color commentary...",
          last: false,
        })
      );
    }

    const recap = await generateCommentary(boardStates);

    if (WS) {
      WS.send(
        JSON.stringify({
          type: "text",
          token: recap,
          last: true,
        })
      );
    }

    boardStates = [];

    res.json({ ok: true });
  } catch (err) {
    console.error("Error generating commentary at end:", err);
    res.status(500).json({ error: "failed to generate commentary" });
  }
});

app.use("/ws", async (req, res) => {
  const ws = await req.ws();
  WS = ws;

  ws.on("message", async (data) => {
    const message = JSON.parse(data);
    switch (message.type) {
      case "setup":
        const callSid = message.callSid;
        console.log("Setup for call:", callSid);
        break;
      case "prompt":
        const voice = message.voicePrompt || "";

        if (voice.startsWith("Color")) {
          const spoken = voice.slice("Color".length);
          const hex = await colorToHex(spoken);
          if (hex) {
            COLOR = hex;
            console.log(`COLOR updated to: ${COLOR}`);

            ws.send(
              JSON.stringify({
                type: "text",
                token: COLOR,
                last: true,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "text",
                token: "could not recognize color name, please try again",
                last: true,
              })
            );
          }
        } else {
          STRATEGY = voice;
          console.log(`STRATEGY updated to: ${STRATEGY}`);
          ws.send(
            JSON.stringify({
              type: "text",
              token: STRATEGY,
              last: true,
            })
          );
        }
        break;
      case "interrupt":
        console.log("Handling interruption.");
        break;
      default:
        console.warn("Unknown message type received:", message.type);
        break;
    }
  });

  ws.on("close", () => {
    console.log("WebSocket closed");
  });
});

app.listen(PORT, () => console.log(`Battlesnake running on ${PORT}`));

async function llmMove(boardState) {
  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3:1.7b",
        messages: [
          { role: "system", content: RULES },
          { role: "user", content: STRATEGY },
        ],
        stream: false,
        think: false,
      }),
    });

    const data = await response.json();

    return data.message.content;
  } catch (error) {
    console.error("Unexpected error in llmMove:", error);
    return "right";
  }
}

async function colorToHex(spoken) {
  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3:1.7b",
        messages: [
          {
            role: "system",
            content:
              "Convert color names into hex codes. Only reply with the hex code starting with #.",
          },
          { role: "user", content: spoken },
        ],
        stream: false,
        think: false,
      }),
    });
    const data = await response.json();
    const hex = (data.message.content || "").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
    return null;
  } catch (e) {
    console.error("Error in colorToHex:", e);
    return null;
  }
}

async function generateCommentary(gameStates) {
  console.log("Generating commentary for board state:", gameStates);
  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3:1.7b",
        messages: [
          {
            role: "system",
            content:
              "Role: high-energy sports commentator.\n" +
              "Task: produce ONE cohesive highlight-style recap of the entire snake match.\n" +
              "Style: vivid, broadcast tone, natural prose.\n" +
              "Length: 3–4 sentences (~60–110 words).\n" +
              "Constraints: base only on user-provided moves; do not display JSON; do not invent details; no bullet lists.",
          },
          {
            role: "user",
            content:
              "Write a single exciting recap of this snake game in 3–4 sentences. " +
              "Emphasize momentum swings, close calls, fruit pickups, and the final outcome. " +
              "Prose only (no code, no JSON, no lists), and stick strictly to what happened in the moves.\n\n" +
              "ALL_MOVE_JSON:\n" +
              JSON.stringify(gameStates),
          },
        ],
        stream: false,
        think: false,
      }),
    });
    const data = await response.json();
    console.log("Commentary response data:", data.message.content);
    return data.message.content;
  } catch (e) {
    console.error("Error in generation:", e);
    return null;
  }
}
