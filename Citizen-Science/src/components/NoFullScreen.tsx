import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";


//On android the application extend the whole screen (ie the phone's home button, and top icon bar)
//This is using SafeAreaView Component to stop that 
export default function NoFullScreen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {children}
    </SafeAreaView>
  );
}
