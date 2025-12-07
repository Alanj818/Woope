import React, { useContext, useEffect, useState } from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
//import * as React from "react";
import 'react-native-reanimated';

//for 
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/util/AuthContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import SplashScreen from './src/screens/SplashScreen';
import NavigationBar from './src/components/NavigationBar';
import DateScreen from './src/screens/Calendar/DateScreen';


const Stack = createNativeStackNavigator();

function AppNavigation() {
  const { userToken } = useContext(AuthContext);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Simulate a splash screen delay or initial loading process
  useEffect(() => {
    setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000); // Adjust time as needed
  }, []);

  if (isInitialLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken ? (
        <>
          {/* Authenticated user screens */}
          <Stack.Screen name="NavigationBar" component={NavigationBar} />
          <Stack.Screen name="DateScreen" component={DateScreen} />
        </>
      ) : (
        <>
          {/* Unauthenticated user screens */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'slide_from_bottom' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
	return (
		<AuthProvider>
			<NavigationContainer>
				<AppNavigation/>
			</NavigationContainer>
		</AuthProvider>
	);
}
