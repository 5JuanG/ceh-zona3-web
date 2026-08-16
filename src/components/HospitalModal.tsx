import React, { useState } from 'react';
import { InteractiveMap } from './InteractiveMap';

interface HospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalToEdit?: any;
}

export const HospitalModal: React.FC<HospitalModalProps> = ({ isOpen, onClose, hospitalToEdit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Formulario */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-900 text-white rounded-t-xl">
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
            🏥 {hospitalToEdit ? 'Editar Hospital de la Zona' : 'Registrar Nuevo Hospital de la Zona'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition text-sm px-2 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Cuerpo del Formulario con Distribución de Altura Controlada */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50 max-h-[calc(92vh-130px)]">
          
          {/* SECCIÓN DEL MAPA RESPONSIVO FIJADO */}
          <div className="w-full rounded-xl overflow-hidden border border-gray-200 bg-white p-2 shadow-sm">
            <p className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
              📍 Ubica el centro de salud en el mapa interactivo de control:
            </p>
            {/* Forzamos una altura de 280px para que el mapa quepa holgadamente dentro de la caja */}
            <div className="w-full rounded-lg overflow-hidden h-70 relative">
              <InteractiveMap 
                onOpenHospitalModal={() => {}} 
                onFilterDoctorsByHospital={() => {}} 
                readOnly={true} 
              />
            </div>
          </div>

          {/* FORMULARIO DE CAMPOS DE DATOS */}
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Nombre Corto *</label>
              <input type="text" placeholder="Ej. Hospital Central" className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Tipo de Centro</label>
              <select className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Público</option>
                <option>Privado / Particular</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Dirección Completa</label>
              <input type="text" placeholder="Av. Gran Vía #450" className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Teléfono de Urgencias *</label>
              <input type="text" placeholder="+52 81 4555-0100" className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Teléfono Conmutador / General</label>
              <input type="text" placeholder="+52 81 4555-0101" className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </form>

        </div>

        {/* Barra de Acciones Inferior Fija */}
        <div className="p-3 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md cursor-pointer">
            {hospitalToEdit ? 'Guardar Cambios' : 'Registrar Hospital'}
          </button>
        </div>

      </div>
    </div>
  );
};
