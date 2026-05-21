import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Configuración de Firebase adaptada para el entorno móvil de Expo con fallback a producción
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyB0exDYw3gzbQ_Q2-2esebGHO_2Kv_f5w4",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "glow-heaven-70070.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "glow-heaven-70070",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "glow-heaven-70070.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "903730906709",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:903730906709:web:ba164dc1cd433311ad36dc",
};

// Validación de variables de entorno para desarrollo
const missingVars: string[] = [];
if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY) missingVars.push("EXPO_PUBLIC_FIREBASE_API_KEY");
if (!process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN) missingVars.push("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN");
if (!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) missingVars.push("EXPO_PUBLIC_FIREBASE_PROJECT_ID");
if (!process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET) missingVars.push("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET");
if (!process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) missingVars.push("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
if (!process.env.EXPO_PUBLIC_FIREBASE_APP_ID) missingVars.push("EXPO_PUBLIC_FIREBASE_APP_ID");

if (missingVars.length > 0) {
  console.info(
    `ℹ️ [Firebase Mobile Config Info]\n` +
    `No se detectaron variables locales en process.env. Se utilizarán las credenciales de producción de Glow Heaven de forma predeterminada.`
  );
}

// Inicialización controlada de la aplicación Firebase
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Error crítico al inicializar la aplicación de Firebase en entorno móvil:", error);
  app = {} as any;
}

// Inicialización y exportación de servicios
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
