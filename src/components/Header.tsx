import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Función para cerrar el menú automáticamente al hacer clic en un enlace
  const closeMenu = () => setIsOpen(false);

  // Clase para resaltar la página activa en el menú
  const linkClass = (path: string) => 
    `text-sm font-medium transition-colors hover:text-white ${
      location.pathname === path ? 'text-blue-400 font-semibold' : 'text-slate-400'
    }`;

  const mobileLinkClass = (path: string) => 
    `py-2.5 block border-b border-slate-900 text-base transition-colors ${
      location.pathname === path ? 'text-blue-400 font-bold' : 'text-slate-300'
    }`;

  return (
    <header className="bg-slate-950 text-white w-full border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Título con enlace de regreso al inicio */}
          <div className="flex items-center">
            <Link to="/" className="font-bold text-lg tracking-tight hover:text-slate-200 transition">
              CEH Zona 3
            </Link>
          </div>

          {/* Menú de Navegación para Computadoras (Escritorio) */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={linkClass('/')}>Inicio</Link>
            <Link to="/medicos" className={linkClass('/medicos')}>Médicos</Link>
            <Link to="/congregacion" className={linkClass('/congregacion')}>Congregación y CEH</Link>
            <Link to="/admin" className={linkClass('/admin')}>Panel Admin</Link>
          </nav>

          {/* Botón de Hamburguesa para Celulares */}
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

      {/* Menú desplegable lateral móvil corregido con rutas reales */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
          <div className="w-64 bg-slate-950 h-full p-6 shadow-2xl border-l border-slate-800 flex flex-col space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-slate-200">Panel de Control</span>
              <button onClick={closeMenu} className="text-slate-400 hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="flex flex-col">
              <Link to="/" onClick={closeMenu} className={mobileLinkClass('/')}>Inicio</Link>
              <Link to="/medicos" onClick={closeMenu} className={mobileLinkClass('/medicos')}>Médicos</Link>
              <Link to="/congregacion" onClick={closeMenu} className={mobileLinkClass('/congregacion')}>Congregación y CEH</Link>
              <Link to="/admin" onClick={closeMenu} className={mobileLinkClass('/admin')}>Panel Admin</Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
