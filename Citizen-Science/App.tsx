import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/util/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { PaletteProvider } from './src/theme/paletteController';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#FFFFFF", },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaletteProvider>
          <AuthProvider>
            <NavigationContainer theme = {navTheme}>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </PaletteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}