// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Ekranlar
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SelectCityScreen from '../screens/SelectCityScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AnimalTypesScreen from '../screens/AnimalTypesScreen';
import AnimalsListScreen from '../screens/AnimalsListScreen';
import AnimalDetailScreen from '../screens/AnimalDetailScreen';
import MyDonationsScreen from '../screens/MyDonationsScreen';
import MyVirtualAdoptionsScreen from '../screens/MyVirtualAdoptionsScreen';
import WalletScreen from '../screens/WalletScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  SelectCity: { fromProfile?: boolean; navigateToHomeOnSave?: boolean };
  EditProfile: undefined;
  AnimalTypes: { shelterId: string; shelterName?: string };
  AnimalsList: { shelterId: string; shelterName?: string; animalType: string };
  AnimalDetail: { animalId: string; animalName?: string };
  MyDonations: undefined;
  MyVirtualAdoptions: undefined;
  WalletScreen: undefined;
};

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const MainStackNav = createNativeStackNavigator<MainStackParamList>();

const AuthScreensStack = () => (
  <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNav.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStackNav.Screen name="Login" component={LoginScreen} />
    <AuthStackNav.Screen name="Register" component={RegisterScreen} />
  </AuthStackNav.Navigator>
);

const defaultMainStackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: '#007bff' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

const MainScreensStackComponent = ({ initialRouteName }: { initialRouteName: keyof MainStackParamList }) => (
  <MainStackNav.Navigator
    initialRouteName={initialRouteName}
    screenOptions={defaultMainStackScreenOptions}
  >
    <MainStackNav.Screen name="Home" component={HomeScreen} options={{ title: 'Barınaklar' }} />
    <MainStackNav.Screen name="SelectCity" component={SelectCityScreen} options={{ title: 'Şehir Seç' }} />
    <MainStackNav.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilim' }} />
    <MainStackNav.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Profili Düzenle' }} />
    <MainStackNav.Screen
      name="AnimalTypes"
      component={AnimalTypesScreen}
      options={({ route }) => ({
        title: `${route.params?.shelterName || 'Barınak'} - Türler`,
      })}
    />
    <MainStackNav.Screen
      name="AnimalsList"
      component={AnimalsListScreen}
      options={({ route }) => ({
        title: `${route.params?.shelterName} - ${route.params.animalType}`,
      })}
    />
    <MainStackNav.Screen
      name="AnimalDetail"
      component={AnimalDetailScreen}
      options={({ route }) => ({
        title: route.params?.animalName || 'Hayvan Detayı',
      })}
    />
    <MainStackNav.Screen name="MyDonations" component={MyDonationsScreen} options={{ title: 'Yaptığım Bağışlar' }} />
    <MainStackNav.Screen name="MyVirtualAdoptions" component={MyVirtualAdoptionsScreen} options={{ title: 'Sanal Sahiplendiklerim' }} />
    <MainStackNav.Screen name="WalletScreen" component={WalletScreen} options={{ title: 'Cüzdanım' }} />
  </MainStackNav.Navigator>
);

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initialRoute, setInitialRoute] = useState<keyof MainStackParamList>('SelectCity');
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

  function onAuthStateChanged(userAuth: FirebaseAuthTypes.User | null) {
    console.log('[AppNavigator] onAuthStateChanged çağrıldı. User:', userAuth);
    setUser(userAuth);
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // Önemli! subscriber() değil.
  }, []);

  useEffect(() => {
    const checkUserCityAndSetRoute = async () => {
      if (user && !initializing) {
        setIsLoadingRoute(true);
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists && userDoc.data()?.selectedCity) {
            setInitialRoute('Home');
          } else {
            setInitialRoute('SelectCity');
          }
        } catch (error) {
          console.error("[AppNavigator] Kullanıcı şehir kontrol hatası:", error);
          setInitialRoute('SelectCity');
        } finally {
          setIsLoadingRoute(false);
        }
      } else if (!user && !initializing) {
        setIsLoadingRoute(false);
      }
    };
    checkUserCityAndSetRoute();
  }, [user, initializing]);

  if (initializing || (user && isLoadingRoute)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return user ? (
    <MainScreensStackComponent key={`main-${user?.uid}`} initialRouteName={initialRoute} />
  ) : (
    <AuthScreensStack key="auth-stack" />
  );
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AppNavigator;
