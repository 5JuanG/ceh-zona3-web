import React, { useState } from 'react';

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-slate-950 text-white w-full border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight truncate max-w-[200px] sm:max-w-none">
              Comité de Enlace con Hospitales
            </span>
          </div>

          {/* Botón de Hamburguesa adaptado a tu Header */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Desplegable lateral que evita que el menú flote fuera de la pantalla */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
          <div className="w-64 bg-slate-950 h-full p-6 shadow-2xl border-l border-slate-800 flex flex-col space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-slate-200">Panel de Control</span>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <a href="#" className="text-slate-300 hover:text-white py-2 block border-b border-slate-900">Inicio</a>
            <a href="#" className="text-slate-300 hover:text-white py-2 block border-b border-slate-900">Médicos</a>
            <a href="#" className="text-slate-300 hover:text-white py-2 block border-b border-slate-900">Integrantes</a>
          </div>
        </div>
      )}
    </header>
  );
};
