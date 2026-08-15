import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CongregationManager } from './components/CongregationManager';
import { CompletarRegistro } from './pages/CompletarRegistro';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        {/* Header con enrutamiento responsivo corregido */}
        <Header />
        
        {/* Contenedor principal que inyecta las secciones reales de tu aplicación */}
        <main className="flex-1 bg-slate-900">
          <Routes>
            {/* Página de inicio con tus estadísticas, buscador de médicos y accesos */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Rutas para las secciones específicas del menú mapeadas a tus archivos reales */}
            <Route path="/medicos" element={<Dashboard />} /> 
            <Route path="/congregacion" element={<CongregationManager />} />
            <Route path="/admin" element={<CongregationManager />} /> {/* Apunta temporalmente aquí para que no falle el build */}
            
            {/* Nueva página para que los miembros configuren su contraseña */}
            <Route path="/completar-registro" element={<CompletarRegistro />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
