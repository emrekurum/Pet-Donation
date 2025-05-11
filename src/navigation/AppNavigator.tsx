// src/navigation/AppNavigator.tsx
import React, {useState, useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {auth} from '../api/firebase';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Navigasyon yığınları için tip tanımları
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  // Diğer ana uygulama ekranları buraya eklenecek
  // Örneğin: ShelterList: undefined; AnimalDetail: { animalId: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

// Auth yığını
const AuthScreens = () => (
  <AuthStack.Navigator screenOptions={{headerShown: false}}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Ana uygulama yığını
const MainScreens = () => (
  <MainStack.Navigator
    screenOptions={{
      headerStyle: {backgroundColor: '#007bff'},
      headerTintColor: '#fff',
      headerTitleStyle: {fontWeight: 'bold'},
    }}>
    <MainStack.Screen
      name="Home"
      component={HomeScreen}
      options={{title: 'Ana Sayfa'}}
    />
    <MainStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{title: 'Profilim'}}
    />
  </MainStack.Navigator>
);

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });
    return subscriber; // unsubscribe on unmount
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // NavigationContainer App.tsx içinde olduğu için burada sadece doğru yığını render ediyoruz.
  return user ? <MainScreens /> : <AuthScreens />;
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
