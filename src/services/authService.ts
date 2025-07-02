import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
  // Autenticar usuário
  async authenticate(email: string, password: string): Promise<User | null> {
    try {
      // Login demo
      if (email === 'masterapp' && password === 'Padrâo@123#') {
        const { data: users, error } = await supabase
          .from('users')
          .select('*');

        if (error) throw error;

        const superadmin = users.find(u => u.role === 'superadmin');
        if (superadmin) return superadmin as User;

        // Fallback demo user
        return {
          id: 'demo-superadmin-id',
          email: 'admin@myweblife.com',
          name: 'Administrador do Sistema',
          role: 'superadmin',
          superior_id: null,
          phone: null,
          profile_photo: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // Buscar usuário ativo por email
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true);

      if (error || !users || users.length === 0) return null;

      // Em produção: verificação de hash de senha aqui
      return users[0] as User;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return null;
    }
  },

  // Buscar perfil do usuário
  async getProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) return null;
      return data as User;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  },

  // Atualizar perfil do usuário
  async updateProfile(userId: string, profileData: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) return null;
      return data as User;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return null;
    }
  }
};
