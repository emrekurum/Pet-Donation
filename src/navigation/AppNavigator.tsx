// src/navigation/AppNavigator.tsx
import React from 'react'; // useEffect ve useState kaldırıldı, çünkü AppNavigator'da kullanılmıyor
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Firebase importları burada genellikle gerekmez, App.tsx veya ilgili ekranlarda olmalı
// import { FirebaseAuthTypes } from '@react-native-firebase/auth';
// import { auth, db } from '../api/firebase';

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
import MyDonationsScreen from '../screens/MyDonationsScreen'; // Yeni ekran import edildi
import MyVirtualAdoptionsScreen from '../screens/MyVirtualAdoptionsScreen'; // Yeni ekran import edildi

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
  MyDonations: undefined; // Yeni ekran eklendi
  MyVirtualAdoptions: undefined; // Yeni ekran eklendi
  // Diğer ekranlarınız ve parametreleri buraya eklenebilir
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

// defaultMainStackScreenOptions App.tsx'ten alındı, burada da kullanılabilir veya App.tsx'e taşınabilir
// const defaultMainStackScreenOptions: NativeStackNavigationOptions = {
//   headerStyle: { backgroundColor: '#007bff' },
//   headerTintColor: '#fff',
//   headerTitleStyle: { fontWeight: 'bold' },
// };

// MainScreensComponent App.tsx içinde tanımlanmıştı,
// eğer AppNavigator'ı ayrı bir dosyada tutuyorsanız ve App.tsx'te kullanıyorsanız,
// bu bileşenin App.tsx'te kalması veya oradan import edilmesi daha uygun olabilir.
// Şimdilik, AppNavigator'ın ana yapısını gösteriyorum.

// Eğer AppNavigator'ınız ana navigasyon konteynerini içeriyorsa:
// import { NavigationContainer } from '@react-navigation/native';
// const AppNavigator = () => {
//   const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
//   // ... (kullanıcı oturumunu dinleme mantığı) ...
//   return (
//     <NavigationContainer>
//       {user ? <MainScreens /> : <AuthScreens />}
//     </NavigationContainer>
//   );
// };

// Veya sadece Stack'leri export ediyorsanız:
export const MainScreensStack = () => (
  <MainStackNav.Navigator
    // initialRouteName={initialRouteName} // Bu App.tsx'ten yönetilebilir
    // screenOptions={defaultMainStackScreenOptions} // Bu App.tsx'ten yönetilebilir
  >
    <MainStackNav.Screen name="Home" component={HomeScreen} options={{ title: 'Barınaklar' /* headerRight vb. ayarlar App.tsx'te olabilir */ }} />
    <MainStackNav.Screen name="SelectCity" component={SelectCityScreen} options={{ title: 'Yaşadığınız Şehri Seçin' }} />
    <MainStackNav.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilim' }} />
    <MainStackNav.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Profili Düzenle' }} />
    <MainStackNav.Screen name="AnimalTypes" component={AnimalTypesScreen} options={({ route }) => ({ title: `${route.params?.shelterName || 'Barınak'} - Türler` })} />
    <MainStackNav.Screen name="AnimalsList" component={AnimalsListScreen} options={({ route }) => ({ title: `${route.params?.shelterName} - ${route.params.animalType}` })} />
    <MainStackNav.Screen name="AnimalDetail" component={AnimalDetailScreen} options={({ route }) => ({ title: route.params?.animalName || 'Hayvan Detayı' })} />
    {/* YENİ EKRANLAR EKLENDİ */}
    <MainStackNav.Screen name="MyDonations" component={MyDonationsScreen} options={{ title: 'Yaptığım Bağışlar' }} />
    <MainStackNav.Screen name="MyVirtualAdoptions" component={MyVirtualAdoptionsScreen} options={{ title: 'Sanal Sahiplendiklerim' }} />
  </MainStackNav.Navigator>
);

// Ana AppNavigator'ınızın yapısına göre bu export'u düzenleyin.
// Genellikle App.tsx içinde <NavigationContainer> kullanılır ve bu stack'ler orada çağrılır.
// export default AppNavigator; // Eğer AppNavigator ana konteyner ise
