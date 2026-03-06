// ApiConfig.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get local IP from Expo Constants if available (for mobile development)
// If running on physical device, this points to your computer's IP
const debuggerHost = Constants.expoConfig?.hostUri;
const localIp = debuggerHost ? debuggerHost.split(':')[0] : "10.147.16.46"; 

const BASE_IP = Platform.OS === 'web' ? 'localhost' : localIp; 
export const SERVER_URL = `http://${BASE_IP}:3000`;

console.log(`[API] SERVER_URL is set to: ${SERVER_URL}`);