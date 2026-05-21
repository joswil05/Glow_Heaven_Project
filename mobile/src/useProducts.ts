import { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

// ==========================================
// DEFINICIÓN DE INTERFACES POLIMÓRFICAS
// ==========================================

export interface ProductVariant {
  label: string;
  stock: number;
  priceAdjustment: number;
}

export interface Product {
  id: string;
  name: string;
  category: "perfumes" | "accessories";
  brand: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  hasDiscount: boolean;
  discountPercentage: number;
  basePrice: number;
  variants: ProductVariant[];
  tags: string[];
  createdAt?: any; // Firestore ServerTimestamp o Timestamp
}

// ==========================================
// CUSTOM HOOK: useProducts
// ==========================================

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto para escuchar cambios en tiempo real
  useEffect(() => {
    setLoading(true);
    setError(null);

    let unsubscribe = () => {};

    try {
      // Consulta a la colección ordenando de manera descendente por fecha de creación
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const mappedProducts = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
            } as Product;
          });
          setProducts(mappedProducts);
          setLoading(false);
        },
        (err) => {
          console.error("Error al escuchar cambios en Firestore de productos:", err);
          setError(
            `Error al sincronizar datos: ${err.message || "Verifique los permisos de Firestore."}`
          );
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.error("Excepción en la suscripción del catálogo de productos:", err);
      setError(`Error de inicialización: ${err.message || "Error interno de base de datos."}`);
      setLoading(false);
    }

    // Retorno de la función de limpieza (evita fugas de memoria)
    return () => {
      unsubscribe();
    };
  }, []);

  // ==========================================
  // MÉTODOS DE MUTACIÓN CON MANEJO DE ERRORES
  // ==========================================

  /**
   * Agrega un nuevo producto a la colección
   * @param product Datos del producto omitiendo campos automáticos (id, createdAt)
   */
  const addProduct = async (product: Omit<Product, "id" | "createdAt">): Promise<void> => {
    try {
      await addDoc(collection(db, "products"), {
        ...product,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error("Error en addProduct (Firestore):", err);
      throw new Error(
        `No se pudo guardar el producto: ${err.message || "Error del servidor."}`
      );
    }
  };

  /**
   * Cambia el estado activo/inactivo (isActive) de un producto
   * @param id Identificador único del producto
   * @param currentStatus Estado actual (boolean) que será invertido
   */
  const toggleProductStatus = async (id: string, currentStatus: boolean): Promise<void> => {
    try {
      const productRef = doc(db, "products", id);
      await updateDoc(productRef, {
        isActive: !currentStatus,
      });
    } catch (err: any) {
      console.error("Error en toggleProductStatus (Firestore):", err);
      throw new Error(
        `No se pudo actualizar el estado: ${err.message || "Error del servidor."}`
      );
    }
  };

  /**
   * Elimina un producto de la colección
   * @param id Identificador único del producto
   */
  const deleteProduct = async (id: string): Promise<void> => {
    try {
      const productRef = doc(db, "products", id);
      await deleteDoc(productRef);
    } catch (err: any) {
      console.error("Error en deleteProduct (Firestore):", err);
      throw new Error(
        `No se pudo eliminar el producto: ${err.message || "Error del servidor."}`
      );
    }
  };

  return {
    products,
    loading,
    error,
    addProduct,
    toggleProductStatus,
    deleteProduct,
  };
}
