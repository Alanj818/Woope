//used in the NavigationBar.tsx
//has all screens for the resource page
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ResourceHome from '../screens/Organizations/ResourceHome';
import OrganizationCategory from '../screens/Organizations/OrganizationCategory';
import OrganizationFollowed from '../screens/Organizations/OrganizationFollowed';
import OrganizationSearch from '../screens/Organizations/OrganizationSearch';
import SpecificCategory from '../screens/Organizations/SpecificCategory';
import OrganizationProfile from '../screens/Organizations/OrganizationProfile';
import ResourceProfile from '../screens/Organizations/ResourceProfile';
import ManageOrganizations from '../screens/Organizations/ManageOrganizations';
import CreateOrganization from '../screens/Organizations/CreateOrganization';
import CreateCategory from '../screens/Organizations/CreateCategory';
import FeatureOrganization from '../screens/Organizations/FeatureOrganization';
import EventHome from '../screens/Events/EventHome';

const Stack = createNativeStackNavigator();

export default function ResourceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ResourceHome" component={ResourceHome}/>
      <Stack.Screen name="OrganizationCategory" component={OrganizationCategory}/>
      <Stack.Screen name="OrganizationFollowed" component={OrganizationFollowed}/>
      <Stack.Screen name="OrganizationSearch" component={OrganizationSearch}/>
      <Stack.Screen name="SpecificCategory" component={SpecificCategory}/>
      <Stack.Screen name="OrganizationProfile" component={OrganizationProfile}/>
      <Stack.Screen name="ResourceProfile" component={ResourceProfile}/>
      <Stack.Screen name="ManageOrganizations" component={ManageOrganizations}/>
      <Stack.Screen name="CreateOrganization" component={CreateOrganization}/>
      <Stack.Screen name="CreateCategory" component={CreateCategory}/>
      <Stack.Screen name="FeatureOrganization" component={FeatureOrganization}/>
      <Stack.Screen name="EventHome" component={EventHome}/>
    </Stack.Navigator>
  );
}