## Daisy UI + Summarization Migration Plan (to streaming-react-app)

### Goal
Migrate Daisy’s look-and-feel and after-visit summarization into the Vite-based streaming app, keeping speech-to-speech via Seamless, and dropping Daisy’s auth/recording/transcribe. Summary renders under the translated text. Client-only summary generation for now.

### Constraints
- No Next.js/SSR. Pure client-side React (Vite).
- Keep Seamless streaming and its audio I/O intact.
- Only a target-language dropdown: `eng`, `cmn`, `spa`.
- Summarize strictly from Seamless’s translated text output.

### Scope and guarantees
- Adopt shadcn + Tailwind for UI, matching Daisy aesthetics.
- Do not import Daisy auth/history/settings or recording/transcribing hooks.
- Do not change server event names or payload shapes.
- Phase-in alongside current UI to avoid breaking the build.

---

### 1) UI stack migration to shadcn (Vite)
- Add Tailwind CSS and shadcn/ui in the Vite app.
- Include minimal shadcn components: Button, Card, Select, Alert (and optional Sheet/Tabs if needed).
- Add Radix and lucide icons required by shadcn components.
- Port Daisy theme tokens (colors, radii, typography) into `src/styles/globals.css` and import once in the app entry.
- Leave existing MUI in place until cutover; remove after we switch the main UI.

### 2) Core session store (framework-agnostic state)
- State
  - `status`: `idle | connected | running | stopped`
  - `targetLanguage`: `'eng' | 'cmn' | 'spa'`
  - `transcriptText`: accumulated translated text (from Seamless `text` events)
  - `summary`: `null | { afterVisitNote, instructions[], medicationList[], patientSummary, recommendations[], standingOrder }`
  - `errors`: `{ summaryError?: string }`
- Actions
  - `setTargetLanguage`, `resetTranscript`, `appendTranscript`, `setSummary`, `clearSummary`, `setStatus`
- Lifecycle helpers
  - `onSessionStart()` → reset transcript and summary
  - `onSessionStop()` → freeze transcript and trigger summary generation

### 3) Streaming controller wrapper
- Thin controller around `StreamingClient` that exposes: `init()`, `setTargetLanguage(code)`, `start()`, `stop()`, `destroy()`.
- Event wiring
  - `status` → `store.setStatus`
  - `text` → `store.appendTranscript`
  - `preempted` → `store.setStatus('stopped')` and surface a UI notice
- Policy
  - `init()` connects and joins a room with roles `["speaker", "listener"]` (as today).
  - `start()` ensures a target language is set, calls `onSessionStart()`, then starts streaming.
  - `stop()` stops streaming, sets status `stopped`, then calls `onSessionStop()` to initiate summarization.

### 4) Client-only summarization utility
- A function that accepts `(translatedText, targetLanguage: 'eng'|'cmn'|'spa')` and returns the structured summary object.
- Use Daisy’s strict JSON schema and prompt shape (expect valid JSON in the response).
- Implement robust JSON extraction in case the model wraps JSON in additional text.
- Config via `import.meta.env`:
  - `VITE_OPENAI_API_KEY` (required)
  - `VITE_OPENAI_MODEL` (optional, default reasonable model)
- Trigger once on `stop`, using the store’s final `transcriptText` and `targetLanguage`.
- Set loading/error in store and persist result with `store.setSummary`.
- Security note: Browser-side key exposure is acceptable for now per requirement; document risks and plan a server proxy later.

### 5) New shadcn-based UI (Daisy-like)
- Component: `DaisyLikeInterface` (added alongside `MinimalInterface` initially).
- Layout
  - Header with Daisy logo and light shell styling.
  - Controls row: Start button, Stop button, shadcn `Select` for target language (values: `eng`, `cmn`, `spa`).
  - Transcript panel: shows live translated text while running.
  - Summary card: appears below transcript after stop; shows loading state while generating; provides copy and download actions.
- No login/settings/history. No Daisy mic or recording components.

### 6) Integration and safe rollout
- Add `DaisyLikeInterface` without removing the current `MinimalInterface`.
- Switch via a simple boolean/env flag in `src/App.tsx` to select which interface renders.
- Ensure all new modules are imported/used to avoid unused TS/lint warnings.
- After validation, replace usage of `MinimalInterface` with `DaisyLikeInterface`, then remove MUI references and uninstall MUI.

### 7) Language handling
- Dropdown values must be exactly what Seamless expects: `'eng'`, `'cmn'`, `'spa'`.
- On change: update store and call `controller.setTargetLanguage(code)` immediately.
- Disable Start until a target language is set.

### 8) Build and configuration
- Tailwind + PostCSS configured for Vite; import `globals.css` once.
- Add Radix and lucide dependencies required by shadcn components.
- Add OpenAI client dependency or use `fetch` to call the REST endpoint; prefer `fetch` to minimize bundle size.
- Keep TypeScript `SummaryResult` aligned with Daisy’s schema.

### 9) Acceptance criteria
- Dev and production builds succeed.
- Start/Stop control streaming as before; audio output continues to play; preemption notice still appears if applicable.
- Target language dropdown limited to `eng`/`cmn`/`spa` and updates Seamless config live.
- Transcript updates live during streaming.
- After Stop, the summary appears beneath the translated text; copy/download work.
- No server routes required; all summary logic is client-side.
- No Daisy auth/recording/transcribe modules in use.

### 10) Post-cutover cleanup (later)
- Remove MUI and unused files once the new UI is stable.
- Optionally move summarization to a server proxy or serverless function to hide API keys.
- Add lightweight tests for summarization parsing and store reducers.

### Environment variables (example)
```
VITE_OPENAI_API_KEY=your_key_here
VITE_OPENAI_MODEL=gpt-4o-mini
```

### Notes
- We intentionally ignore dynamic capability language lists from the server to keep the dropdown fixed to three options.
- We do not alter event names or payloads from the existing `StreamingClient`.



