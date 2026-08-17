import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.coform.app",
  appName: "Coform",
  // Points to the shared frontend build output
  webDir: "../frontend/dist",
  server: {
    // During dev, point to live Vite server for hot reload
    // Comment this out for production builds
    // url: "http://YOUR_LOCAL_IP:5173",
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#020617", // matches slate-950
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#020617",
    },
  },
  android: {
    buildOptions: {
      releaseType: "APK",
    },
  },
};

export default config;
