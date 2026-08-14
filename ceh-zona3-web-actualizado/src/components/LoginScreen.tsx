import React, { useState } from 'react';
import { loginWithEmail, resetPasswordEmail } from '../lib/firebase';
import { CehLogo } from './CehLogo';
import {
  Key,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

// Traduce los códigos de error de Firebase Auth a mensajes claros en español.
function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo electrónico no tiene un formato válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada. Contacta al Administrador.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Correo o contraseña incorrectos. Verifica tus datos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.';
    case 'auth/network-request-failed':
      return 'No hay conexión a internet. Verifica tu red e inténtalo de nuevo.';
    default:
      return 'No se pudo iniciar sesión. Verifica tus datos o contacta al Administrador.';
  }
}

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
      // El cambio de pantalla lo maneja App.tsx al detectar la sesión activa.
    } catch (err: any) {
      setErrorMessage(friendlyAuthError(err?.code || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    if (!email.trim()) {
      setErrorMessage('Escribe primero tu correo electrónico en el campo de arriba.');
      return;
    }
    setIsSendingReset(true);
    try {
      await resetPasswordEmail(email);
      setInfoMessage('Si ese correo tiene una cuenta registrada, te enviamos un enlace para restablecer tu contraseña.');
    } catch (err: any) {
      setErrorMessage(friendlyAuthError(err?.code || ''));
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">

        {/* App Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white p-2.5 text-sky-600 shadow-xl shadow-sky-900/40 border border-sky-400/30 mb-1">
            <CehLogo color="#1e88e5" className="w-full h-full" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Comité de Enlace con Hospitales
          </h1>
          <p className="text-xs text-sky-400 font-bold uppercase tracking-widest">
            Portal Privado de Administración y Gestión
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">

          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-400" />
              Ingreso al Sistema CEH
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Introduce tu correo electrónico y contraseña asignada para continuar.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-rose-950/80 border border-rose-600/50 text-rose-200 p-3.5 rounded-2xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          {infoMessage && (
            <div className="bg-sky-950/80 border border-sky-600/50 text-sky-200 p-3.5 rounded-2xl text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <p className="font-medium">{infoMessage}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ej. r.garay@comite-ceh.org"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 text-white text-xs font-semibold placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Contraseña de Acceso
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 text-white text-xs font-mono font-bold placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-sky-700 to-blue-700 hover:from-sky-600 hover:to-blue-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-sky-950/50 border border-sky-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Iniciando sesión...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isSendingReset}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline disabled:opacity-60"
            >
              {isSendingReset ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
            </button>
          </div>

        </div>

        {/* Bottom Help Notice */}
        <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
          ¿No tienes cuenta todavía? Contacta al Administrador o Secretario del CEH para que te dé de alta.
        </p>

      </div>
    </div>
  );
};
