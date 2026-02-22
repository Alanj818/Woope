import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: "fade" }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: "slide_from_bottom" }} />
    </Stack.Navigator>
  );
}
