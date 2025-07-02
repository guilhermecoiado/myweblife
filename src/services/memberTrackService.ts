import { supabase } from '../lib/supabase';
import { MemberTrack } from '../types';

export const memberTrackService = {
  // Buscar todos os trilhos
  async getAll(): Promise<MemberTrack[]> {
    const { data, error } = await supabase
      .from<MemberTrack>('member_tracks')
      .select('*');

    if (error) throw error;
    return data;
  },

  // Buscar trilho por ID
  async getById(id: string): Promise<MemberTrack | null> {
    const { data, error } = await supabase
      .from<MemberTrack>('member_tracks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  // Buscar trilho por usuário
  async getByUserId(userId: string): Promise<MemberTrack | null> {
    const { data, error } = await supabase
      .from<MemberTrack>('member_tracks')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error) return null;
    return data;
  },

  // Criar novo trilho
  async create(trackData: Omit<MemberTrack, 'id' | 'created_at' | 'updated_at'>): Promise<MemberTrack> {
    const { data, error } = await supabase
      .from<MemberTrack>('member_tracks')
      .insert(trackData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar trilho
  async update(id: string, trackData: Partial<MemberTrack>): Promise<MemberTrack> {
    const { data, error } = await supabase
      .from<MemberTrack>('member_tracks')
      .update(trackData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error('Trilho não encontrado');
    return data;
  },

  // Atualizar trilho por usuário
  async updateByUserId(userId: string, trackData: Partial<MemberTrack>): Promise<MemberTrack> {
    const existingTrack = await this.getByUserId(userId);
    if (existingTrack) {
      return await this.update(existingTrack.id, trackData);
    } else {
      return await this.create({
        user_id: userId,
        discipulado: false,
        discipulado_por: null,
        equipe_lideranca: false,
        is_discipulador: false,
        batizado: false,
        pizza_com_pastor: false,
        estacao_dna: false,
        nova_criatura: false,
        acompanhamento_inicial: false,
        expresso_1: false,
        expresso_2: false,
        voluntario: false,
        ...trackData
      });
    }
  },

  // Deletar trilho
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from<MemberTrack>('member_tracks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Buscar discipuladores
  async getDiscipuladores(): Promise<MemberTrack[]> {
    const { data, error } = await supabase
      .from<MemberTrack>('member_tracks')
      .select('*')
      .eq('is_discipulador', true);

    if (error) throw error;
    return data;
  },

  // Buscar membros em discipulado
  async getMembersInDiscipulado(): Promise<MemberTrack[]> {
    const { data, error } = await supabase
      .from<MemberTrack>('member_tracks')
      .select('*')
      .eq('discipulado', true)
      .not('discipulado_por', 'is', null);

    if (error) throw error;
    return data;
  }
};
