import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Check if biometric auth is available
export const isBiometricAvailable = async () => {
  return await LocalAuthentication.hasHardwareAsync() && 
         await LocalAuthentication.isEnrolledAsync();
};

// Authenticate user
export const authenticate = async () => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access POS',
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
  });
  return result.success;
};

// Store lock preference
export const setLockPreference = async (value) => {
  await SecureStore.setItemAsync('lockEnabled', value.toString());
};

// Get lock preference
export const getLockPreference = async () => {
  const value = await SecureStore.getItemAsync('lockEnabled');
  return value === 'true';
};