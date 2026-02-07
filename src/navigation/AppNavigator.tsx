import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

// Screens
import { MapScreen } from '../screens/MapScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PostCreateScreen } from '../screens/PostCreateScreen';

// Types
import { RootStackParamList } from '../types';
import { COLORS, FONT_SIZE } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondaryText,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: FONT_SIZE.lg,
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: '地圖',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          title: '探索',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🔍</Text>,
        }}
      />
      <Tab.Screen
        name="PostCreate"
        component={PostCreateScreen}
        options={{
          title: '發文',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>➕</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '個人',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={TabNavigator} />
        {/* 可以在這裡添加其他堆疊畫面，如 PostDetail */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
