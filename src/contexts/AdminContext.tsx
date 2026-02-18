import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getFirebaseIdToken } from '@/utils/firebaseToken';
import { useAuth } from '@/contexts/AuthContext';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType>({ isAdmin: false, isLoading: true });

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish before running the admin check
    if (authLoading) return;

    // If not authenticated, no need to check — not an admin
    if (!isAuthenticated) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const checkAdmin = async () => {
      setIsLoading(true);
      try {
        const token = await getFirebaseIdToken();
        if (!token) {
          setIsAdmin(false);
          return;
        }

        const res = await fetch(`https://dzzeaesctendsggfdxra.supabase.co/functions/v1/admin-check-role`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin === true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [isAuthenticated, authLoading, user?.id]);

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);

