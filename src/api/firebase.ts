// src/api/firebase.ts
import authImport, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestoreImport, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

// Firebase Authentication instance'ını alıyoruz.
// Bu, kullanıcı giriş, kayıt, çıkış gibi işlemleri yönetir.
const authInstance: FirebaseAuthTypes.Module = authImport();

// Firebase Firestore instance'ını alıyoruz.
// Bu, veritabanı okuma ve yazma işlemleri için kullanılır.
const firestoreInstance: FirebaseFirestoreTypes.Module = firestoreImport();

// auth ve db (Firestore) instance'larını projenin diğer kısımlarında kullanmak üzere dışa aktarıyoruz.
export const auth = authInstance;
export const db = firestoreInstance;
