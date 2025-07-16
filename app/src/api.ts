import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    // On web, we can just use localhost.
    return 'http://localhost:3001';
  }

  if (__DEV__) {
    // Development mode - use local server
    const hostUri = Constants.expoConfig?.hostUri;
    const localHost = hostUri ? hostUri.split(':')[0] : 'localhost';
    return `http://${localHost}:3001`;
  } else {
    // Production mode - use Railway (we'll update this URL after deployment)
    return 'https://your-railway-app.railway.app';
  }
};

export const API_URL = getApiUrl();
