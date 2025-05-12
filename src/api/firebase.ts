// src/api/firebase.ts
import authImport, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestoreImport, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storageImport, { FirebaseStorageTypes } from '@react-native-firebase/storage'; // Firebase Storage eklendi

// Firebase Authentication instance'ını alıyoruz.
const authInstance: FirebaseAuthTypes.Module = authImport();

// Firebase Firestore instance'ını alıyoruz.
const firestoreInstance: FirebaseFirestoreTypes.Module = firestoreImport();

// Firebase Storage instance'ını alıyoruz.
const storageInstance: FirebaseStorageTypes.Module = storageImport();

// auth, db (Firestore) ve storage instance'larını projenin diğer kısımlarında kullanmak üzere dışa aktarıyoruz.
export const auth = authInstance;
export const db = firestoreInstance;
export const storage = storageInstance; // Storage export edildi
