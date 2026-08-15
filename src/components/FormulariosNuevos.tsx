import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const FormularioProveedores: React.FC = () => {
  const [formData, setFormData] = useState({ nombreComercial: '', servicio: '', direccion: '', telefono: '', convenio: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'proveedores'), formData);
    alert('Proveedor guardado exitosamente');
    setFormData({ nombreComercial: '', servicio: '', direccion: '', telefono: '', convenio: '' });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-sm border">
      <h3 className="text-lg font-bold text-gray-800">Registrar Proveedor de la Salud</h3>
      <input type="text" placeholder="Nombre Comercial" required value={formData.nombreComercial} onChange={e => setFormData({...formData, nombreComercial: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
      <input type="text" placeholder="Servicio / Especialidad" required value={formData.servicio} onChange={e => setFormData({...formData, servicio: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
      <input type="text" placeholder="Dirección" required value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
      <input type="text" placeholder="Teléfono" required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
      <input type="text" placeholder="Detalles del Convenio" required value={formData.convenio} onChange={e => setFormData({...formData, convenio: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Guardar Proveedor</button>
    </form>
  );
};

export const FormularioAdministrativo: React.FC = () => {
  const [formData, setFormData] = useState({ nombre: '', hospital: '', cargo: '', telefonoDirecto: '', nivelApoyo: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'personal_administrativo'), formData);
    alert('Personal administrativo guardado exitosamente');
    setFormData({ nombre: '', hospital: '', cargo: '', telefonoDirecto: '', nivelApoyo: '' });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-sm border">
      <h3 className="text-lg font-bold text-gray-800">Registrar Personal Administrativo</h3>
      <input type="text" placeholder="Nombre Completo" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
      <input type="text" placeholder="Hospital / Institución" required value={formData.hospital} onChange={e => setFormData({...formData, hospital: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
      <input type="text" placeholder="Cargo" required value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
      <input type="text" placeholder="Teléfono Directo" required value={formData.telefonoDirecto} onChange={e => setFormData({...formData, telefonoDirecto: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
      <input type="text" placeholder="Nivel de Apoyo / Notas" required value={formData.nivelApoyo} onChange={e => setFormData({...formData, nivelApoyo: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
      <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Guardar Personal</button>
    </form>
  );
};
