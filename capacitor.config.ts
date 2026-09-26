import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mycoder.bk',
  appName: 'BKCode',
  webDir: 'www',
  server: {
    url: 'http://127.0.0.1:8080',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
