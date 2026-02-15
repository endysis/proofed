import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Loading } from '../components/common';
import { colors, fontFamily, fontSize, spacing } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList, TabParamList, AuthStackParamList } from './types';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import PantryScreen from '../screens/PantryScreen';
import BakesScreen from '../screens/BakesScreen';
import StarredScreen from '../screens/StarredScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AttemptRouter from '../screens/AttemptRouter';
import PlanScreen from '../screens/PlanScreen';
import BakeScreen from '../screens/BakeScreen';
import EvaluateScreen from '../screens/EvaluateScreen';
import NewAttemptScreen from '../screens/NewAttemptScreen';
import ProofedItemDetailScreen from '../screens/ProofedItemDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TimerScreen from '../screens/TimerScreen';

// Auth Screens
import {
  SignInScreen,
  SignUpScreen,
  ConfirmSignUpScreen,
  ForgotPasswordScreen,
} from '../screens/auth';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgLight },
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ConfirmSignUp" component={ConfirmSignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.05)',
          height: 60 + insets.bottom,
          paddingTop: spacing[2],
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.dustyMauve,
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: fontSize.xs,
          marginTop: spacing[1],
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="home" color={color} size="md" />
          ),
        }}
      />
      <Tab.Screen
        name="Pantry"
        component={PantryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="restaurant_menu" color={color} size="md" />
          ),
        }}
      />
      <Tab.Screen
        name="Bakes"
        component={BakesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="bakery_dining" color={color} size="md" />
          ),
        }}
      />
      <Tab.Screen
        name="Starred"
        component={StarredScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="favorite" color={color} size="md" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgLight },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="AttemptDetail" component={AttemptRouter} />
      <Stack.Screen name="PlanScreen" component={PlanScreen} />
      <Stack.Screen name="BakeScreen" component={BakeScreen} />
      <Stack.Screen name="EvaluateScreen" component={EvaluateScreen} />
      <Stack.Screen name="NewAttempt" component={NewAttemptScreen} />
      <Stack.Screen name="ProofedItemDetail" component={ProofedItemDetailScreen} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ animation: 'slide_from_left' }}
      />
      <Stack.Screen name="TimerScreen" component={TimerScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading message="Loading..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
