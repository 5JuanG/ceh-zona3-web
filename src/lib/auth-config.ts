import { getAuth } from "firebase/auth";

export const configureFirebaseAuth = () => {
  const auth = getAuth();
  auth.languageCode = 'es'; 
  return auth;
};

export const getActionCodeSettings = (email: string) => {
  const hostname = window.location.hostname;
  const baseUrl = hostname === 'localhost' || hostname === '127.0.0.1'
    ? 'http://localhost:5173'
    : `https://${hostname}`;

  return {
    url: `${baseUrl}/completar-registro?email=${encodeURIComponent(email.toLowerCase().trim())}`,
    handleCodeInApp: true,
  };
};
