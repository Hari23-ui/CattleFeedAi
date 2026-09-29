import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '../constants/theme';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen onNavigateToRegister={() => navigation.navigate('Register')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {({ navigation }) => (
          <RegisterScreen onNavigateToLogin={() => navigation.navigate('Login')} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AuthNavigator;
