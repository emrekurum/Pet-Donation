// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth, db } from '../api/firebase'; // db import edildi

// Ekranları import ediyoruz
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShelterAnimalsScreen from '../screens/ShelterAnimalsScreen';
import SelectCityScreen from '../screens/SelectCityScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
// import AnimalDetailScreen from '../screens/AnimalDetailScreen'; // İleride eklenecek

// Navigasyon yığınları için tip tanımları
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  SelectCity: { fromProfile?: boolean }; // Nereden gelindiğini belirtmek için opsiyonel parametre
  EditProfile: undefined;
  ShelterAnimals: { shelterId: string; shelterName?: string };
  AnimalDetail: { animalId: string; animalName?: string }; // İleride eklenecek
};

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const MainStackNav = createNativeStackNavigator<MainStackParamList>();

const AuthScreens = () => (
  <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNav.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStackNav.Screen name="Login" component={LoginScreen} />
    <AuthStackNav.Screen name="Register" component={RegisterScreen} />
  </AuthStackNav.Navigator>
);

// MainScreens için başlangıç rotasını AppNavigator'da belirleyeceğiz.
const MainScreensComponent = ({ initialRouteName }: { initialRouteName: keyof MainStackParamList }) => (
  <MainStackNav.Navigator
    initialRouteName={initialRouteName}
    screenOptions={{
      headerStyle: { backgroundColor: '#007bff' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
    <MainStackNav.Screen name="SelectCity" component={SelectCityScreen} options={{ title: 'Şehir Seçin/Değiştirin' }} />
    <MainStackNav.Screen name="Home" component={HomeScreen} options={{ title: 'Barınaklar' }} />
    <MainStackNav.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilim' }} />
    <MainStackNav.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Profili Düzenle' }} />
    <MainStackNav.Screen
      name="ShelterAnimals"
      component={ShelterAnimalsScreen}
      options={({ route }) => ({ title: route.params?.shelterName || 'Barınak Hayvanları' })}
    />
    {/*
    <MainStackNav.Screen
      name="AnimalDetail"
      component={AnimalDetailScreen} // Bu ekranı oluşturmanız gerekir
      options={({ route }) => ({ title: route.params.animalName || 'Hayvan Detayı' })}
    />
    */}
  </MainStackNav.Navigator>
);

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initialRoute, setInitialRoute] = useState<keyof MainStackParamList>('Home');
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoadingRoute(true);
        try {
          const userDoc = await db.collection('users').doc(currentUser.uid).get();
          if (userDoc.exists && userDoc.data()?.selectedCity) {
            setInitialRoute('Home');
          } else {
            setInitialRoute('SelectCity'); // İlk girişte veya şehir seçilmemişse
          }
        } catch (error) {
          console.error("AppNavigator: Kullanıcı şehir kontrol hatası:", error);
          setInitialRoute('SelectCity');
        } finally {
          setIsLoadingRoute(false);
        }
      } else {
        setIsLoadingRoute(false);
      }
      if (initializing) {
        setInitializing(false);
      }
    });
    return subscriber;
  }, [initializing]);

  if (initializing || (user && isLoadingRoute)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return user ? <MainScreensComponent initialRouteName={initialRoute} /> : <AuthScreens />;
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AppNavigator;
