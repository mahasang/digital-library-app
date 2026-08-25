import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="research/[slug]" />
      <Stack.Screen name="research/[slug]/pdf" />
    </Stack>
  );
}
