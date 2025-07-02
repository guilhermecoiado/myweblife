import { supabase } from '../lib/supabase';
import { WeeklyReport, User } from '../types';
import { userService } from './userService';

export const weeklyReportService = {
  // Buscar todos os relatórios
  async getAll(): Promise<WeeklyReport[]> {
    const { data, error } = await supabase
      .from<WeeklyReport>('weekly_reports')
      .select('*');
    if (error) throw error;
    return data;
  },

  // Buscar relatório por ID
  async getById(id: string): Promise<WeeklyReport | null> {
    const { data, error } = await supabase
      .from<WeeklyReport>('weekly_reports')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  // Buscar relatórios por líder
  async getByLeader(leaderId: string): Promise<WeeklyReport[]> {
    const { data, error } = await supabase
      .from<WeeklyReport>('weekly_reports')
      .select('*')
      .eq('leader_id', leaderId);
    if (error) throw error;
    return data.sort((a, b) => new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime());
  },

  // Buscar relatórios por hierarquia (líderes superiores veem subordinados)
  async getByHierarchy(userId: string, userRole: string): Promise<WeeklyReport[]> {
    const allReports = await this.getAll();
    const allUsers = await userService.getAll();

    if (userRole === 'superadmin') {
      return allReports.sort((a, b) => new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime());
    }

    const subordinates = this.getSubordinateUsers(userId, userRole, allUsers);
    const subordinateIds = subordinates.map(u => u.id);

    const hierarchyReports = allReports.filter(report => subordinateIds.includes(report.leader_id));

    return hierarchyReports.sort((a, b) => new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime());
  },

  // Obter subordinados baseado na hierarquia
  getSubordinateUsers(userId: string, userRole: string, allUsers: User[]): User[] {
    const subordinates: User[] = [];

    const addSubordinates = (currentUserId: string, targetRoles: string[]) => {
      const directSubs = allUsers.filter(u =>
        u.superior_id === currentUserId &&
        targetRoles.includes(u.role) &&
        u.is_active
      );
      subordinates.push(...directSubs);
      directSubs.forEach(sub => {
        if (sub.role === 'lider_area') {
          addSubordinates(sub.id, ['lider_setor', 'lider_life']);
        } else if (sub.role === 'lider_setor') {
          addSubordinates(sub.id, ['lider_life']);
        }
      });
    };

    switch (userRole) {
      case 'pastor_rede':
        addSubordinates(userId, ['lider_area', 'lider_setor', 'lider_life']);
        break;
      case 'lider_area':
        addSubordinates(userId, ['lider_setor', 'lider_life']);
        break;
      case 'lider_setor':
        addSubordinates(userId, ['lider_life']);
        break;
    }

    return subordinates;
  },

  // Criar novo relatório
  async create(reportData: Omit<WeeklyReport, 'id' | 'created_at' | 'updated_at'>): Promise<WeeklyReport> {
    const { data, error } = await supabase
      .from<WeeklyReport>('weekly_reports')
      .insert(reportData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Atualizar relatório
  async update(id: string, reportData: Partial<WeeklyReport>): Promise<WeeklyReport> {
    const { data, error } = await supabase
      .from<WeeklyReport>('weekly_reports')
      .update(reportData)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error('Relatório não encontrado');
    return data;
  },

  // Deletar relatório
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from<WeeklyReport>('weekly_reports')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Verificar se líder já enviou relatório da semana
  async hasReportForWeek(leaderId: string, weekStartDate: string): Promise<boolean> {
    const { data, error } = await supabase
      .from<WeeklyReport>('weekly_reports')
      .select('*')
      .eq('leader_id', leaderId)
      .eq('week_start_date', weekStartDate);
    if (error) throw error;
    return data.length > 0;
  },

  // Obter data de início da semana atual (segunda-feira)
  getCurrentWeekStart(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    return monday.toISOString().split('T')[0];
  },

  // Obter data de fim da semana atual (domingo)
  getCurrentWeekEnd(): string {
    const weekStart = new Date(this.getCurrentWeekStart());
    const sunday = new Date(weekStart);
    sunday.setDate(weekStart.getDate() + 6);
    return sunday.toISOString().split('T')[0];
  },

  // Verificar se é prazo para envio (até domingo meio-dia)
  isReportDeadlinePassed(): boolean {
    const now = new Date();
    const sunday = new Date(this.getCurrentWeekEnd());
    sunday.setHours(12, 0, 0, 0);
    return now > sunday;
  },

  // Obter líderes de life que devem enviar relatório
  async getLifeLeadersWhoShouldReport(): Promise<User[]> {
    const allUsers = await userService.getAll();
    return allUsers.filter(u => u.role === 'lider_life' && u.is_active);
  },

  // Obter relatórios pendentes da semana atual
  async getPendingReports(): Promise<{ leader: User; weekStart: string; weekEnd: string }[]> {
    const weekStart = this.getCurrentWeekStart();
    const lifeLeaders = await this.getLifeLeadersWhoShouldReport();
    const pendingReports: { leader: User; weekStart: string; weekEnd: string }[] = [];

    for (const leader of lifeLeaders) {
      const hasReport = await this.hasReportForWeek(leader.id, weekStart);
      if (!hasReport) {
        pendingReports.push({
          leader,
          weekStart,
          weekEnd: this.getCurrentWeekEnd()
        });
      }
    }

    return pendingReports;
  },

  // Obter relatórios recebidos da semana atual
  async getReceivedReports(): Promise<{ report: WeeklyReport; leader: User }[]> {
    const weekStart = this.getCurrentWeekStart();
    const allReports = await this.getAll();
    const weekReports = allReports.filter(r => r.week_start_date === weekStart);
    const allUsers = await userService.getAll();

    const receivedReports: { report: WeeklyReport; leader: User }[] = [];

    for (const report of weekReports) {
      const leader = allUsers.find(u => u.id === report.leader_id);
      if (leader) {
        receivedReports.push({ report, leader });
      }
    }

    return receivedReports.sort((a, b) =>
      new Date(b.report.submitted_at).getTime() - new Date(a.report.submitted_at).getTime()
    );
  }
};
