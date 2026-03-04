import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import NavigationBar from "./NavigationBar";
import DateScreen from "../screens/Calendar/DateScreen";

export type AppStackParamList = {
  Main: undefined;
  DateScreen: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={NavigationBar} />
      <Stack.Screen name="DateScreen" component={DateScreen} />
    </Stack.Navigator>
  );
}
