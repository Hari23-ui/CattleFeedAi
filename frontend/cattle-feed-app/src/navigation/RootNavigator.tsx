import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { LoadingView } from '../components/LoadingView';
import { useAuth } from '../hooks/useAuth';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingView message="Restoring farm session..." fullScreen={true} />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
