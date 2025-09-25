import { App } from "@tinyhttp/app";

const PORT = 3000;

const app = new App();

app.get("/", (_req, res) =>
  res.json({
    apiversion: "1",
    author: "you",
    color: "#000000", //FF0000
    head: "default", //chomp
    tail: "default",
    version: "0.0.1-beta",
  })
);

app.post("/start", (_req, res) => res.status(200));

app.post("/move", (_req, res) => res.json({ move: "right" }));

app.post("/end", (_req, res) => res.status(200));

app.listen(PORT, () => console.log(`Battlesnake running on ${PORT}`));
