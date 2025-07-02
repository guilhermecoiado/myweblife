import { mockDb } from '../lib/mockDatabase';
import { User, UserRole } from '../types';

export const userService = {
  // Buscar todos os usuários
  async getAll(): Promise<User[]> {
    const users = await mockDb.findAll<User>('users');
    return users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Buscar usuário por ID
  async getById(id: string): Promise<User | null> {
    return await mockDb.findById<User>('users', id);
  },

  // Buscar usuário por email
  async getByEmail(email: string): Promise<User | null> {
    const users = await mockDb.findWhere<User>('users', (user) => user.email === email);
    return users[0] || null;
  },

  // Criar novo usuário
  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    return await mockDb.create<User>('users', userData);
  },

  // Atualizar usuário
  async update(id: string, userData: Partial<User>): Promise<User> {
    const updated = await mockDb.update<User>('users', id, userData);
    if (!updated) {
      throw new Error('Usuário não encontrado');
    }
    return updated;
  },

  // Deletar usuário
  async delete(id: string): Promise<boolean> {
    return await mockDb.delete<User>('users', id);
  },

  // Buscar usuários por role
  async getByRole(role: UserRole): Promise<User[]> {
    return await mockDb.findWhere<User>('users', (user) => 
      user.role === role && user.is_active
    );
  },

  // Buscar subordinados de um usuário
  async getSubordinates(userId: string): Promise<User[]> {
    return await mockDb.findWhere<User>('users', (user) => user.superior_id === userId);
  },

  // Ativar/Desativar usuário
  async toggleStatus(id: string, isActive: boolean): Promise<User> {
    const updated = await mockDb.update<User>('users', id, { is_active: isActive });
    if (!updated) {
      throw new Error('Usuário não encontrado');
    }
    return updated;
  }
};