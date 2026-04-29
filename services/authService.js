import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const secureSet = async (key, value) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const secureGet = async (key) => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const secureDelete = async (key) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:5000'
  : 'http://172.20.10.6:5000';

export const signup = async (email, password) => {
  const url = `${API_URL}/signup`;
  console.log('[authService] signup -> calling URL:', url);
  console.log('[authService] signup -> payload:', { email, password: password ? '***' : 'EMPTY' });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('[authService] signup -> raw response status:', res.status);

    const data = await res.json();
    console.log('[authService] signup -> parsed data:', data);

    return data;
  } catch (err) {
    console.error('[authService] signup -> CATCH error:', err);
    console.error('[authService] signup -> error message:', err.message);
    throw new Error('Cannot reach server. Make sure you are connected to the same network.');
  }
};

export const login = async (email, password) => {
  const url = `${API_URL}/login`;
  console.log('[authService] login -> calling URL:', url);
  console.log('[authService] login -> payload:', { email, password: password ? '***' : 'EMPTY' });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('[authService] login -> raw response status:', res.status);

    const data = await res.json();
    console.log('[authService] login -> success:', !!data.accessToken);

    if (data.accessToken) {
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await secureSet('refreshToken', data.refreshToken);
    }

    return data;
  } catch (err) {
    console.error('[authService] login -> CATCH error:', err);
    console.error('[authService] login -> error message:', err.message);
    throw new Error('Cannot reach server. Make sure you are connected to the same network.');
  }
};

export const logout = async () => {
  await AsyncStorage.removeItem('accessToken');
  await secureDelete('refreshToken');
};

export const makeRequest = async (url, options) => {
  const accessToken = await AsyncStorage.getItem('accessToken');

  let res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    const refreshToken = await secureGet('refreshToken');
    const refreshRes = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const { accessToken: newToken } = await refreshRes.json();
    await AsyncStorage.setItem('accessToken', newToken);

    res = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${newToken}` },
    });
  }

  return res;
};