import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // Check if we're in production (web deployment)
  if (process.env.NODE_ENV === 'production' || Platform.OS === 'web') {
    return process.env.REACT_APP_API_URL || 'https://flashcards-api.cooperelixer.tech';
  }

  // Development mode
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }

  // On mobile, we need to use the IP address of the machine running Metro.
  const hostUri = Constants.expoConfig?.hostUri;
  const localHost = hostUri ? hostUri.split(':')[0] : 'localhost';

  return `http://${localHost}:3001`;
};

export const API_URL = getApiUrl();
