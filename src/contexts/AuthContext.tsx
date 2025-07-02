import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContext as AuthContextType } from '../types';
import { authService } from '../services/authService';
import { testConnection } from '../lib/mockDatabase';
import { toast } from 'react-toastify';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Testar conexão com o banco e verificar sessão existente
    const initializeAuth = async () => {
      try {
        // Testar conexão com mock database
        const connected = await testConnection();
        if (!connected) {
          toast.error('Erro na inicialização do banco de dados');
        }

        // Verificar se há usuário logado no localStorage
        const savedUser = localStorage.getItem('myweblife_user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            // Verificar se o usuário ainda existe no banco
            const currentUser = await authService.getProfile(userData.id);
            if (currentUser && currentUser.is_active) {
              setUser(currentUser);
            } else {
              localStorage.removeItem('myweblife_user');
            }
          } catch (error) {
            localStorage.removeItem('myweblife_user');
          }
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const authenticatedUser = await authService.authenticate(email, password);
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
        localStorage.setItem('myweblife_user', JSON.stringify(authenticatedUser));
        toast.success('Login realizado com sucesso!');
      } else {
        throw new Error('Credenciais inválidas');
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem('myweblife_user');
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error('Usuário não encontrado');

      const updatedUser = await authService.updateProfile(user.id, data);
      
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('myweblife_user', JSON.stringify(updatedUser));
        toast.success('Perfil atualizado com sucesso!');
      } else {
        throw new Error('Erro ao atualizar perfil');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};