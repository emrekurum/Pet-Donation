// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native'; // TouchableOpacity ve Image kaldırıldı (bu dosyada kullanılmıyor)
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth, db } from '../api/firebase'; // Firebase importlarınızın doğru olduğundan emin olun

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
import MyDonationsScreen from '../screens/MyDonationsScreen'; // YENİ EKRAN IMPORT EDİLDİ
import MyVirtualAdoptionsScreen from '../screens/MyVirtualAdoptionsScreen'; // YENİ EKRAN IMPORT EDİLDİ

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
  MyDonations: undefined; // YENİ EKRAN EKLENDİ
  MyVirtualAdoptions: undefined; // YENİ EKRAN EKLENDİ
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
  headerStyle: { backgroundColor: '#007bff' }, // Ana header rengi
  headerTintColor: '#fff', // Header yazı ve ikon rengi
  headerTitleStyle: { fontWeight: 'bold' }, // Header başlık stili
};

const MainScreensComponent = ({ initialRouteName }: { initialRouteName: keyof MainStackParamList }) => (
  <MainStackNav.Navigator
    initialRouteName={initialRouteName}
    screenOptions={defaultMainStackScreenOptions} // Tüm ekranlar için varsayılan seçenekler
  >
    <MainStackNav.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Barınaklar',
        // headerRight: () => ( /* Eğer özel bir headerRight bileşeni varsa */ )
      }}
    />
    <MainStackNav.Screen
      name="SelectCity"
      component={SelectCityScreen}
      options={{ title: 'Yaşadığınız Şehri Seçin' }}
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
    {/* YENİ EKRANLAR STACK'E EKLENDİ */}
    <MainStackNav.Screen
      name="MyDonations"
      component={MyDonationsScreen}
      options={{ title: 'Yaptığım Bağışlar' }}
    />
    <MainStackNav.Screen
      name="MyVirtualAdoptions"
      component={MyVirtualAdoptionsScreen}
      options={{ title: 'Sanal Sahiplendiklerim' }}
    />
  </MainStackNav.Navigator>
);

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initialRoute, setInitialRoute] = useState<keyof MainStackParamList>('SelectCity'); // Varsayılan olarak şehir seçimi
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoadingRoute(true);
        try {
          // Kullanıcının Firestore'da bir şehir seçip seçmediğini kontrol et
          const userDoc = await db.collection('users').doc(currentUser.uid).get();
          if (userDoc.exists && userDoc.data()?.selectedCity) {
            setInitialRoute('Home'); // Şehir seçilmişse Ana Sayfa'ya yönlendir
          } else {
            setInitialRoute('SelectCity'); // Şehir seçilmemişse Şehir Seçimi'ne yönlendir
          }
        } catch (error) {
          console.error("AppNavigator: Kullanıcı şehir kontrol hatası:", error);
          setInitialRoute('SelectCity'); // Hata durumunda da şehir seçimine yönlendir
        } finally {
          setIsLoadingRoute(false);
        }
      } else {
        // Kullanıcı yoksa (çıkış yapmışsa veya ilk defa giriyorsa) AuthStack'e yönlendirilecek,
        // bu yüzden initialRoute'un MainStack için ne olduğu önemli değil, ama yine de ayarlayalım.
        setInitialRoute('SelectCity'); // veya 'Home'
        setIsLoadingRoute(false);
      }
      if (initializing) {
        setInitializing(false);
      }
    });
    return subscriber; // useEffect cleanup
  }, [initializing]); // Bağımlılık doğru

  if (initializing || (user && isLoadingRoute)) {
    // Kullanıcı varsa ve initialRoute hala yükleniyorsa yükleme ekranı göster
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // NavigationContainer genellikle App.tsx'in en dışında olur.
  // Eğer AppNavigator.tsx dosyanız uygulamanızın kök navigatörü ise
  // NavigationContainer'ı buraya ekleyebilirsiniz.
  // import { NavigationContainer } from '@react-navigation/native';
  // return (
  //   <NavigationContainer>
  //     {user ? <MainScreensComponent initialRouteName={initialRoute} /> : <AuthScreens />}
  //   </NavigationContainer>
  // );

  // Eğer bu dosya sadece stack'leri tanımlayıp App.tsx'te kullanılıyorsa:
  return user ? <MainScreensComponent initialRouteName={initialRoute} /> : <AuthScreens />;
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AppNavigator; // AppNavigator'ı default olarak export ediyoruz
