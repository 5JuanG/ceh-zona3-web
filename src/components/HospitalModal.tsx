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
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] border border-gray-200">
        
        {/* Cabecera del Formulario */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-900 text-white rounded-t-xl">
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
            🏥 {hospitalToEdit ? 'Editar Hospital de la Zona' : 'Registrar Nuevo Hospital de la Zona'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition text-sm px-2">
            ✕
          </button>
        </div>

        {/* Cuerpo del Modal con Scroll Aislado para evitar Empalmes */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50">
          
          {/* SECCIÓN DEL MAPA RESPONSIVO TOTALMENTE ENCUADRADO */}
          <div className="w-full rounded-xl overflow-hidden border border-gray-200 bg-white p-2 shadow-sm">
            <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
              📍 Ubica el centro de salud en el mapa interactivo de control:
            </p>
            <div className="w-full rounded-lg overflow-hidden h-[300px]">
              <InteractiveMap 
                onOpenHospitalModal={() => {}} 
                onFilterDoctorsByHospital={() => {}} 
                readOnly={true} // Oculta botones administrativos dentro del formulario
              />
            </div>
          </div>

          {/* FORMULARIO DE CAMPOS ORIGINALES COMPLETO */}
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Nombre Corto *</label>
              <input type="text" placeholder="Ej. Hospital Central" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tipo de Centro</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Público</option>
                <option>Privado / Particular</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">Dirección Completa</label>
              <input type="text" placeholder="Av. Gran Vía #450" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Teléfono de Urgencias *</label>
              <input type="text" placeholder="+52 81 4555-0100" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Teléfono Conmutador / General</label>
              <input type="text" placeholder="+52 81 4555-0101" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </form>

        </div>

        {/* Barra de Acciones Inferior */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md">
            {hospitalToEdit ? 'Guardar Cambios' : 'Registrar Hospital'}
          </button>
        </div>

      </div>
    </div>
  );
};
