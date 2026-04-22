import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "./src/util/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { PaletteProvider } from './src/theme/paletteController';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaletteProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaletteProvider>
    </GestureHandlerRootView>
  );
}