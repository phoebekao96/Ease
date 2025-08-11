# 🚀 Streaming React App

## Getting Started

This project uses the [Yarn Package Manager](https://yarnpkg.com/).

1. `yarn` - Install project dependencies
2. `yarn run dev` - Run the app with a development server that supports hot module reloading

NOTE: You will either need to provide the server URL via environment variable (you can use the `.env` file for this) or via a url param when you load the react app (example: `http://localhost:5173/?serverURL=localhost:8000`)

## SDK Usage (for future UI)

The UI is now powered by a framework-agnostic SDK under `src/sdk/`. A future UI can plug and play using the following API.

```ts
import {StreamingClient} from './sdk';

const client = new StreamingClient();

await client.init(); // connects, auto-joins a room
await client.setTargetLanguage('eng');

client.on('text', (t) => console.log('TEXT:', t));
client.on('speech', (samples, sr) => {/* buffered playback handled internally */});

await client.start(); // begin capture and streaming
// ... later
await client.stop();
```

### Events
- `text(payload: string)` — translated text
- `speech(samples: number[], sampleRate: number)` — audio chunks (also auto-played by SDK)
- `status(status: 'idle'|'connected'|'running'|'stopped'|'disconnected')`
- `preempted()` — server locked by someone else; SDK auto-stops
- `capabilities(agentsCapabilities)` — server-advertised models/langs
- `room(roomState)` — room updates (not used by the minimal UI)

### Notes
- Rooms are created automatically on `init()` when no `roomID` is provided.
- Non-essential config is hardcoded: output mode `'s2s&t'`, async processing, buffer limit `1`, mono `getUserMedia`.
- On reconnect, if streaming, the SDK will attempt to resume by re-sending config.

## URL Parameters

You can provide URL parameters in order to change the behavior of the app. Those are documented in [URLParams.ts](src/URLParams.ts).
