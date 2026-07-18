# Mochi — Talking Cat PWA

A child-friendly talking cat game built with the same core stack as Jigsnap: React, Vite, Tailwind CSS, and `vite-plugin-pwa`, with a FastAPI endpoint for secure OpenAI Realtime voice sessions.

## Features

- **Copy Me:** Records a short phrase locally, then repeats it in a funny high-pitched voice.
- **Talk With Me:** Optional OpenAI Realtime speech conversation with a strict child-safe cat personality.
- **Privacy-first controls:** Conversation mic is muted unless the talk button is held. Mimic recordings are not uploaded and are deleted after playback.
- **Installable PWA:** Offline-capable mimic mode after the first load.
- **Parent gate:** Protects settings and installation instructions.

## Vercel setup

1. Import this repository into Vercel.
2. Keep the detected framework as **Vite**.
3. Add `OPENAI_API_KEY` under **Project Settings → Environment Variables** for Production, Preview, and Development.
4. Redeploy after saving the key.

The app works without an API key in Copy Me mode. Never put the OpenAI key in a `VITE_` variable or in frontend code.

## Local development

```bash
npm install
npm run dev
```

For the frontend and FastAPI routes together, use `vercel dev`.
