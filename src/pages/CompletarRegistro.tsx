import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const CompletarRegistro: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'verificando' | 'listo' | 'procesando' | 'exito' | 'error'>('verificando');
  const [errorMessage, setErrorMessage] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const searchParams = new URLSearchParams(location.search);
      let userEmail = searchParams.get('email') || '';

      if (!userEmail) {
        userEmail = window.prompt('Por favor, introduce tu correo electrónico para confirmar:') || '';
      }

      if (userEmail) {
        setEmail(userEmail.toLowerCase().trim());
        setStatus('listo');
      } else {
        setStatus('error');
        setErrorMessage('Se requiere el correo electrónico para validar este enlace.');
      }
    } else {
      setStatus('error');
      setErrorMessage('El enlace de acceso no es válido o ya ha expirado.');
    }
  }, [auth, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setStatus('procesando');
    setErrorMessage('');

    try {
      const result = await signInWithEmailLink(auth, email, window.location.href);
      if (result.user) {
        await updatePassword(result.user, password);
        await updateDoc(doc(db, 'miembros', email), {
          activo: true
        });
        setStatus('exito');
        setTimeout(() => { navigate('/dashboard'); }, 3000);
      }
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage('Error al configurar tu cuenta. Contacta al administrador.');
    }
  };

  if (status === 'verificando') {
    return <div className="flex items-center justify-center h-screen bg-gray-50"><p className="text-gray-600 animate-pulse text-lg">Validando credenciales...</p></div>;
  }

  if (status === 'exito') {
    return <div className="flex items-center justify-center h-screen bg-gray-50"><div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md text-center"><span className="text-5xl">✅</span><h2 className="mt-4 text-2xl font-bold text-gray-800">¡Cuenta Activada!</h2></div></div>;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 px-4">
      <div className="p-8 max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Configura tu Contraseña</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Asigna una clave para: <span className="font-medium text-gray-700">{email}</span></p>
        {errorMessage && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{errorMessage}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Activar mi Cuenta</button>
        </form>
      </div>
    </div>
  );
};
