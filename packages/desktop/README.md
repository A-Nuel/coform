# Coform Desktop (Tauri)

This package wraps the React frontend with Tauri for a native desktop experience.

## Setup

```bash
# From repo root
npm install
cd packages/desktop
# Follow Tauri 2 init steps (tauri init) and point the frontend dist to ../frontend/dist
```

## Development

```bash
npm run tauri dev
```

The desktop build can also spawn the local Python backend as a side process for fully offline operation.
