import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ea296c88eabd41a6a0952ac2a6190f92',
  appName: 'MeshChat',
  webDir: 'dist',
  server: {
    url: 'https://ea296c88-eabd-41a6-a095-2ac2a6190f92.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    // Future BLE plugin configuration will go here
  },
};

export default config;
