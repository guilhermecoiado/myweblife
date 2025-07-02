import { userService } from './userService';
import { notificationService } from './notificationService';
import { User } from '../types';

export const birthdayService = {
  // Verificar aniversários próximos (próximos 7 dias)
  async checkUpcomingBirthdays(): Promise<User[]> {
    try {
      const allUsers = await userService.getAll();
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcomingBirthdays = allUsers.filter(user => {
        if (!user.birth_date || !user.is_active) return false;
        
        const birthDate = new Date(user.birth_date);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        // Se o aniversário já passou este ano, considerar o próximo ano
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        return thisYearBirthday >= today && thisYearBirthday <= nextWeek;
      });
      
      return upcomingBirthdays;
    } catch (error) {
      console.error('Error checking upcoming birthdays:', error);
      return [];
    }
  },

  // Notificar líderes sobre aniversários de seus subordinados
  async notifyLeadersAboutBirthdays(): Promise<void> {
    try {
      const upcomingBirthdays = await this.checkUpcomingBirthdays();
      
      for (const member of upcomingBirthdays) {
        if (member.superior_id) {
          const leader = await userService.getById(member.superior_id);
          if (leader && leader.is_active) {
            const birthDate = new Date(member.birth_date!);
            const today = new Date();
            const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
            
            // Se o aniversário já passou este ano, considerar o próximo ano
            if (thisYearBirthday < today) {
              thisYearBirthday.setFullYear(today.getFullYear() + 1);
            }
            
            const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            let message = '';
            if (daysUntil === 0) {
              message = `🎉 Hoje é aniversário de ${member.name} ${member.last_name}! Não esqueça de parabenizar.`;
            } else if (daysUntil === 1) {
              message = `🎂 Amanhã é aniversário de ${member.name} ${member.last_name}! Prepare-se para parabenizar.`;
            } else {
              message = `📅 O aniversário de ${member.name} ${member.last_name} é em ${daysUntil} dias (${thisYearBirthday.toLocaleDateString('pt-BR')}).`;
            }
            
            // Verificar se já foi enviada notificação hoje para este aniversário
            const existingNotifications = await notificationService.getByUser(leader.id, leader.role);
            const todayNotification = existingNotifications.find(notif => 
              notif.type === 'birthday' &&
              notif.message.includes(member.name) &&
              new Date(notif.created_at).toDateString() === today.toDateString()
            );
            
            if (!existingNotification) {
              await notificationService.create({
                title: 'Lembrete de Aniversário',
                message,
                image_url: null,
                target_roles: [],
                target_users: [leader.id],
                created_by: 'system',
                is_read: false,
                type: 'birthday'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error notifying leaders about birthdays:', error);
    }
  },

  // Obter aniversários do mês
  async getBirthdaysThisMonth(): Promise<User[]> {
    try {
      const allUsers = await userService.getAll();
      const today = new Date();
      const currentMonth = today.getMonth();
      
      return allUsers.filter(user => {
        if (!user.birth_date || !user.is_active) return false;
        
        const birthDate = new Date(user.birth_date);
        return birthDate.getMonth() === currentMonth;
      }).sort((a, b) => {
        const dateA = new Date(a.birth_date!);
        const dateB = new Date(b.birth_date!);
        return dateA.getDate() - dateB.getDate();
      });
    } catch (error) {
      console.error('Error getting birthdays this month:', error);
      return [];
    }
  }
};