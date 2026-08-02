# Coform Mobile (Capacitor)

Reuses the same React frontend via Capacitor for iOS and Android.

## Setup

```bash
cd packages/frontend
npm run build
npx cap init
npx cap add android
npx cap add ios
npx cap sync
```

## Run

```bash
npx cap open android
# or
npx cap open ios
```
