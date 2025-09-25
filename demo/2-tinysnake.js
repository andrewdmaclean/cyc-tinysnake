import { App } from "@tinyhttp/app";

const PORT = 3000;

const app = new App();

app.get("/", (_req, res) =>
  res.json({
    apiversion: "1",
    author: "you",
    color: "#FFF000",
    head: "chomp", //chomp
    tail: "default",
    version: "0.0.1-beta",
  })
);

app.post("/start", (_req, res) => res.status(200));

app.post("/move", (_req, res) => res.json({ move: "down" }));

app.post("/end", (_req, res) => res.status(200));

app.listen(PORT, () => console.log(`Battlesnake running on ${PORT}`));
