import { supabase } from '../lib/supabase';
import { Group } from '../types';

export const groupService = {
  // Buscar todos os grupos
  async getAll(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*');

    if (error) throw error;
    return data!.sort((a, b) => a.name.localeCompare(b.name));
  },

  // Buscar grupo por ID
  async getById(id: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Group;
  },

  // Buscar grupo por líder
  async getByLeader(leaderId: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('leader_id', leaderId)
      .eq('is_active', true);

    if (error || !data || data.length === 0) return null;
    return data[0] as Group;
  },

  // Criar novo grupo
  async create(groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .insert(groupData)
      .select()
      .single();

    if (error) throw error;
    return data as Group;
  },

  // Atualizar grupo
  async update(id: string, groupData: Partial<Group>): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update(groupData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error('Grupo não encontrado');
    return data as Group;
  },

  // Deletar grupo
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
