import { useState } from "react";
import PremiumCatalog from "./PremiumCatalog";
import AdminPanel from "./AdminPanel";

export default function App() {
  const [currentView, setCurrentView] = useState<"catalog" | "admin">("catalog");

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
      <div>
        {/* Barra de navegación superior estilo Glassmorphism */}
        <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-zinc-150 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Logo / Nombre de marca */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-white text-xs font-black shadow-md tracking-wider">
                  GH
                </div>
                <span className="font-extrabold text-sm tracking-widest text-zinc-900 uppercase hidden sm:block">
                  GLOW HEAVEN
                </span>
              </div>

              {/* Selector de Vistas Interactivo */}
              <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-inner">
                <button
                  onClick={() => setCurrentView("catalog")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    currentView === "catalog"
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {/* Icono Ojo (Catálogo) */}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Tienda (Cliente)</span>
                </button>
                
                <button
                  onClick={() => setCurrentView("admin")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    currentView === "admin"
                      ? "bg-zinc-950 text-white shadow-sm shadow-zinc-800"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {/* Icono Ajustes (Admin) */}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                  <span>Módulo Admin</span>
                </button>
              </div>

            </div>
          </div>
        </nav>

        {/* Vista actual renderizada */}
        <main className="transition-all duration-300">
          {currentView === "catalog" ? <PremiumCatalog /> : <AdminPanel />}
        </main>
      </div>

      {/* Pie de página sutil */}
      <footer className="w-full bg-white border-t border-zinc-150 py-4.5 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
          © {new Date().getFullYear()} Glow Heaven. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
