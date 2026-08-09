import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const defaultDb = getFirestore(app);

// --- Autenticación (Paso 2: login real) ---
// Cada miembro del CEH debe tener una cuenta creada en Firebase Console >
// Authentication > Users (correo + contraseña). Ya no hay contraseñas
// hardcodeadas en el código ni sesión anónima automática: solo entra quien
// tiene una cuenta real dada de alta por el administrador.
export const auth = getAuth(app);

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export const resetPasswordEmail = (email: string) =>
  sendPasswordResetEmail(auth, email.trim());

export const logout = () => signOut(auth);

// Se resuelve solo cuando hay un usuario real (no anónimo) autenticado.
// AppContext espera esta promesa antes de leer/escribir en Firestore, así
// que la sincronización con la nube no arranca hasta que alguien inicie
// sesión de verdad.
export const authReady: Promise<void> = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous) {
      unsubscribe();
      resolve();
    }
  });
});

export default app;
