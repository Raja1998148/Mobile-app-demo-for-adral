import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/lib/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/lib/constants';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="ad/[id]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
    </AuthProvider>
  );
}
