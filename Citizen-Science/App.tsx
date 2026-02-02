import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import "react-native-reanimated";

import { AuthProvider } from "./src/util/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";

import { PaletteProvider} from './src/theme/paletteController';


export default function App() {
  return (
    <PaletteProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaletteProvider>
  );
}