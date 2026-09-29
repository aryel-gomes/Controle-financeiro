import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
  db,
  doc,
  setDoc,
} from '../lib/firebase';

export const ADMIN_EMAIL = 'aryelgomes59@gmail.com';
const STORAGE_ADMIN_AUTH_KEY = 'finanplan_admin_auth_v1';
const STORAGE_ADMIN_PWD_KEY = 'finanplan_admin_password_v1';
export const DEFAULT_ADMIN_PASSWORD = 'aryel59';

interface AuthContextType {
  user: FirebaseUser | null;
  isAdmin: boolean;
  isPasswordAdmin: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  loginWithPassword: (password: string) => boolean;
  changeAdminPassword: (newPassword: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isPasswordAdmin: false,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  loginWithPassword: () => false,
  changeAdminPassword: () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Direct Admin password state
  const [isPasswordAdmin, setIsPasswordAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_ADMIN_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const isAdminUser =
            currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

          // Upsert user profile in firestore
          await setDoc(
            doc(db, 'users', currentUser.uid),
            {
              userId: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Administrador',
              photoURL: currentUser.photoURL || '',
              role: isAdminUser ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );

          if (isAdminUser) {
            await setDoc(
              doc(db, 'admins', currentUser.uid),
              {
                uid: currentUser.uid,
                email: currentUser.email,
                role: 'admin',
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }
        } catch (err) {
          console.warn('Could not upsert user document:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isGoogleAdmin = useMemo(() => {
    if (!user) return false;
    return user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }, [user]);

  const isAdmin = useMemo(() => {
    return isGoogleAdmin || isPasswordAdmin;
  }, [isGoogleAdmin, isPasswordAdmin]);

  const loginWithPassword = (enteredPassword: string): boolean => {
    const savedPassword =
      localStorage.getItem(STORAGE_ADMIN_PWD_KEY) || DEFAULT_ADMIN_PASSWORD;

    if (enteredPassword.trim() === savedPassword.trim()) {
      setIsPasswordAdmin(true);
      try {
        localStorage.setItem(STORAGE_ADMIN_AUTH_KEY, 'true');
      } catch (e) {
        console.error(e);
      }
      setError(null);
      return true;
    } else {
      setError('Senha incorreta. Tente novamente.');
      return false;
    }
  };

  const changeAdminPassword = (newPassword: string) => {
    if (!newPassword || newPassword.trim().length < 3) return;
    try {
      localStorage.setItem(STORAGE_ADMIN_PWD_KEY, newPassword.trim());
    } catch (e) {
      console.error(e);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      const code = errObj?.code || '';
      const msg = errObj?.message || '';

      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setError('auth/unauthorized-domain');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('A janela de login foi fechada antes de concluir.');
      } else if (code === 'auth/cancelled-popup-request') {
        setError('Tentativa de login cancelada.');
      } else {
        setError(msg || 'Falha ao autenticar com o Google');
      }
      console.error('Google Sign-In Error:', err);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setIsPasswordAdmin(false);
      try {
        localStorage.removeItem(STORAGE_ADMIN_AUTH_KEY);
      } catch (e) {
        console.error(e);
      }
      await signOut(auth);
    } catch (err: unknown) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isPasswordAdmin,
        loading,
        error,
        signInWithGoogle,
        loginWithPassword,
        changeAdminPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
