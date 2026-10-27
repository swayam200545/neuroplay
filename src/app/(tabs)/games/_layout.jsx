import { Stack } from "expo-router";

export default function GamesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="memory-match" />
      <Stack.Screen name="reaction-test" />
      <Stack.Screen name="focus-filter" />
      <Stack.Screen name="pattern-repeat" />
      <Stack.Screen name="number-recall" />
      <Stack.Screen name="logic-puzzle" />
      <Stack.Screen name="speed-math" />
      <Stack.Screen name="color-word" />
      <Stack.Screen name="word-flash" />
      <Stack.Screen name="sequence-iq" />
      <Stack.Screen name="dual-task" />
      <Stack.Screen name="mental-math-pro" />
      <Stack.Screen name="matrix-iq" />
      <Stack.Screen name="chaos-math" />
      <Stack.Screen name="speed-memory" />
      <Stack.Screen name="brain-storm" />
      <Stack.Screen name="neural-nexus" />
      <Stack.Screen name="hex-direction" />
      <Stack.Screen name="weekly-test" />
      <Stack.Screen name="weekly-results" />
    </Stack>
  );
}
