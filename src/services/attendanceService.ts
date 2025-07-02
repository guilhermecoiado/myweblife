import { mockDb } from '../lib/mockDatabase';
import { Attendance } from '../types';

export const attendanceService = {
  // Buscar todas as presenças
  async getAll(): Promise<Attendance[]> {
    return await mockDb.findAll<Attendance>('attendance');
  },

  // Buscar presença por evento
  async getByEvent(eventId: string): Promise<Attendance[]> {
    return await mockDb.findWhere<Attendance>('attendance', (att) => att.event_id === eventId);
  },

  // Buscar presença por usuário
  async getByUser(userId: string): Promise<Attendance[]> {
    return await mockDb.findWhere<Attendance>('attendance', (att) => att.user_id === userId);
  },

  // Criar nova presença
  async create(attendanceData: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance> {
    return await mockDb.create<Attendance>('attendance', attendanceData);
  },

  // Atualizar presença
  async update(id: string, attendanceData: Partial<Attendance>): Promise<Attendance> {
    const updated = await mockDb.update<Attendance>('attendance', id, attendanceData);
    if (!updated) {
      throw new Error('Presença não encontrada');
    }
    return updated;
  },

  // Check-in de usuário - CORRIGIDO
  async checkIn(userId: string, eventId: string): Promise<Attendance> {
    try {
      // Verificar se já existe registro
      const existing = await mockDb.findWhere<Attendance>('attendance', (att) => 
        att.user_id === userId && att.event_id === eventId
      );

      const attendanceData = {
        user_id: userId,
        event_id: eventId,
        status: 'present' as const,
        justification: null,
        checked_in_at: new Date().toISOString()
      };

      if (existing.length > 0) {
        // Atualizar registro existente
        return await this.update(existing[0].id, attendanceData);
      } else {
        // Criar novo registro
        return await this.create(attendanceData);
      }
    } catch (error) {
      console.error('Erro no check-in:', error);
      throw new Error('Erro ao realizar check-in');
    }
  },

  // Marcar ausência
  async markAbsent(userId: string, eventId: string, justification?: string): Promise<Attendance> {
    try {
      // Verificar se já existe registro
      const existing = await mockDb.findWhere<Attendance>('attendance', (att) => 
        att.user_id === userId && att.event_id === eventId
      );

      const attendanceData = {
        user_id: userId,
        event_id: eventId,
        status: justification ? 'justified' as const : 'absent' as const,
        justification: justification || null,
        checked_in_at: null
      };

      if (existing.length > 0) {
        // Atualizar registro existente
        return await this.update(existing[0].id, attendanceData);
      } else {
        // Criar novo registro
        return await this.create(attendanceData);
      }
    } catch (error) {
      console.error('Erro ao marcar ausência:', error);
      throw new Error('Erro ao registrar ausência');
    }
  },

  // Calcular estatísticas de presença
  async getStats(): Promise<{
    totalCheckIns: number;
    attendanceRate: number;
    todayCheckIns: number;
  }> {
    const allAttendance = await this.getAll();
    const today = new Date().toISOString().split('T')[0];
    
    const totalCheckIns = allAttendance.filter(att => att.status === 'present').length;
    const todayCheckIns = allAttendance.filter(att => 
      att.status === 'present' && 
      att.checked_in_at && 
      att.checked_in_at.startsWith(today)
    ).length;
    
    const totalRecords = allAttendance.length;
    const attendanceRate = totalRecords > 0 ? (totalCheckIns / totalRecords) * 100 : 0;

    return {
      totalCheckIns,
      attendanceRate: Math.round(attendanceRate),
      todayCheckIns
    };
  }
};