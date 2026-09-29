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
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

export const ADMIN_EMAIL = 'aryelgomes59@gmail.com';

interface AuthContextType {
  user: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocPath = `users/${currentUser.uid}`;
          const isAdminUser =
            currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

          // Upsert user profile in firestore
          await setDoc(
            doc(db, 'users', currentUser.uid),
            {
              userId: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Usuário',
              photoURL: currentUser.photoURL || '',
              role: isAdminUser ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );

          // If admin, also ensure registry in admins/{uid}
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

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Falha ao autenticar com o Google';
      setError(errMsg);
      console.error('Google Sign-In Error:', err);
    }
  };

  const logout = async () => {
    try {
      setError(null);
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
        loading,
        error,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
