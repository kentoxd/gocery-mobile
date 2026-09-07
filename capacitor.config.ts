import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gocery.mobile',
  appName: 'Go! Cery',
  // Angular's application builder outputs static files under a
  // /browser subfolder — this is what Capacitor packages into the APK.
  webDir: 'dist/go-cery-mobile/browser'
};

export default config;
