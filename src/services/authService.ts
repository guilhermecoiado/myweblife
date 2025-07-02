import { mockDb } from '../lib/mockDatabase';
import { User } from '../types';

export const authService = {
  // Autenticar usuário
  async authenticate(email: string, password: string): Promise<User | null> {
    try {
      // Login demo
      if (email === 'masterapp' && password === 'Padrâo@123#') {
        const users = await mockDb.findAll<User>('users');
        const superadmin = users.find(u => u.role === 'superadmin');
        
        if (superadmin) {
          return superadmin;
        }
        
        // Fallback para usuário demo se não encontrar superadmin
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

      // Buscar usuário por email
      const users = await mockDb.findWhere<User>('users', (user) => 
        user.email === email && user.is_active
      );
      
      if (users.length > 0) {
        // Em produção, aqui você verificaria o hash da senha
        // Por enquanto, aceita qualquer senha para usuários existentes
        return users[0];
      }

      return null;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return null;
    }
  },

  // Buscar perfil do usuário
  async getProfile(userId: string): Promise<User | null> {
    try {
      return await mockDb.findById<User>('users', userId);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  },

  // Atualizar perfil do usuário
  async updateProfile(userId: string, profileData: Partial<User>): Promise<User | null> {
    try {
      return await mockDb.update<User>('users', userId, profileData);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return null;
    }
  }
};