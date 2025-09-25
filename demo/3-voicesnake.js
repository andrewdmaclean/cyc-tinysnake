import { App } from "@tinyhttp/app";
import { tinyws } from "tinyws";
import * as dotenv from "@tinyhttp/dotenv";

dotenv.config({ path: '../.env' })

const PORT = 3000;

const RULES = `You will be given a strategy prompt for a game of Battlesnake. Output only one word in response to the strategy: up, down, left, or right.`;

var STRATEGY = "always go left";

const app = new App();

app.use(tinyws()); 

app.get("/", (_req, res) =>
  res.json({
    apiversion: "1",
    author: "you",
    color: "#000000",
    head: "cosmic-horror",
    tail: "cosmic-horror",
    version: "0.0.1-beta",
  })
);

app.post("/start", (_req, res) => res.status(200));

app.post("/move", async (req, res) => {
  res.json({ move: await llmMove() });
});

app.post("/end", (_req, res) => res.status(200));

app.listen(PORT, () => console.log(`Battlesnake running on ${PORT}`));

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

app.use("/ws", async (req, res) => {
  const ws = await req.ws();

  ws.on("message", async (data) => {
    const message = JSON.parse(data);
    switch (message.type) {
      case "setup":
        const callSid = message.callSid;
        console.log("Setup for call:", callSid);
        break;
      case "prompt":
        const voice = message.voicePrompt || "";

        STRATEGY = voice;
        console.log(`STRATEGY updated to: ${STRATEGY}`);
        ws.send(
          JSON.stringify({
            type: "text",
            token: STRATEGY,
            last: true,
          })
        );

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

async function llmMove() {
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
    console.log("LLM response data:", data.message.content);
    return data.message.content;
  } catch (error) {
    console.error("Unexpected error in llmMove:", error);
    return "right";
  }
}
