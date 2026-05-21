import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet
} from "react-native";
import { auth } from "./src/firebaseConfig";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { useProducts, Product, ProductVariant } from "./src/useProducts";

// ==========================================
// 1. INTERFACES Y CONFIGURACIÓN LOCAL
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
  productCode: string;
}

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
  },
  productCode: ""
};

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================

export default function AdminApp() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // --- ESTADOS DE CONTROL DEL FORMULARIO ---
  const [form, setForm] = useState<ProductFormState>(initialFormState);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isCapturingImage, setIsCapturingImage] = useState<boolean>(false);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);

  // Hook reactivo de persistencia Firestore
  const { addProduct } = useProducts();

  // Escuchar estado de sesión
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- MÉTODOS DE AUTENTICACIÓN ---
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLoginError("Por favor, introduce tu correo y contraseña.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Error al iniciar sesión móvil:", error);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setLoginError("Credenciales inválidas. Verifica correo y contraseña.");
      } else if (error.code === "auth/too-many-requests") {
        setLoginError("Cuenta bloqueada temporalmente debido a intentos fallidos.");
      } else {
        setLoginError("Error: " + (error.message || "Error al autenticar."));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Error al cerrar sesión móvil:", error);
    }
  };

  // --- MÉTODOS DE LA CÁMARA E IMAGEN MOCK ---
  const handleCameraLaunch = () => {
    setIsCapturingImage(true);
    // Simulación del hardware de cámara por 800ms
    // Aquí se acoplará expo-image-picker
    setTimeout(() => {
      setIsCapturingImage(false);
      setImageUri("https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=600");
      Alert.alert("Foto Capturada", "La imagen simulada se ha cargado correctamente.");
    }, 800);
  };

  const removeImage = () => {
    setImageUri(null);
  };

  // --- MÉTODOS DEL ESCÁNER MOCK ---
  const handleBarcodeScan = () => {
    // Simulación de escaneo de código de barras
    // Aquí se acoplará expo-barcode-scanner
    const mockBarcode = "7501234567890";
    setForm((prev) => ({ ...prev, productCode: mockBarcode }));
    Alert.alert("Código Escaneado", `Se detectó el código de barras: ${mockBarcode}`);
  };

  // --- CÁLCULOS DEL DASHBOARD FINANCIERO (useMemo) ---
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

  // --- MANEJO DE VARIANTES ---
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

  const updateVariant = (index: number, field: keyof VariantInput, value: string) => {
    setForm((prev) => {
      const updatedVariants = [...prev.variants];
      if (field === "label") {
        updatedVariants[index] = { ...updatedVariants[index], label: value };
      } else if (field === "priceAdjustment") {
        updatedVariants[index] = { ...updatedVariants[index], priceAdjustment: parseFloat(value) || 0 };
      } else if (field === "stock") {
        updatedVariants[index] = { ...updatedVariants[index], stock: parseInt(value, 10) || 0 };
      }
      return { ...prev, variants: updatedVariants };
    });
  };

  const resetForm = () => {
    setForm(initialFormState);
    setImageUri(null);
  };

  // --- PERSISTENCIA: GUARDADO EN FIRESTORE ---
  const handleSaveProduct = async () => {
    if (!form.name.trim()) {
      Alert.alert("Campo Requerido", "El nombre del producto es obligatorio.");
      return;
    }

    setIsSavingProduct(true);

    try {
      const cleanProductData = {
        name: form.name,
        brand: form.brand,
        description: form.description,
        category: form.category,
        imageUrl: imageUri || "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=600",
        isActive: form.isActive,
        hasDiscount: form.hasDiscount,
        discountPercentage: form.discountPercentage,
        basePrice: form.costs.price,
        variants: form.variants.map((v) => ({
          label: v.label || "Estándar",
          stock: v.stock,
          priceAdjustment: v.priceAdjustment
        })),
        tags: [
          form.brand.toLowerCase(),
          form.category,
          ...form.name.toLowerCase().split(" ").filter((w) => w.length > 2),
          form.productCode ? form.productCode : ""
        ].filter(Boolean)
      };

      await addProduct(cleanProductData);

      Alert.alert("¡Éxito!", "El producto ha sido guardado en el inventario correctamente.", [
        { text: "OK", onPress: resetForm }
      ]);
    } catch (error: any) {
      console.error("Error al guardar producto desde app móvil:", error);
      Alert.alert("Error de Registro", error.message || "Ocurrió un error inesperado al guardar el producto.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  // --- RENDER 1: PANTALLA DE CARGA ---
  if (authLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#09090b" />
        <Text style={styles.loadingText}>Cargando entorno móvil seguro...</Text>
      </SafeAreaView>
    );
  }

  // --- RENDER 2: LOGIN BARRERA ---
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <View style={styles.loginCard}>
            <View style={styles.header}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>MÓDULO INTERNO MÓVIL</Text>
              </View>
              <Text style={styles.title}>GLOW HEAVEN</Text>
              <Text style={styles.subtitle}>Consola móvil de control de inventario</Text>
            </View>

            {loginError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="admin@glowheaven.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#a1a1aa"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={true}
                autoCapitalize="none"
                placeholderTextColor="#a1a1aa"
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={isLoggingIn}
              activeOpacity={0.8}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- RENDER 3: PANEL PRINCIPAL ---
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.topTitle}>Glow Heaven Admin</Text>
            <Text style={styles.topSubtitle}>{user.email}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* A. DASHBOARD FINANCIERO DE KPI */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>MÉTRICAS ESTIMADAS</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Costo Total</Text>
                <Text style={styles.metricValue}>${financials.totalCost.toFixed(2)}</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Ganancia Neta</Text>
                <Text style={[styles.metricValue, financials.netProfit >= 0 ? styles.positiveText : styles.negativeText]}>
                  ${financials.netProfit.toFixed(2)}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Margen Neto</Text>
                <View
                  style={[
                    styles.marginBadge,
                    financials.profitMarginPercentage < 30 ? styles.amberBadge : styles.emeraldBadge
                  ]}
                >
                  <Text
                    style={[
                      styles.marginBadgeText,
                      financials.profitMarginPercentage < 30 ? styles.amberBadgeText : styles.emeraldBadgeText
                    ]}
                  >
                    {financials.profitMarginPercentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* B. IMAGEN Y CÓDIGO DE BARRAS */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>FOTO & CÓDIGO DE BARRAS</Text>
            
            <View style={styles.cameraContainer}>
              {imageUri ? (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                    <Text style={styles.removeImageBtnText}>X</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handleCameraLaunch}
                  disabled={isCapturingImage}
                >
                  {isCapturingImage ? (
                    <ActivityIndicator color="#09090b" />
                  ) : (
                    <Text style={styles.cameraButtonText}>Capturar Foto del Producto</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.scanRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>CÓDIGO DE BARRAS</Text>
                <TextInput
                  style={styles.inputCompact}
                  value={form.productCode}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, productCode: val }))}
                  placeholder="Código de barras"
                  placeholderTextColor="#a1a1aa"
                />
              </View>
              <TouchableOpacity style={styles.scanButton} onPress={handleBarcodeScan}>
                <Text style={styles.scanButtonText}>Escanear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* C. INFORMACIÓN GENERAL */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>DETALLES GENERALES</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>NOMBRE DEL PRODUCTO</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(val) => setForm((prev) => ({ ...prev, name: val }))}
                placeholder="Ej. Bleu de Chanel"
                placeholderTextColor="#a1a1aa"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>MARCA</Text>
              <TextInput
                style={styles.input}
                value={form.brand}
                onChangeText={(val) => setForm((prev) => ({ ...prev, brand: val }))}
                placeholder="Ej. Chanel"
                placeholderTextColor="#a1a1aa"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>CATEGORÍA</Text>
              <View style={styles.categoryToggleRow}>
                <TouchableOpacity
                  style={[styles.categoryBtn, form.category === "perfumes" ? styles.categoryBtnActive : null]}
                  onPress={() => setForm((prev) => ({ ...prev, category: "perfumes" }))}
                >
                  <Text style={[styles.categoryBtnText, form.category === "perfumes" ? styles.categoryBtnTextActive : null]}>
                    Perfumes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.categoryBtn, form.category === "accessories" ? styles.categoryBtnActive : null]}
                  onPress={() => setForm((prev) => ({ ...prev, category: "accessories" }))}
                >
                  <Text style={[styles.categoryBtnText, form.category === "accessories" ? styles.categoryBtnTextActive : null]}>
                    Accesorios
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>DESCRIPCIÓN</Text>
              <TextInput
                style={styles.inputMultiline}
                value={form.description}
                onChangeText={(val) => setForm((prev) => ({ ...prev, description: val }))}
                placeholder="Detalla los aromas, notas o características..."
                multiline={true}
                numberOfLines={3}
                maxLength={300}
                placeholderTextColor="#a1a1aa"
              />
              <Text style={styles.charCounter}>{form.description.length} / 300</Text>
            </View>
          </View>

          {/* D. COSTOS E INVENTARIO */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>PRECIO & COSTOS</Text>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>COSTO BASE ($)</Text>
                <TextInput
                  style={styles.inputCompact}
                  value={form.costs.baseCost === 0 ? "" : String(form.costs.baseCost)}
                  onChangeText={(val) => {
                    const parsed = Math.max(0, parseFloat(val) || 0);
                    setForm((prev) => ({ ...prev, costs: { ...prev.costs, baseCost: parsed } }));
                  }}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#a1a1aa"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>EMPAQUE ($)</Text>
                <TextInput
                  style={styles.inputCompact}
                  value={form.costs.packaging === 0 ? "" : String(form.costs.packaging)}
                  onChangeText={(val) => {
                    const parsed = Math.max(0, parseFloat(val) || 0);
                    setForm((prev) => ({ ...prev, costs: { ...prev.costs, packaging: parsed } }));
                  }}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#a1a1aa"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>ENVÍO PRORRATEADO ($)</Text>
                <TextInput
                  style={styles.inputCompact}
                  value={form.costs.shipping === 0 ? "" : String(form.costs.shipping)}
                  onChangeText={(val) => {
                    const parsed = Math.max(0, parseFloat(val) || 0);
                    setForm((prev) => ({ ...prev, costs: { ...prev.costs, shipping: parsed } }));
                  }}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#a1a1aa"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>PRECIO DE VENTA ($)</Text>
                <TextInput
                  style={[styles.inputCompact, { fontWeight: "bold" }]}
                  value={form.costs.price === 0 ? "" : String(form.costs.price)}
                  onChangeText={(val) => {
                    const parsed = Math.max(0, parseFloat(val) || 0);
                    setForm((prev) => ({ ...prev, costs: { ...prev.costs, price: parsed } }));
                  }}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#a1a1aa"
                />
              </View>
            </View>

            <View style={styles.switchGroup}>
              <View>
                <Text style={styles.switchLabel}>Visibilidad pública</Text>
                <Text style={styles.switchSubLabel}>Visible en el catálogo web</Text>
              </View>
              <Switch
                value={form.isActive}
                onValueChange={(val) => setForm((prev) => ({ ...prev, isActive: val }))}
                trackColor={{ false: "#e4e4e7", true: "#18181b" }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.switchGroup}>
              <View>
                <Text style={styles.switchLabel}>Aplicar descuento</Text>
                <Text style={styles.switchSubLabel}>Rebaja el precio de venta final</Text>
              </View>
              <Switch
                value={form.hasDiscount}
                onValueChange={(val) => setForm((prev) => ({ ...prev, hasDiscount: val }))}
                trackColor={{ false: "#e4e4e7", true: "#059669" }}
                thumbColor="#ffffff"
              />
            </View>

            {form.hasDiscount && (
              <View style={[styles.formGroup, { marginTop: 12 }]}>
                <Text style={styles.label}>PORCENTAJE DE DESCUENTO (%)</Text>
                <TextInput
                  style={styles.input}
                  value={String(form.discountPercentage)}
                  onChangeText={(val) => {
                    const parsed = Math.min(100, Math.max(0, parseInt(val, 10) || 0));
                    setForm((prev) => ({ ...prev, discountPercentage: parsed }));
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#a1a1aa"
                />
              </View>
            )}
          </View>

          {/* E. COMPONENTE DE VARIANTES DINÁMICAS */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>PRESENTACIONES / VARIANTES</Text>
              <TouchableOpacity style={styles.addVariantBtn} onPress={addVariant}>
                <Text style={styles.addVariantBtnText}>+ Añadir</Text>
              </TouchableOpacity>
            </View>

            {form.variants.length === 0 ? (
              <Text style={styles.emptyText}>Sin variantes. Añade al menos una presentación básica.</Text>
            ) : (
              form.variants.map((variant, index) => (
                <View key={index} style={styles.variantRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.labelSmall}>ETIQUETA (EJ. 100ML)</Text>
                    <TextInput
                      style={styles.variantInput}
                      value={variant.label}
                      onChangeText={(val) => updateVariant(index, "label", val)}
                      placeholder="Estándar"
                      placeholderTextColor="#a1a1aa"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.labelSmall}>STOCK</Text>
                    <TextInput
                      style={styles.variantInput}
                      value={String(variant.stock)}
                      onChangeText={(val) => updateVariant(index, "stock", val)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#a1a1aa"
                    />
                  </View>
                  <View style={{ flex: 1.2, marginLeft: 8 }}>
                    <Text style={styles.labelSmall}>AJUSTE ($)</Text>
                    <TextInput
                      style={styles.variantInput}
                      value={String(variant.priceAdjustment)}
                      onChangeText={(val) => updateVariant(index, "priceAdjustment", val)}
                      keyboardType="numeric"
                      placeholder="+0.00"
                      placeholderTextColor="#a1a1aa"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.deleteVariantBtn}
                    onPress={() => removeVariant(index)}
                  >
                    <Text style={styles.deleteVariantBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* BOTÓN GUARDAR PRODUCTO */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProduct}
            disabled={isSavingProduct}
            activeOpacity={0.85}
          >
            {isSavingProduct ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Producto en Firestore</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 3. ESTILOS DE ALTA FIDELIDAD NATIVOS (StyleSheet)
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f5" // zinc-100
  },
  keyboardContainer: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f4f4f5",
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 12,
    color: "#71717a", // zinc-500
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  loginCard: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff"
  },
  header: {
    alignItems: "center",
    marginBottom: 32
  },
  badgeContainer: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    marginBottom: 12
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1.5,
    color: "#18181b"
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#09090b",
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 4,
    textAlign: "center"
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20
  },
  errorText: {
    color: "#991b1b",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center"
  },
  formGroup: {
    marginBottom: 16
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16
  },
  label: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#71717a",
    letterSpacing: 1,
    marginBottom: 8
  },
  labelSmall: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#71717a",
    letterSpacing: 0.5,
    marginBottom: 4
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#09090b"
  },
  inputCompact: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#09090b"
  },
  inputMultiline: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 13,
    color: "#09090b",
    minHeight: 80,
    textAlignVertical: "top"
  },
  charCounter: {
    fontSize: 9,
    color: "#a1a1aa",
    textAlign: "right",
    marginTop: 4,
    marginRight: 4
  },
  primaryButton: {
    backgroundColor: "#09090b",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7"
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#09090b"
  },
  topSubtitle: {
    fontSize: 10,
    color: "#71717a",
    marginTop: 2
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff"
  },
  logoutButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#71717a"
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingBottom: 10,
    marginBottom: 16
  },
  cardSectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#09090b",
    letterSpacing: 1.5
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
    paddingVertical: 10,
    borderRadius: 12
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#09090b"
  },
  positiveText: {
    color: "#047857"
  },
  negativeText: {
    color: "#b91c1c"
  },
  marginBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999
  },
  marginBadgeText: {
    fontSize: 11,
    fontWeight: "bold"
  },
  amberBadge: {
    backgroundColor: "#fef3c7" // amber-100 (pastel sutil)
  },
  amberBadgeText: {
    color: "#b45309" // amber-700
  },
  emeraldBadge: {
    backgroundColor: "#d1fae5" // emerald-100 (pastel sutil)
  },
  emeraldBadgeText: {
    color: "#047857" // emerald-700
  },
  categoryToggleRow: {
    flexDirection: "row",
    gap: 10
  },
  categoryBtn: {
    flex: 1,
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  categoryBtnActive: {
    backgroundColor: "#18181b",
    borderColor: "#18181b"
  },
  categoryBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717a"
  },
  categoryBtnTextActive: {
    color: "#ffffff"
  },
  switchGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    marginTop: 8
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#09090b"
  },
  switchSubLabel: {
    fontSize: 10,
    color: "#71717a",
    marginTop: 2
  },
  cameraContainer: {
    marginVertical: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  cameraButton: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center"
  },
  cameraButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a"
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden"
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(9, 9, 11, 0.7)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  removeImageBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold"
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 8
  },
  scanButton: {
    backgroundColor: "#18181b",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600"
  },
  addVariantBtn: {
    backgroundColor: "#18181b",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  addVariantBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold"
  },
  variantRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5"
  },
  variantInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 12,
    color: "#09090b"
  },
  deleteVariantBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#fee2e2"
  },
  deleteVariantBtnText: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "bold"
  },
  emptyText: {
    fontSize: 12,
    color: "#71717a",
    textAlign: "center",
    marginVertical: 12
  },
  saveButton: {
    backgroundColor: "#09090b",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold"
  }
});
