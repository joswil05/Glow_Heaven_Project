import React, { useState, useMemo, useRef, useEffect } from "react";
import { auth } from "./firebaseConfig";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { useProducts } from "./useProducts";

// ==========================================
// 1. DEFINICIONES DE INTERFACES (TypeScript)
// ==========================================

export interface VariantInput {
  label: string;
  stock: number;
  priceAdjustment: number;
}

export interface CostStructure {
  baseCost: number;
  packaging: number;
  shipping: number;
  price: number;
}

export interface ProductFormState {
  name: string;
  brand: string;
  description: string;
  category: "perfumes" | "accessories";
  isActive: boolean;
  hasDiscount: boolean;
  discountPercentage: number;
  variants: VariantInput[];
  costs: CostStructure;
}

// Estado Inicial por Defecto
const initialFormState: ProductFormState = {
  name: "",
  brand: "",
  description: "",
  category: "perfumes",
  isActive: true,
  hasDiscount: false,
  discountPercentage: 0,
  variants: [{ label: "Estándar", stock: 10, priceAdjustment: 0 }],
  costs: {
    baseCost: 0,
    packaging: 0,
    shipping: 0,
    price: 0
  }
};

// ==========================================
// 2. COMPONENTE PRINCIPAL: PANEL DE CONTROL
// ==========================================

export default function AdminPanel() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState<boolean>(false);

  // --- ESTADOS DEL FORMULARIO Y CATÁLOGO ---
  const [form, setForm] = useState<ProductFormState>(initialFormState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [savedProductName, setSavedProductName] = useState<string>("");
  const [dbError, setDbError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook reactivo de Firestore
  const { addProduct } = useProducts();

  // Escuchar el estado de autenticación en tiempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Manejo de Inicio de Sesión clásico (Email/Password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError("Por favor, introduce tu correo y contraseña.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Éxito: onAuthStateChanged actualizará el estado de 'user'
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      // Mapeo de errores comunes de Firebase Auth
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setLoginError("Credenciales inválidas. Por favor verifique el correo y la contraseña.");
      } else if (error.code === "auth/too-many-requests") {
        setLoginError("Demasiados intentos fallidos. Cuenta bloqueada temporalmente.");
      } else {
        setLoginError("Error de autenticación: " + (error.message || "Inténtalo de nuevo."));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Manejo de Inicio de Sesión con Google
  const handleGoogleLogin = async () => {
    setIsGoogleLoggingIn(true);
    setLoginError(null);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      // Éxito: onAuthStateChanged actualizará el estado de 'user'
    } catch (error: any) {
      console.error("Error al iniciar sesión con Google:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setLoginError("La ventana de inicio de sesión de Google fue cerrada antes de completar el proceso.");
      } else if (error.code === "auth/popup-blocked") {
        setLoginError("El navegador bloqueó la ventana emergente de inicio de sesión de Google. Habilita los popups para este sitio.");
      } else if (error.code === "auth/operation-not-allowed") {
        setLoginError("El inicio de sesión con Google no está habilitado en la consola de Firebase. Por favor, actívalo.");
      } else {
        setLoginError("Error de autenticación con Google: " + (error.message || "Inténtalo de nuevo."));
      }
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  // Manejo de Cierre de Sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Manejo de Inputs Básicos del Formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo de Costos Individuales
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = Math.max(0, parseFloat(value) || 0);
    setForm((prev) => ({
      ...prev,
      costs: {
        ...prev.costs,
        [name]: numericValue
      }
    }));
  };

  // Lógica del Simulador Financiero (useMemo)
  const financials = useMemo(() => {
    const totalCost = form.costs.baseCost + form.costs.packaging + form.costs.shipping;
    const netProfit = form.costs.price - totalCost;
    const profitMarginPercentage = form.costs.price > 0 ? (netProfit / form.costs.price) * 100 : 0;
    return {
      totalCost,
      netProfit,
      profitMarginPercentage
    };
  }, [form.costs.baseCost, form.costs.packaging, form.costs.shipping, form.costs.price]);

  // Gestión de Variantes Dinámicas
  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { label: "", stock: 0, priceAdjustment: 0 }]
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: keyof VariantInput, value: string | number) => {
    setForm((prev) => {
      const updatedVariants = [...prev.variants];
      if (field === "label") {
        updatedVariants[index] = { ...updatedVariants[index], label: value as string };
      } else {
        const numericVal =
          field === "priceAdjustment"
            ? parseFloat(value as string) || 0
            : parseInt(value as string, 10) || 0;
        updatedVariants[index] = { ...updatedVariants[index], [field]: numericVal };
      }
      return { ...prev, variants: updatedVariants };
    });
  };

  // Simulación Drag and Drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Envío Real Asíncrono del Formulario a Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    setDbError(null);

    try {
      // Mapear el estado del formulario al formato esperado por el hook de persistencia
      const cleanProductData = {
        name: form.name,
        brand: form.brand,
        description: form.description,
        category: form.category,
        // Usar la previsualización de imagen (Base64) o un placeholder estilizado
        imageUrl:
          imagePreview ||
          "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=600",
        isActive: form.isActive,
        hasDiscount: form.hasDiscount,
        discountPercentage: form.discountPercentage,
        basePrice: form.costs.price, // Mapeamos el precio de venta final a basePrice del catálogo
        variants: form.variants.map((v) => ({
          label: v.label || "Estándar",
          stock: v.stock,
          priceAdjustment: v.priceAdjustment
        })),
        // Creación automatizada de etiquetas en base a las palabras del nombre y marca
        tags: [
          form.brand.toLowerCase(),
          form.category,
          ...form.name.toLowerCase().split(" ").filter((w) => w.length > 2)
        ]
      };

      // Guardar en Firestore a través de la base de datos real
      await addProduct(cleanProductData);

      setSavedProductName(form.name);
      setShowSuccessToast(true);

      // Reseteo del formulario
      setForm(initialFormState);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Ocultar notificación tras 4 segundos
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 4000);
    } catch (err: any) {
      console.error("Error al guardar producto:", err);
      setDbError(err.message || "Ocurrió un error inesperado al intentar guardar el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER 1: PANTALLA DE CARGA INICIAL DE AUTH ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans">
        <svg className="animate-spin h-8 w-8 text-zinc-950 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-zinc-500 text-xs font-semibold tracking-wider uppercase">Cargando Módulos Seguros...</span>
      </div>
    );
  }

  // --- RENDER 2: BARRERA DE INICIO DE SESIÓN (LOGIN SCREEN) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans selection:bg-zinc-200">
        <div className="bg-white w-full max-w-md rounded-3xl border border-zinc-150 p-8 shadow-xl relative overflow-hidden transition-all duration-300">
          
          {/* Cabecera Estética */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 border border-zinc-200">
              MÓDULO INTERNO
            </div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">GLOW HEAVEN</h2>
            <p className="text-zinc-400 text-xs mt-1">Ingresa tus credenciales para acceder al panel de inventario.</p>
          </div>

          {/* Manejo de Errores Visuales */}
          {loginError && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-medium rounded-xl flex items-center gap-2 animate-fade-in transition-all duration-300">
              <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          {/* Formulario de Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col">
              <label htmlFor="email" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@glowheaven.com"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/5 focus:border-zinc-900 transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="password" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/5 focus:border-zinc-900 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || isGoogleLoggingIn}
              className="w-full mt-6 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-zinc-200 hover:shadow-lg"
            >
              {isLoggingIn ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Divisor Visual */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-150"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              o accede con
            </span>
          </div>

          {/* Botón de Login con Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn || isGoogleLoggingIn}
            className="w-full bg-white hover:bg-zinc-50 text-zinc-800 font-semibold py-3.5 px-4 border border-zinc-200 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow"
          >
            {isGoogleLoggingIn ? (
              <>
                <svg className="animate-spin h-4 w-4 text-zinc-800" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Conectando con Google...</span>
              </>
            ) : (
              <>
                {/* SVG Oficial de Google */}
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Acceder con Google</span>
              </>
            )}
          </button>

        </div>
      </div>
    );
  }

  // --- RENDER 3: PANEL DE ADMINISTRACIÓN PRIVADO COMPLETO (USER AUTENTICADO) ---
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-200 transition-opacity duration-500 opacity-100 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ================= NOTIFICACIÓN DE ÉXITO ESTÉTICA ================= */}
        {showSuccessToast && (
          <div className="fixed top-5 right-5 z-50 max-w-md w-full bg-zinc-900 text-white rounded-2xl p-4 shadow-xl border border-zinc-800 flex items-center justify-between transition-all duration-300 animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">Producto Guardado</p>
                <p className="text-xs text-zinc-400">"{savedProductName}" se ha guardado en la nube con éxito.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ================= NOTIFICACIÓN DE ERROR EN DB ================= */}
        {dbError && (
          <div className="fixed top-5 right-5 z-50 max-w-md w-full bg-rose-900 text-white rounded-2xl p-4 shadow-xl border border-rose-800 flex items-center justify-between transition-all duration-300 animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="bg-rose-500/20 text-rose-300 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">Error al Guardar</p>
                <p className="text-xs text-rose-200 line-clamp-2">{dbError}</p>
              </div>
            </div>
            <button
              onClick={() => setDbError(null)}
              className="text-rose-200 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ================= ENCABEZADO PANEL DE ADMISION ================= */}
        <header className="mb-8 border-b border-zinc-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Panel de Administración</h1>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                  {user.email}
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">Crea nuevos productos y gestiona las métricas de rentabilidad en tiempo real.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-xs text-zinc-400 font-medium bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200">
                Módulo Inventario v3.0
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm active:scale-95 animate-fade-in"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        {/* ================= DISEÑO PRINCIPAL GRID 12 COLUMNAS ================= */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SECCIÓN FORMULARIO (8 COLUMNAS) */}
          <div className="lg:col-span-8 space-y-8 bg-white border border-zinc-150 rounded-3xl p-6 sm:p-8 shadow-sm">
            
            {/* Sección 1: Información Básica */}
            <div>
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-2 mb-6">
                1. Información Básica del Producto
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Nombre */}
                <div className="flex flex-col">
                  <label htmlFor="name" className="text-xs font-semibold text-zinc-700 mb-1.5">
                    Nombre del Producto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Ej. Bleu de Chanel EDP"
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/5 focus:border-zinc-900 transition-all"
                  />
                </div>

                {/* Marca */}
                <div className="flex flex-col">
                  <label htmlFor="brand" className="text-xs font-semibold text-zinc-700 mb-1.5">
                    Marca <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    required
                    value={form.brand}
                    onChange={handleInputChange}
                    placeholder="Ej. Chanel"
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/5 focus:border-zinc-900 transition-all"
                  />
                </div>

                {/* Categoría (Radio buttons estéticos) */}
                <div className="sm:col-span-2 flex flex-col">
                  <span className="text-xs font-semibold text-zinc-700 mb-2">Categoría del Producto</span>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                      form.category === "perfumes"
                        ? "border-zinc-900 bg-zinc-50/50 shadow-sm"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                    }`}>
                      <input
                        type="radio"
                        name="category"
                        value="perfumes"
                        checked={form.category === "perfumes"}
                        onChange={() => setForm((prev) => ({ ...prev, category: "perfumes" }))}
                        className="w-4 h-4 text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                      />
                      <div>
                        <p className="text-xs font-bold text-zinc-800">Perfumería</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Fragancias, lociones, extractos.</p>
                      </div>
                    </label>

                    <label className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                      form.category === "accessories"
                        ? "border-zinc-900 bg-zinc-50/50 shadow-sm"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                    }`}>
                      <input
                        type="radio"
                        name="category"
                        value="accessories"
                        checked={form.category === "accessories"}
                        onChange={() => setForm((prev) => ({ ...prev, category: "accessories" }))}
                        className="w-4 h-4 text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                      />
                      <div>
                        <p className="text-xs font-bold text-zinc-800">Accesorios</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Atomizadores, estuches, joyería.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Descripción */}
                <div className="sm:col-span-2 flex flex-col">
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="description" className="text-xs font-semibold text-zinc-700">
                      Descripción del Producto
                    </label>
                    <span className={`text-[10px] font-medium ${
                      form.description.length > 270 ? "text-amber-600" : "text-zinc-400"
                    }`}>
                      {form.description.length} / 300 caracteres
                    </span>
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    maxLength={300}
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Describe los acordes aromáticos, notas olfativas o materiales del accesorio..."
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/5 focus:border-zinc-900 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Carga de Imagen */}
            <div>
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-2 mb-6">
                2. Imagen Destacada
              </h3>
              
              {/* Drag and Drop Zone */}
              {!imagePreview ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-dashed border-2 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                    isDragActive
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50/50 bg-white"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {/* Nube SVG */}
                  <div className="bg-zinc-100 text-zinc-600 p-3 rounded-full mb-3 border border-zinc-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-zinc-700">Arrastra una imagen de producto aquí</p>
                  <p className="text-[10px] text-zinc-400 mt-1">o haz clic para explorar tus archivos locales (PNG, JPG, WebP)</p>
                </div>
              ) : (
                /* Previsualización de Imagen */
                <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 p-4 max-w-sm flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-zinc-100 relative shadow-sm flex-shrink-0">
                    <img src={imagePreview} alt="Vista previa del producto" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-zinc-800 truncate">imagen_producto.png</p>
                    <p className="text-[10px] text-zinc-400">Listo para subir al catálogo.</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-zinc-900 text-white rounded-full p-1.5 shadow hover:bg-zinc-800 transition-colors"
                    aria-label="Quitar imagen"
                  >
                    {/* Cruz X SVG */}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Sección 3: Módulo de Variantes Dinámicas */}
            <div>
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2 mb-6">
                <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">
                  3. Variantes del Producto
                </h3>
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Añadir Variante
                </button>
              </div>

              {form.variants.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50 border border-zinc-150 rounded-2xl">
                  <p className="text-xs text-zinc-500">No hay variantes cargadas. Se creará una variante por defecto en la base de datos.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-3 p-4 bg-zinc-50 border border-zinc-150 rounded-2xl items-center relative group"
                    >
                      {/* Input Etiqueta */}
                      <div className="col-span-5 md:col-span-5 flex flex-col">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Etiqueta</label>
                        <input
                          type="text"
                          required
                          value={variant.label}
                          onChange={(e) => updateVariant(index, "label", e.target.value)}
                          placeholder="Ej. 100ml / Oro Rosa"
                          className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                      </div>

                      {/* Input Stock */}
                      <div className="col-span-3 md:col-span-3 flex flex-col">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Stock</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, "stock", e.target.value)}
                          className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                      </div>

                      {/* Input Ajuste de Precio */}
                      <div className="col-span-3 md:col-span-3 flex flex-col">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Precio (+ / -)</label>
                        <input
                          type="number"
                          required
                          value={variant.priceAdjustment}
                          onChange={(e) => updateVariant(index, "priceAdjustment", e.target.value)}
                          placeholder="0.00"
                          className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                      </div>

                      {/* Botón Borrar */}
                      <div className="col-span-1 flex flex-col items-center pt-4">
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Eliminar variante"
                        >
                          {/* Trash Can SVG */}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* SECCIÓN BARRA LATERAL (4 COLUMNAS) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Módulo A: Toggles de Estado */}
            <div className="bg-white border border-zinc-150 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-2">
                Estado y Visibilidad
              </h3>

              {/* Toggle isActive */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-800 block">Visibilidad en Catálogo</span>
                  <span className="text-[10px] text-zinc-400">
                    {form.isActive ? "Público y Trazable" : "Borrador / Oculto"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className={`w-11 h-6 rounded-full transition-all duration-200 relative focus:outline-none border ${
                    form.isActive ? "bg-zinc-900 border-zinc-900" : "bg-zinc-200 border-zinc-300"
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${
                    form.isActive ? "left-5.5" : "left-0.5"
                  }`} />
                </button>
              </div>

              {/* Toggle hasDiscount */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-800 block">Aplicar Descuento</span>
                  <span className="text-[10px] text-zinc-400">Reducción del precio de venta</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, hasDiscount: !prev.hasDiscount }))}
                  className={`w-11 h-6 rounded-full transition-all duration-200 relative focus:outline-none border ${
                    form.hasDiscount ? "bg-emerald-600 border-emerald-600" : "bg-zinc-200 border-zinc-300"
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${
                    form.hasDiscount ? "left-5.5" : "left-0.5"
                  }`} />
                </button>
              </div>

              {/* Input Porcentaje Descuento (Visible solo si hasDiscount es true) */}
              {form.hasDiscount && (
                <div className="pt-4 border-t border-zinc-100 flex flex-col animate-fade-in">
                  <label htmlFor="discountPercentage" className="text-xs font-semibold text-zinc-700 mb-1.5">
                    Porcentaje de Descuento (%)
                  </label>
                  <input
                    type="number"
                    id="discountPercentage"
                    name="discountPercentage"
                    min={0}
                    max={100}
                    value={form.discountPercentage}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                      setForm((prev) => ({ ...prev, discountPercentage: val }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              )}
            </div>

            {/* Módulo B: Simulador Financiero */}
            <div className="bg-white border border-zinc-150 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-2">
                Simulador Financiero
              </h3>

              {/* Inputs de Dinero */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center gap-4">
                  <label htmlFor="baseCost" className="text-xs font-semibold text-zinc-600">Costo Base ($)</label>
                  <input
                    type="number"
                    id="baseCost"
                    name="baseCost"
                    min={0}
                    value={form.costs.baseCost || ""}
                    onChange={handleCostChange}
                    placeholder="0.00"
                    className="w-24 px-2.5 py-1.5 text-right bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div className="flex justify-between items-center gap-4">
                  <label htmlFor="packaging" className="text-xs font-semibold text-zinc-600">Empaque ($)</label>
                  <input
                    type="number"
                    id="packaging"
                    name="packaging"
                    min={0}
                    value={form.costs.packaging || ""}
                    onChange={handleCostChange}
                    placeholder="0.00"
                    className="w-24 px-2.5 py-1.5 text-right bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div className="flex justify-between items-center gap-4">
                  <label htmlFor="shipping" className="text-xs font-semibold text-zinc-600">Envío Prorrateado ($)</label>
                  <input
                    type="number"
                    id="shipping"
                    name="shipping"
                    min={0}
                    value={form.costs.shipping || ""}
                    onChange={handleCostChange}
                    placeholder="0.00"
                    className="w-24 px-2.5 py-1.5 text-right bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div className="flex justify-between items-center gap-4 pt-2.5 border-t border-zinc-100">
                  <label htmlFor="price" className="text-xs font-bold text-zinc-800">Precio de Venta ($)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min={0}
                    value={form.costs.price || ""}
                    onChange={handleCostChange}
                    placeholder="0.00"
                    className="w-24 px-2.5 py-1.5 text-right bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 font-bold"
                  />
                </div>
              </div>

              {/* Métricas KPI Calculadas (useMemo) */}
              <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4.5 space-y-3.5 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Costo Total:</span>
                  <span className="text-xs font-bold text-zinc-800">${financials.totalCost.toFixed(2)}</span>
                </div>

                {/* Ganancia Neta */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ganancia Neta:</span>
                  <span className={`text-xs font-bold ${financials.netProfit >= 0 ? "text-zinc-800" : "text-red-500"}`}>
                    ${financials.netProfit.toFixed(2)}
                  </span>
                </div>

                {/* Margen de Ganancia Badge */}
                <div className="flex justify-between items-center pt-2.5 border-t border-zinc-200/60">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Margen Estimado:</span>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    financials.profitMarginPercentage < 30
                      ? "text-amber-600 bg-amber-50"
                      : "text-emerald-600 bg-emerald-50"
                  }`}>
                    {financials.profitMarginPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Módulo C: Botón Guardar Producto */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-zinc-200 hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    {/* Spinner de Carga SVG */}
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Guardando producto...</span>
                  </>
                ) : (
                  <>
                    {/* Guardar Disco SVG */}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Guardar Producto en Catálogo</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
}
