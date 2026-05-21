import React, { useState } from "react";
import { useProducts, Product, ProductVariant } from "./useProducts";

// Re-exportamos para compatibilidad si otros componentes importan de aquí
export type { Product, ProductVariant };

const WHATSAPP_PHONE = "50588888888";


// ==========================================
// 3. COMPONENTE DE TARJETA DE PRODUCTO
// ==========================================

interface ProductCardProps {
  product: Product;
  onWhatsAppOrder: (product: Product, selectedVariant: ProductVariant) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onWhatsAppOrder }) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);

  // Cálculo de precios exacto
  const baseWithAdjustment = product.basePrice + selectedVariant.priceAdjustment;
  const finalPrice = product.hasDiscount
    ? baseWithAdjustment * (1 - product.discountPercentage / 100)
    : baseWithAdjustment;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden flex flex-col justify-between h-full group">
      {/* Imagen del Producto */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        {product.hasDiscount && (
          <div className="absolute top-0 left-0 z-10 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-br-2xl shadow-sm tracking-wider">
            -{product.discountPercentage}% OFF
          </div>
        )}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          {/* Marca */}
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block mb-1">
            {product.brand}
          </span>
          {/* Nombre */}
          <h3 className="text-zinc-800 font-semibold text-base leading-snug line-clamp-1 hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>
          {/* Descripción */}
          <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div>
          {/* Selector de Variantes Interactivo */}
          <div className="mt-4">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-2">
              Presentación / Variante:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {product.variants.map((variant) => {
                const isSelected = selectedVariant.label === variant.label;
                return (
                  <button
                    key={variant.label}
                    onClick={() => setSelectedVariant(variant)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all duration-200 ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                    }`}
                  >
                    {variant.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visualización de Precios */}
          <div className="flex items-baseline gap-2 mt-4 pt-3 border-t border-zinc-100">
            <span className="text-xl font-bold text-zinc-900">
              ${finalPrice.toFixed(2)}
            </span>
            {product.hasDiscount && (
              <span className="line-through text-zinc-400 text-xs font-medium">
                ${baseWithAdjustment.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botón CTA Whatsapp */}
      <div className="px-5 pb-5 pt-0">
        <button
          onClick={() => onWhatsAppOrder(product, selectedVariant)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-sm shadow-emerald-100 hover:shadow-md"
        >
          {/* Icono de Whatsapp SVG */}
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.731-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.59 1.988 14.113.96 11.487.958c-5.446 0-9.87 4.372-9.874 9.802-.001 1.762.485 3.479 1.411 5.025l-.975 3.557 3.654-.958zm12.385-6.52c-.327-.162-1.926-.949-2.22-.1.058-.297-.454-.41-.53-.499l-.026-.03c-.26-.296-.514-.428-.868-.588l-.133-.06c-.456-.206-.9-.304-1.252.32-.32.569-.64 1.139-.933 1.47-.206.23-.42.253-.746.09-.327-.162-1.381-.508-2.63-1.622-.971-.866-1.627-1.937-1.818-2.264-.191-.328-.02-.505.143-.668.147-.146.327-.382.49-.573.163-.19.218-.328.327-.546.11-.218.055-.41-.027-.573-.082-.164-.736-1.772-1.009-2.427-.265-.646-.532-.559-.73-.569l-.627-.007c-.436 0-.817.155-1.09.45-.49.53-1.872 1.828-1.872 4.457 0 2.628 1.913 5.164 2.175 5.518.262.353 3.766 5.75 9.123 8.064 1.274.55 2.27.879 3.045 1.124 1.28.407 2.446.35 3.368.212 1.028-.154 3.153-1.29 3.59-2.535.436-1.246.436-2.312.308-2.535-.128-.223-.473-.385-.8-.549z" />
          </svg>
          <span className="tracking-wide">Comprar por WhatsApp</span>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 4. COMPONENTE PRINCIPAL (CATÁLOGO)
// ==========================================

export default function PremiumCatalog() {
  const { products, loading: isLoading, error } = useProducts();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("todos");


  // Lógica de filtrado combinado
  const filteredProducts = products.filter((product) => {
    // 1. Filtrar solo productos activos
    if (!product.isActive) return false;

    // 2. Filtrar por categoría / pestaña
    if (activeTab === "perfumes" && product.category !== "perfumes") return false;
    if (activeTab === "accessories" && product.category !== "accessories") return false;
    if (activeTab === "offers" && !product.hasDiscount) return false;

    // 3. Filtrar por texto completo (búsqueda)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      const matchName = product.name.toLowerCase().includes(query);
      const matchBrand = product.brand.toLowerCase().includes(query);
      const matchTags = product.tags.some((tag) => tag.toLowerCase().includes(query));
      return matchName || matchBrand || matchTags;
    }

    return true;
  });

  // Constructor de URL y Apertura de pestaña para WhatsApp
  const handleWhatsAppOrder = (product: Product, selectedVariant: ProductVariant) => {
    // Cálculo exacto del precio final
    const baseWithAdjustment = product.basePrice + selectedVariant.priceAdjustment;
    const finalPrice = product.hasDiscount
      ? baseWithAdjustment * (1 - product.discountPercentage / 100)
      : baseWithAdjustment;

    const formattedPrice = finalPrice.toFixed(2);

    // Mensaje estructurado con negritas de WhatsApp (*)
    const message = `¡Hola! Me interesa el producto *${product.name}* (*${product.brand}*) en su presentación de *${selectedVariant.label}*. El precio es de *$${formattedPrice}*. ¿Tienen disponibilidad en stock?`;

    // Sanitización y apertura de pestaña
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const resetFilters = () => {
    setSearchQuery("");
    setActiveTab("todos");
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-emerald-100 selection:text-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ================= HEADER Y TITULO ================= */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 mb-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-emerald-100">
            {/* SVG Sparkles */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904zM18.007 8.007L18 10l-.007-1.993L16 8l1.993-.007L18 6l.007 1.993L20 8l-1.993.007z" />
            </svg>
            <span>COLECCIÓN EXCLUSIVA</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            GLOW HEAVEN
          </h1>
          <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Perfumería de alta gama y accesorios premium seleccionados para realzar tu esencia.
          </p>
        </header>

        {/* ================= BÚSQUEDA Y FILTRADO ================= */}
        <div className="mb-8 space-y-4 max-w-xl mx-auto">
          {/* Barra de búsqueda con icono lupa e icono clear */}
          <div className="relative shadow-sm rounded-2xl group transition-all duration-300">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-emerald-600 transition-colors">
              {/* Lupa SVG */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar perfume, marca o aroma..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-12 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-800 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                {/* SVG de cierre (X) */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sistema de filtrado por pestañas horizontal con scroll lateral */}
          <div className="w-full">
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x justify-start sm:justify-center">
              {[
                { id: "todos", label: "Todos" },
                { id: "perfumes", label: "Perfumes" },
                { id: "accessories", label: "Accesorios" },
                { id: "offers", label: "Ofertas" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`snap-align-start flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                      isActive
                        ? tab.id === "offers"
                          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-100"
                          : "bg-zinc-950 text-white shadow-sm shadow-zinc-200"
                        : "bg-white border border-zinc-100 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= ESTADOS DE CARGA / ERROR / ESQUELETOS ================= */}
        {error ? (
          <div className="text-center py-16 px-4 bg-red-50 text-red-800 rounded-3xl border border-red-100 shadow-sm max-w-xl mx-auto mt-10">
            <div className="inline-flex p-4 rounded-full bg-red-100 text-red-600 mb-4 border border-red-200">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-950 mb-1">
              Error de Conexión
            </h3>
            <p className="text-red-600/80 text-sm max-w-xs mx-auto mb-6">
              {error}
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between h-[450px] animate-pulse"
              >
                {/* Imagen del Skeleton */}
                <div className="aspect-square bg-zinc-200 w-full" />
                {/* Contenido del Skeleton */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-2.5 bg-zinc-200 rounded w-1/4" />
                    <div className="h-4 bg-zinc-200 rounded w-3/4" />
                    <div className="space-y-1.5 mt-2">
                      <div className="h-3 bg-zinc-200 rounded w-full" />
                      <div className="h-3 bg-zinc-200 rounded w-5/6" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="h-2.5 bg-zinc-200 rounded w-1/3 mb-2" />
                      <div className="flex gap-2">
                        <div className="h-7 bg-zinc-200 rounded-lg w-12" />
                        <div className="h-7 bg-zinc-200 rounded-lg w-12" />
                      </div>
                    </div>
                    <div className="h-6 bg-zinc-200 rounded w-1/3 pt-1" />
                  </div>
                </div>
                {/* Botón del Skeleton */}
                <div className="px-5 pb-5 pt-0">
                  <div className="h-11 bg-zinc-200 rounded-xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* ================= ESTADO VACÍO (EMPTY STATE) ================= */
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-zinc-100 shadow-sm max-w-xl mx-auto mt-10">
            {/* Icono de búsqueda vacía SVG */}
            <div className="inline-flex p-4 rounded-full bg-zinc-50 text-zinc-400 mb-4 border border-zinc-100">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-1">
              No encontramos resultados
            </h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-6">
              Prueba cambiando los términos de búsqueda o eliminando los filtros aplicados.
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          /* ================= GRILLA DE PRODUCTOS ================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-all duration-300">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onWhatsAppOrder={handleWhatsAppOrder}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
