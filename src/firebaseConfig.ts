import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Objeto de configuración mapeando las variables de entorno de Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validación minuciosa de variables de entorno para desarrollo
const missingVars: string[] = [];
if (!firebaseConfig.apiKey) missingVars.push("VITE_FIREBASE_API_KEY");
if (!firebaseConfig.authDomain) missingVars.push("VITE_FIREBASE_AUTH_DOMAIN");
if (!firebaseConfig.projectId) missingVars.push("VITE_FIREBASE_PROJECT_ID");
if (!firebaseConfig.storageBucket) missingVars.push("VITE_FIREBASE_STORAGE_BUCKET");
if (!firebaseConfig.messagingSenderId) missingVars.push("VITE_FIREBASE_MESSAGING_SENDER_ID");
if (!firebaseConfig.appId) missingVars.push("VITE_FIREBASE_APP_ID");

if (missingVars.length > 0) {
  console.warn(
    `⚠️ [Firebase Configuration Warning]\n` +
    `Faltan las siguientes variables de entorno de Firebase en el archivo .env:\n` +
    missingVars.map((v) => `  - ${v}`).join("\n") +
    `\nPor favor, crea un archivo '.env' en la raíz de tu proyecto e ingresa las claves correctas.\n` +
    `Se utilizarán credenciales de prueba/mock temporalmente para evitar la caída de la aplicación.`
  );
}

// Configuración segura por defecto (mock controlado) para evitar fallos de inicialización
const safeConfig = {
  apiKey: firebaseConfig.apiKey || "mock-api-key-glow-heaven-12345",
  authDomain: firebaseConfig.authDomain || "glow-heaven.firebaseapp.com",
  projectId: firebaseConfig.projectId || "glow-heaven",
  storageBucket: firebaseConfig.storageBucket || "glow-heaven.appspot.com",
  messagingSenderId: firebaseConfig.messagingSenderId || "1234567890",
  appId: firebaseConfig.appId || "1:1234567890:web:mockappid12345",
};

// Inicialización controlada de la aplicación Firebase
let app;
try {
  app = getApps().length === 0 ? initializeApp(safeConfig) : getApp();
} catch (error) {
  console.error("Error crítico al inicializar la aplicación de Firebase:", error);
  // Asignamos una estructura mock vacía para evitar que las llamadas a base de datos rompan el hilo principal
  app = {} as any;
}

// Inicialización y exportación de servicios
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
