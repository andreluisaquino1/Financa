import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.financascasal.app',
  appName: 'Financas em Casal',
  webDir: 'dist',
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-1110010077986201~4016518930'
    }
  }
};

export default config;
