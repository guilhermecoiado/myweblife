import { supabase } from '../lib/supabase';
import { Notification, UserRole } from '../types';

export const notificationService = {
  // Buscar todas as notificações
  async getAll(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from<Notification>('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Buscar notificações por usuário
  async getByUser(userId: string, userRole: UserRole): Promise<Notification[]> {
    const { data, error } = await supabase
      .from<Notification>('notifications')
      .select('*')
      .or(
        `target_users.cs.{${userId}},target_roles.cs.{${userRole}},target_roles.cs.{}`
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Buscar notificações não lidas por usuário
  async getUnreadByUser(userId: string, userRole: UserRole): Promise<Notification[]> {
    const allNotifications = await this.getByUser(userId, userRole);
    return allNotifications.filter(notif => !notif.is_read);
  },

  // Criar nova notificação
  async create(notificationData: Omit<Notification, 'id' | 'created_at' | 'read_at'>): Promise<Notification> {
    const { data, error } = await supabase
      .from<Notification>('notifications')
      .insert({
        ...notificationData,
        read_at: null,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Marcar como lida
  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from<Notification>('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error('Notificação não encontrada');
    return data;
  },

  // Deletar notificação
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from<Notification>('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
