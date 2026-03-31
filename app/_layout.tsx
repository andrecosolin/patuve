import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors } from "@/constants/theme";
import { CandidaturasProvider } from "@/context/CandidaturasContext";
import { SavedJobsProvider } from "@/context/SavedJobsContext";

export default function RootLayout() {
  return (
    <SavedJobsProvider>
      <CandidaturasProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerShown: false,
          }}
        />
      </CandidaturasProvider>
    </SavedJobsProvider>
  );
}
