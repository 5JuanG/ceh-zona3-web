import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CehLogo } from './CehLogo';
import { 
  Building2, 
  UserCheck, 
  Search, 
  CalendarCheck, 
  FileText, 
  BookOpen, 
  LayoutDashboard, 
  Download, 
  Upload, 
  Printer, 
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  Compass,
  Users,
  Menu,
  X,
  LogOut,
  User,
  Cloud
} from 'lucide-react';

interface HeaderProps {
  onOpenPrintModal: () => void;
  onOpenExcelModal: () => void;
  onOpenMemberWorksheetModal?: () => void;
  currentUser?: { name: string; role: string; email?: string; photoUrl?: string } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenPrintModal, 
  onOpenExcelModal,
  onOpenMemberWorksheetModal,
  currentUser,
  onLogout 
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    globalSearch, 
    setGlobalSearch,
    exportDataJSON, 
    importDataJSON,
    stats,
    isCloudSynced,
    syncAllToCloud
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          alert('¡Datos importados con éxito!');
        } else {
          alert('Error al importar el archivo JSON. Verifique que el formato sea correcto.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  interface NavItem {
    id: 'dashboard' | 'doctors' | 'hospitals' | 'map' | 'visits' | 'cases' | 'resources' | 'congregations' | 'admin';
    label: string;
    icon: React.ElementType;
    count?: number;
    alert?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'congregations', label: 'Congregaciones y CEH', icon: Users, count: stats.totalCongregations },
    { id: 'admin', label: 'Panel Admin', icon: ShieldCheck },
    { id: 'doctors', label: 'Médicos', icon: UserCheck, count: stats.totalDoctors },
    { id: 'hospitals', label: 'Hospitales', icon: Building2, count: stats.totalHospitals },
    { id: 'map', label: 'Mapa Zona 3', icon: Compass },
    { id: 'visits', label: 'Visitas', icon: CalendarCheck, count: stats.totalVisitsThisMonth },
    { id: 'cases', label: 'Casos Activos', icon: ShieldAlert, count: stats.activeCasesCount, alert: stats.activeCasesCount > 0 },
    { id: 'resources', label: 'Recursos PBM', icon: BookOpen },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center text-sky-600 shadow-md border border-slate-700/50 hover:scale-105 transition-transform">
              <CehLogo color="#1e88e5" className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                  Comité de Enlace con Hospitales
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-sky-900/80 text-sky-300 rounded border border-sky-700/50">
                  CEH / COL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Gestión de Médicos Colaboradores, Consultores y Red Hospitalaria
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar médico, especialidad, hospital o técnica..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-800/90 text-sm text-slate-100 placeholder-slate-400 pl-9 pr-4 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Cloud Sync Status Button (Always visible on mobile & desktop) */}
            <button
              onClick={() => {
                syncAllToCloud().then((res) => {
                  if (res.ok) alert('¡Todos los 16 miembros y datos han sido sincronizados a la Nube (Firestore) con éxito!');
                  else alert(`Error al sincronizar con la Nube:\n${res.error || 'Verifica tu conexión.'}`);
                });
              }}
              title="Haz clic para forzar la sincronización en la Nube"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-sky-900/90 hover:bg-sky-800 text-sky-200 rounded-lg border border-sky-500/70 shadow-sm transition-all"
            >
              <Cloud className="w-4 h-4 text-sky-300 animate-pulse" />
              <span className="inline sm:hidden">☁️ Nube</span>
              <span className="hidden sm:inline lg:hidden">Sync Nube</span>
              <span className="hidden lg:inline">{isCloudSynced ? 'Sincronizado en Nube' : 'Sincronizar Nube'}</span>
            </button>

            {onOpenMemberWorksheetModal && (
              <button
                onClick={onOpenMemberWorksheetModal}
                title="Generar Hoja de Trabajo en PDF por Miembro del CEH"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-sm transition-colors"
              >
                <FileText className="w-4 h-4 text-sky-100" />
                <span className="hidden lg:inline">Hoja Miembro PDF</span>
                <span className="inline lg:hidden">Hoja PDF</span>
              </button>
            )}

            <button
              onClick={onOpenPrintModal}
              title="Generar Reporte Imprimible de Médicos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span className="hidden lg:inline">Reporte Imprimible</span>
            </button>

            {/* Backup / Data Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-300" />
                <span className="hidden sm:inline">Respaldos</span>
              </button>

              {showDataMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                  <button
                    onClick={() => {
                      onOpenExcelModal();
                      setShowDataMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-emerald-300 font-semibold flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    Importar Excel / CSV Médicos
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('map');
                      setShowDataMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-amber-300 font-semibold flex items-center gap-2"
                  >
                    <Compass className="w-4 h-4 text-amber-400" />
                    Cargar Mapa KML / Google Earth
                  </button>
                  <hr className="border-slate-700 my-1" />
                  <button
                    onClick={() => {
                      exportDataJSON();
                      setShowDataMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    Exportar Copia JSON
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowDataMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-sky-400" />
                    Importar Copia JSON
                  </button>
                </div>
              )}
            </div>

            {/* User Profile & Logout Button */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="flex items-center gap-2 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700">
                  {currentUser.photoUrl ? (
                    <img 
                      src={currentUser.photoUrl} 
                      alt={currentUser.name} 
                      className="w-6 h-6 rounded-full object-cover border border-sky-400/50" 
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="text-left leading-tight">
                    <div className="text-xs font-bold text-slate-100 max-w-[120px] truncate">{currentUser.name}</div>
                    <div className="text-[9px] text-sky-400 font-semibold">{currentUser.role}</div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Cerrar Sesión"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white md:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en el Comité..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-slate-800 text-sm text-slate-100 placeholder-slate-400 pl-9 pr-4 py-1.5 rounded-lg border border-slate-700"
            />
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex gap-1 border-t border-slate-800 pt-1 pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`ml-1 text-xs px-1.5 py-0.2 rounded-full font-semibold ${
                      item.alert
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : isActive
                        ? 'bg-sky-700 text-sky-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-4 space-y-2">
          {/* Mobile Cloud Sync Banner */}
          <div className="bg-gradient-to-r from-sky-950 to-slate-900 border border-sky-500/60 rounded-xl p-3 flex items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-300 shrink-0">
                <Cloud className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-sky-100 flex items-center gap-1.5">
                  Sincronización Nube
                  <span className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-sky-400 animate-pulse' : 'bg-amber-400'}`} />
                </div>
                <div className="text-[10px] text-sky-300/80">
                  {isCloudSynced ? 'Conectado a Firebase Nube' : 'Sincronizar 16 miembros'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                syncAllToCloud().then((res) => {
                  if (res.ok) alert('¡Éxito! Todos los 16 miembros y datos se han sincronizado con la Nube.');
                  else alert(`Error al sincronizar con la Nube:\n${res.error || 'Verifica tu conexión.'}`);
                });
              }}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow border border-sky-400/40 shrink-0 flex items-center gap-1"
            >
              <Cloud className="w-3.5 h-3.5" />
              Sincronizar
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-semibold">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Hidden File Input for Data Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />
    </header>
  );
};
