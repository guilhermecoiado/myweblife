import { mockDb } from '../lib/mockDatabase';
import { Group } from '../types';

export const groupService = {
  // Buscar todos os grupos
  async getAll(): Promise<Group[]> {
    const groups = await mockDb.findAll<Group>('groups');
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  },

  // Buscar grupo por ID
  async getById(id: string): Promise<Group | null> {
    return await mockDb.findById<Group>('groups', id);
  },

  // Buscar grupo por líder
  async getByLeader(leaderId: string): Promise<Group | null> {
    const groups = await mockDb.findWhere<Group>('groups', (group) => 
      group.leader_id === leaderId && group.is_active
    );
    return groups[0] || null;
  },

  // Criar novo grupo
  async create(groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> {
    return await mockDb.create<Group>('groups', groupData);
  },

  // Atualizar grupo
  async update(id: string, groupData: Partial<Group>): Promise<Group> {
    const updated = await mockDb.update<Group>('groups', id, groupData);
    if (!updated) {
      throw new Error('Grupo não encontrado');
    }
    return updated;
  },

  // Deletar grupo
  async delete(id: string): Promise<boolean> {
    return await mockDb.delete<Group>('groups', id);
  }
};