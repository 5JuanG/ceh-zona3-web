import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenPrintModal: () => void;
  onOpenExcelModal: () => void;
  onOpenMemberWorksheetModal: (memberId?: string) => void;
  currentUser: { name: string; role: string; email?: string; photoUrl?: string } | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPrintModal,
  onOpenExcelModal,
  onOpenMemberWorksheetModal,
  currentUser,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeTab, setActiveTab } = useApp();

  const closeMenu = () => setIsOpen(false);

  // Validador de pestañas activas para resaltar el menú de escritorio
  const linkClass = (tabId: string) => 
    `text-sm font-medium transition-colors cursor-pointer hover:text-white ${
      activeTab === tabId ? 'text-blue-400 font-semibold border-b-2 border-blue-500 pb-1' : 'text-slate-400'
    }`;

  // Validador de pestañas activas para resaltar el menú móvil
  const mobileLinkClass = (tabId: string) => 
    `py-2.5 block border-b border-slate-900 text-base cursor-pointer transition-colors ${
      activeTab === tabId ? 'text-blue-400 font-bold bg-slate-900/40 px-2 rounded' : 'text-slate-300 hover:text-white'
    }`;

  return (
    <header className="bg-slate-950 text-white w-full border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Título Principal */}
          <div className="flex items-center cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <span className="font-bold text-base sm:text-lg tracking-tight hover:text-slate-200 transition">
              Comité de Enlace con Hospitales
            </span>
          </div>

          {/* Menú de Escritorio (Navegación basada en Pestañas Reales con Admin Asegurado) */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => setActiveTab('dashboard')} className={linkClass('dashboard')}>Inicio</button>
            <button onClick={() => setActiveTab('doctors')} className={linkClass('doctors')}>Médicos</button>
            <button onClick={() => setActiveTab('congregations')} className={linkClass('congregations')}>Congregación y CEH</button>
            <button onClick={() => setActiveTab('admin')} className={linkClass('admin')}>Panel Admin</button>
          </nav>

          {/* Bloque de Usuario y Herramientas */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-xs text-slate-400 truncate max-w-[120px]">
              {currentUser?.name || 'Administrador'}
            </span>
            <button 
              onClick={() => onOpenMemberWorksheetModal()}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-medium transition"
            >
              Hoja de Trabajo
            </button>
            <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-300 font-medium">
              Salir
            </button>
          </div>

          {/* Botón de Hamburguesa Responsivo para Celulares */}
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

      {/* Menú Desplegable Lateral para Dispositivos Móviles */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-64 bg-slate-950 h-full p-6 shadow-2xl border-l border-slate-800 flex flex-col justify-between">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-slate-200">Panel CEH</span>
                <button onClick={closeMenu} className="text-slate-400 hover:text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <nav className="flex flex-col space-y-1">
                <button onClick={() => { setActiveTab('dashboard'); closeMenu(); }} className={mobileLinkClass('dashboard')}>Inicio</button>
                <button onClick={() => { setActiveTab('doctors'); closeMenu(); }} className={mobileLinkClass('doctors')}>Médicos</button>
                <button onClick={() => { setActiveTab('congregations'); closeMenu(); }} className={mobileLinkClass('congregations')}>Congregación y CEH</button>
                <button onClick={() => { setActiveTab('admin'); closeMenu(); }} className={mobileLinkClass('admin')}>Panel Admin</button>
              </nav>
            </div>

            {/* Acciones del menú inferior móvil */}
            <div className="flex flex-col space-y-3 border-t border-slate-800 pt-4">
              <button 
                onClick={() => { onOpenMemberWorksheetModal(); closeMenu(); }}
                className="w-full text-center bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm font-medium transition"
              >
                Generar Hoja Trabajo
              </button>
              <button onClick={() => { onLogout(); closeMenu(); }} className="w-full text-center bg-slate-900 text-red-400 py-2 rounded-lg text-sm font-medium">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
