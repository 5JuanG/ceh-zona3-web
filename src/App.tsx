import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { CompletarRegistro } from './pages/CompletarRegistro';

// === COMPONENTES DEMO (Sustitúyelos por tus imports reales si ya los tienes en carpetas independientes) ===
const Home = () => (
  <div className="p-6 max-w-7xl mx-auto">
    <h1 className="text-2xl font-bold mb-4 text-slate-100">Panel de Bienvenida — CEH Zona 3</h1>
    <p className="text-slate-400">Selecciona una opción del menú superior o móvil para gestionar los registros e informes.</p>
  </div>
);

const Medicos = () => (
  <div className="p-6 max-w-7xl mx-auto">
    <h1 className="text-2xl font-bold mb-4 text-slate-100">Gestión de Médicos Colaboradores</h1>
    <p className="text-slate-400">Aquí podrás clasificar médicos consultores, colaboradores y proveedores de salud.</p>
  </div>
);

const Congregacion = () => (
  <div className="p-6 max-w-7xl mx-auto">
    <h1 className="text-2xl font-bold mb-4 text-slate-100">Zonas y Congregaciones</h1>
    <p className="text-slate-400">Módulo de mapas, asignación de límites territoriales oficiales e integrantes del comité.</p>
  </div>
);

const AdminPanel = () => (
  <div className="p-6 max-w-7xl mx-auto">
    <h1 className="text-2xl font-bold mb-4 text-slate-100">Panel de Administración Avanzada</h1>
    <p className="text-slate-400">Envío automatizado de accesos por correo y control de altas del sistema.</p>
  </div>
);

// === COMPONENTE PRINCIPAL APP ===
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        {/* El Header se renderiza dentro del Router, garantizando el contexto de useLocation() */}
        <Header />
        
        {/* Contenedor dinámico de la página activa */}
        <main className="flex-1 bg-slate-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/medicos" element={<Medicos />} />
            <Route path="/congregacion" element={<Congregacion />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/completar-registro" element={<CompletarRegistro />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
