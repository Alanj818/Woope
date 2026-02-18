import React, { useContext } from "react";
import HomeScreen from "../screens/HomeScreen";
import { View } from "react-native";

import { AuthContext } from "../util/AuthContext";
import { jwtDecode } from "jwt-decode";
import { AccessToken } from "../util/token";
import ProfileSearchScreen from "../screens/ProfileSearchScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileStackNavigator from "./ProfileStackNav";
import PostDetailScreen from '../screens/PostDetailScreen';
import CreatePostScreen from '../screens/CreatePostScreen';

import BugReportScreen from "../screens/ReportScreen"

const Stack = createNativeStackNavigator();

const SearchStackNavigator = ({ ...props }) => {
  return (
    <Stack.Navigator initialRouteName={"SearchPage"} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={"SearchPage"}
        initialParams={{ headerShown: false }}
        component={ProfileSearchScreen}
      ></Stack.Screen>
      <Stack.Screen
        name={"ProfileScreenSearchNav"}
        initialParams={{ headerShown: false }}
        component={ProfileStackNavigator}
      ></Stack.Screen>
    </Stack.Navigator>
  );
};

function CommunitySideMenu() {
  let { userToken } = useContext(AuthContext);
  const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
  const currentUserID = decodedToken ? decodedToken.user_id : null;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Community Home" component={HomeScreen} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
        />
        <Stack.Screen
          name="Profile"
          children={(props) => (
            <ProfileStackNavigator {...props} userID={currentUserID} />
          )}
        />
        <Stack.Screen name="Search" component={SearchStackNavigator} />
        <Stack.Screen name="Bug Report" component={BugReportScreen} />
      </Stack.Navigator>

    </View>
  );
}

export default CommunitySideMenu;
