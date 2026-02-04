import {
  DrawerContentScrollView,
  DrawerItemList,
  createDrawerNavigator,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";

import React, { useContext } from "react";
import { getHeaderTitle } from "@react-navigation/elements";
import ScreenHeader from "./ScreenHeader";
import HomeScreen from "../screens/HomeScreen";
import { View } from "react-native";
import { DrawerNavigationState, ParamListBase } from "@react-navigation/native";
import Logout from "./Logout";

import { AuthContext } from "../util/AuthContext";
import { jwtDecode } from "jwt-decode";
import { AccessToken } from "../util/token";
import ProfileSearchScreen from "../screens/ProfileSearchScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileStackNavigator from "./ProfileStackNav";
import PostDetailScreen from '../screens/PostDetailScreen';

import BugReportScreen from "../screens/ReportScreen"

const Drawer = createDrawerNavigator();

function CustomDrawerSideMenu(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <Logout />
    </DrawerContentScrollView>
  );
}

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
      <Drawer.Navigator
        screenOptions={{
          header: ({ navigation, route, options }) => {
            const title = getHeaderTitle(options, route.name);

            return <ScreenHeader  navigation={navigation} />;
          },
        }}
        drawerContent={(props) => <CustomDrawerSideMenu {...props} />}
      >
        <Drawer.Screen name="Community Home" component={HomeScreen} />
        <Drawer.Screen
          name="PostDetail"
          component={PostDetailScreen}
          options={{
            // hide from drawer list
            drawerItemStyle: { height: 0 },
            drawerLabel: () => null,
          }}
        />

        <Drawer.Screen name="Profile" children={(props) => ( 
          <ProfileStackNavigator {...props} userID={currentUserID} />
          )}
        />
        
        <Drawer.Screen
          name="Search"
          component={SearchStackNavigator}
        ></Drawer.Screen>

        <Drawer.Screen name="Bug Report" component={BugReportScreen} />
      </Drawer.Navigator>

    </View>
  );
}

export default CommunitySideMenu;
