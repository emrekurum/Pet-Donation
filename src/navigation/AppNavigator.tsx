// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth, db } from '../api/firebase';

// Ekranları import ediyoruz
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

// Navigasyon tipleri
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

const defaultMainStackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: '#007bff' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

const MainScreensComponent = ({ initialRouteName }: { initialRouteName: keyof MainStackParamList }) => (
  <MainStackNav.Navigator
    initialRouteName={initialRouteName}
    screenOptions={defaultMainStackScreenOptions}
  >
    <MainStackNav.Screen
      name="SelectCity"
      component={SelectCityScreen}
      options={{ title: 'Yaşadığınız Şehri Seçin' }}
    />
    <MainStackNav.Screen
      name="Home"
      component={HomeScreen}
      options={({ navigation }) => ({ // HomeScreen'e özel headerRight ekliyoruz
        title: 'Barınaklar',
        headerRight: () => (
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginRight: 15 }}>
            <Image
              source={require('../assets/default-avatar.png')} // Profil ikonu için bir resim
              style={{ width: 28, height: 28, borderRadius: 14 }}
            />
          </TouchableOpacity>
        ),
      })}
    />
    <MainStackNav.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilim' }} />
    <MainStackNav.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Profili Düzenle' }} />
    <MainStackNav.Screen
      name="AnimalTypes"
      component={AnimalTypesScreen}
      options={({ route }) => ({ title: `${route.params?.shelterName || 'Barınak'} - Türler` })}
    />
    <MainStackNav.Screen
      name="AnimalsList"
      component={AnimalsListScreen}
      options={({ route }) => ({ title: `${route.params?.shelterName} - ${route.params.animalType}` })}
    />
    <MainStackNav.Screen
      name="AnimalDetail"
      component={AnimalDetailScreen}
      options={({ route }) => ({ title: route.params?.animalName || 'Hayvan Detayı' })}
    />
  </MainStackNav.Navigator>
);

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initialRoute, setInitialRoute] = useState<keyof MainStackParamList>('SelectCity');
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
            setInitialRoute('SelectCity');
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
