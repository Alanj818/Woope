import React, { useContext } from "react";

import { AuthContext } from "../util/AuthContext";
import SplashScreen from "../screens/SplashScreen";
import AuthNavigation from "./AuthNavigation";
import AppNavigation from "./AppNavigation";

export default function RootNavigator() {
  const { userToken, isAuthLoading } = useContext(AuthContext);

  if (isAuthLoading) {
    return <SplashScreen />;
  }

  return userToken ? <AppNavigation /> : <AuthNavigation />;
}
