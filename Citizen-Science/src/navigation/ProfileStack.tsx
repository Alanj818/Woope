//for profile screens and sub-screens
//This may not be needed if there are no sub screen
//COME BACK TO THIS
import React, { useContext, useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import { AuthContext } from '../util/AuthContext';
import jwtDecode from 'jwt-decode';
import { AccessToken } from '../util/token';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  const { userToken } = useContext(AuthContext);
  const initialParams = useMemo(() => {
    try {
      if (!userToken) return { userID: null };
      const decoded = jwtDecode<AccessToken>(userToken);
      return { userID: decoded?.user_id ?? null };
    } catch {
      return { userID: null };
    }
  }, [userToken]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} initialParams={initialParams}/>
    </Stack.Navigator>
  );
}
