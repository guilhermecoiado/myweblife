import { mockDb } from '../lib/mockDatabase';
import { Notification, UserRole } from '../types';

export const notificationService = {
  // Buscar todas as notificações
  async getAll(): Promise<Notification[]> {
    const notifications = await mockDb.findAll<Notification>('notifications');
    return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Buscar notificações por usuário
  async getByUser(userId: string, userRole: UserRole): Promise<Notification[]> {
    const notifications = await mockDb.findWhere<Notification>('notifications', (notif) => 
      notif.target_users.includes(userId) || 
      notif.target_roles.includes(userRole) ||
      notif.target_roles.length === 0
    );
    return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Buscar notificações não lidas por usuário
  async getUnreadByUser(userId: string, userRole: UserRole): Promise<Notification[]> {
    const notifications = await this.getByUser(userId, userRole);
    return notifications.filter(notif => !notif.is_read);
  },

  // Criar nova notificação
  async create(notificationData: Omit<Notification, 'id' | 'created_at' | 'read_at'>): Promise<Notification> {
    return await mockDb.create<Notification>('notifications', {
      ...notificationData,
      read_at: null
    });
  },

  // Marcar como lida
  async markAsRead(id: string): Promise<Notification> {
    const updated = await mockDb.update<Notification>('notifications', id, {
      is_read: true,
      read_at: new Date().toISOString()
    });
    if (!updated) {
      throw new Error('Notificação não encontrada');
    }
    return updated;
  },

  // Deletar notificação
  async delete(id: string): Promise<boolean> {
    return await mockDb.delete<Notification>('notifications', id);
  }
};