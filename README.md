Companion repo for **“Goodbye World, Hello Battlesnake”** (Commit Your Code Conference)

This project shows how to build a tiny [tinyhttp](https://github.com/tinyhttp/tinyhttp) Battlesnake server, then add **strategy control over WebSockets** using **Twilio Conversation Relay** and a **local LLM (Ollama)**.

---

## What you need

- **Node.js 18+**
- **pnpm** (preferred): `npm i -g pnpm`
- **ngrok** (to expose `localhost:3000`)
- **Twilio** (Programmable Voice + **Conversation Relay**)  
  – a Twilio account and a voice-enabled phone number  
- **Ollama** (for local LLM): <https://ollama.com/>  
  – run `ollama serve` and `ollama pull qwen3:1.7b` (or any supported model)

Create a `.env` (based on `.env.example`):

```env
NGROK_URL=https://your-subdomain.ngrok.app
```

> `NGROK_URL` is used to form public callback / WS URLs for Twilio & Battlesnake.

---

## Install

```bash
pnpm install
```

---

## Run the demos

Each file in `demo/` is standalone; pick one:

```bash
# 1) tinyhttp hello world (baseline)
node demo/1-tinyhttp.js

# 2) minimal Battlesnake (always moves "down")
node demo/2-tinysnake.js

# 3) "voice snake" — WS backchannel for strategy updates (Twilio-ready)
node demo/3-voicesnake.js

# 4) full example — Battlesnake API + WS + hooks for LLM/Relay
node demo/4-fullsnake.js
```

Or run the combined starter:

```bash
pnpm start   # runs node index.js
```

Servers listen on **http://localhost:3000**.

---

## Expose with ngrok

```bash
ngrok http 3000
```

Copy the **https** URL into `.env` as `NGROK_URL`.

---

## Project structure

```
.
├─ demo/
│  ├─ 1-tinyhttp.js
│  ├─ 2-tinysnake.js
│  ├─ 3-voicesnake.js
│  └─ 4-fullsnake.js
├─ index.js
├─ package.json
├─ .env.example
└─ README.md
```
