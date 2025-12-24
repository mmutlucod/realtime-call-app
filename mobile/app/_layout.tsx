// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

// WebRTC uyarılarını kapat
LogBox.ignoreLogs(['new NativeEventEmitter']);
LogBox.ignoreAllLogs();

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="lobby" options={{ headerShown: false }} />
      <Stack.Screen 
        name="call/[id]" 
        options={{ 
          headerShown: false,
          gestureEnabled: false, // Geri swipe'ı kapat
        }} 
      />
    </Stack>
  );
}