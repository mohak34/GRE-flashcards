import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    // On web, we can just use localhost.
    return 'http://localhost:3001';
  }

  // On mobile, we need to use the IP address of the machine running Metro.
  // Constants.expoConfig.hostUri should contain this, e.g., "192.168.1.100:8081"
  // We just need to extract the IP address part.
  const hostUri = Constants.expoConfig?.hostUri;
  const localHost = hostUri ? hostUri.split(':')[0] : 'localhost';

  return `http://${localHost}:3001`;
};

export const API_URL = getApiUrl();
