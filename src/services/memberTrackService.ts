import { mockDb } from '../lib/mockDatabase';
import { MemberTrack } from '../types';

export const memberTrackService = {
  // Buscar todos os trilhos
  async getAll(): Promise<MemberTrack[]> {
    return await mockDb.findAll<MemberTrack>('member_tracks');
  },

  // Buscar trilho por ID
  async getById(id: string): Promise<MemberTrack | null> {
    return await mockDb.findById<MemberTrack>('member_tracks', id);
  },

  // Buscar trilho por usuário
  async getByUserId(userId: string): Promise<MemberTrack | null> {
    const tracks = await mockDb.findWhere<MemberTrack>('member_tracks', (track) => 
      track.user_id === userId
    );
    return tracks[0] || null;
  },

  // Criar novo trilho
  async create(trackData: Omit<MemberTrack, 'id' | 'created_at' | 'updated_at'>): Promise<MemberTrack> {
    return await mockDb.create<MemberTrack>('member_tracks', trackData);
  },

  // Atualizar trilho
  async update(id: string, trackData: Partial<MemberTrack>): Promise<MemberTrack> {
    const updated = await mockDb.update<MemberTrack>('member_tracks', id, trackData);
    if (!updated) {
      throw new Error('Trilho não encontrado');
    }
    return updated;
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
    return await mockDb.delete<MemberTrack>('member_tracks', id);
  },

  // Buscar discipuladores
  async getDiscipuladores(): Promise<MemberTrack[]> {
    return await mockDb.findWhere<MemberTrack>('member_tracks', (track) => 
      track.is_discipulador
    );
  },

  // Buscar membros em discipulado
  async getMembersInDiscipulado(): Promise<MemberTrack[]> {
    return await mockDb.findWhere<MemberTrack>('member_tracks', (track) => 
      track.discipulado && track.discipulado_por !== null
    );
  }
};