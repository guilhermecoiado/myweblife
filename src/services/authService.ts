import { supabase } from '../lib/supabase';
import { User } from '../types';
import bcrypt from 'bcryptjs';

export const authService = {
  // Autenticar usuário
  async authenticate(email: string, password: string): Promise<User | null> {
    try {
      // Buscar usuário ativo por email
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true);

      if (error || !users || users.length === 0) return null;

      const user = users[0] as User & { password_hash?: string };

      if (!user.password_hash) return null;
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return null;

      // Não retorne o hash para o frontend!
      delete (user as any).password_hash;

      return user;
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
