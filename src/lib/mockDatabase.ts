import { User, Event, EventType, Group, Notification, Attendance, MemberTrack, WeeklyReport } from '../types';

// Mock database using localStorage for persistence
class MockDatabase {
  private getStorageKey(table: string): string {
    return `myweblife_${table}`;
  }

  private getData<T>(table: string): T[] {
    const data = localStorage.getItem(this.getStorageKey(table));
    return data ? JSON.parse(data) : [];
  }

  private setData<T>(table: string, data: T[]): void {
    localStorage.setItem(this.getStorageKey(table), JSON.stringify(data));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Initialize with default data
  init(): void {
    // Initialize groups if empty
    const groups = this.getData<Group>('groups');
    if (groups.length === 0) {
      const defaultGroups: Group[] = [
        {
          id: 'group-1',
          name: 'Rede Central',
          type: 'rede',
          leader_id: 'pastor-1',
          description: 'Rede principal da igreja',
          image_url: null,
          meeting_day: null,
          meeting_time: null,
          address: null,
          cep: null,
          latitude: null,
          longitude: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'group-2',
          name: 'Área Norte',
          type: 'area',
          leader_id: 'lider-1',
          description: 'Área norte da cidade',
          image_url: null,
          meeting_day: null,
          meeting_time: null,
          address: null,
          cep: null,
          latitude: null,
          longitude: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'lifegroup-1',
          name: 'Lifegroup Esperança',
          type: 'lifegroup',
          leader_id: 'lider-life-1',
          description: 'Lifegroup focado em jovens e famílias',
          image_url: 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=400',
          meeting_day: 3, // Quarta-feira
          meeting_time: '20:00',
          address: 'Rua das Flores, 123, Vila Esperança, São Paulo - SP',
          cep: '01234-567',
          latitude: -23.5505,
          longitude: -46.6333,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'lifegroup-2',
          name: 'Lifegroup Vitória',
          type: 'lifegroup',
          leader_id: 'lider-life-2',
          description: 'Lifegroup para crescimento espiritual',
          image_url: 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=400',
          meeting_day: 5, // Sexta-feira
          meeting_time: '19:30',
          address: 'Av. Paulista, 456, Bela Vista, São Paulo - SP',
          cep: '01310-100',
          latitude: -23.5618,
          longitude: -46.6565,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      this.setData('groups', defaultGroups);
    }

    // Initialize users if empty
    const users = this.getData<User>('users');
    if (users.length === 0) {
      const defaultUsers: User[] = [
        {
          id: 'superadmin-1',
          email: 'admin@myweblife.com',
          name: 'Administrador',
          last_name: 'do Sistema',
          role: 'superadmin',
          superior_id: null,
          phone: '(11) 99999-9999',
          profile_photo: null,
          group_id: null,
          birth_date: null,
          member_status: 'ativo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'pastor-1',
          email: 'pastor@myweblife.com',
          name: 'Pastor',
          last_name: 'da Rede',
          role: 'pastor_rede',
          superior_id: 'superadmin-1',
          phone: '(11) 88888-8888',
          profile_photo: null,
          group_id: 'group-1',
          birth_date: null,
          member_status: 'ativo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'lider-1',
          email: 'lider@myweblife.com',
          name: 'Líder',
          last_name: 'de Área',
          role: 'lider_area',
          superior_id: 'pastor-1',
          phone: '(11) 77777-7777',
          profile_photo: null,
          group_id: 'group-2',
          birth_date: null,
          member_status: 'ativo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'lider-setor-1',
          email: 'lidersetor@myweblife.com',
          name: 'Líder',
          last_name: 'de Setor',
          role: 'lider_setor',
          superior_id: 'lider-1',
          phone: '(11) 66666-6666',
          profile_photo: null,
          group_id: null,
          birth_date: null,
          member_status: 'ativo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'lider-life-1',
          email: 'liderlife1@myweblife.com',
          name: 'Carla',
          last_name: 'Silva',
          role: 'lider_life',
          superior_id: 'lider-setor-1',
          phone: '(11) 55555-5555',
          profile_photo: null,
          group_id: 'lifegroup-1',
          birth_date: null,
          member_status: 'ativo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'lider-life-2',
          email: 'liderlife2@myweblife.com',
          name: 'Renan',
          last_name: 'Santos',
          role: 'lider_life',
          superior_id: 'lider-setor-1',
          phone: '(11) 44444-4444',
          profile_photo: null,
          group_id: 'lifegroup-2',
          birth_date: null,
          member_status: 'ativo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'lider-life-3',
          email: 'liderlife3@myweblife.com',
          name: 'Pedro',
          last_name: 'Costa',
          role: 'lider_life',
          superior_id: 'lider-setor-1',
          phone: '(11) 33333-3333',
          profile_photo: null,
          group_id: null,
          birth_date: null,
          member_status: 'ativo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'membro-1',
          email: 'membro1@myweblife.com',
          name: 'João',
          last_name: 'Silva',
          role: 'membro_life',
          superior_id: 'lider-life-1',
          phone: '(11) 66666-6666',
          profile_photo: null,
          group_id: 'lifegroup-1',
          birth_date: '1990-05-15',
          member_status: 'ativo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'membro-2',
          email: 'membro2@myweblife.com',
          name: 'Maria',
          last_name: 'Santos',
          role: 'membro_life',
          superior_id: 'lider-life-1',
          phone: '(11) 55555-5555',
          profile_photo: null,
          group_id: 'lifegroup-1',
          birth_date: '1985-12-03',
          member_status: 'consolidacao',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'membro-sem-grupo-1',
          email: 'membro3@myweblife.com',
          name: 'Ana',
          last_name: 'Costa',
          role: 'membro_life',
          superior_id: 'lider-life-1',
          phone: '(11) 44444-4444',
          profile_photo: null,
          group_id: null, // Sem grupo para teste
          birth_date: '1992-08-20',
          member_status: 'ativo',
          is_active: false, // Inativo no sistema para teste
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'membro-sem-grupo-2',
          email: 'membro4@myweblife.com',
          name: 'Carlos',
          last_name: 'Oliveira',
          role: 'membro_life',
          superior_id: 'lider-life-2',
          phone: '(11) 33333-3333',
          profile_photo: null,
          group_id: null, // Sem grupo para teste
          birth_date: '1988-11-10',
          member_status: 'consolidacao',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      this.setData('users', defaultUsers);
    }

    // Initialize member tracks if empty
    const memberTracks = this.getData<MemberTrack>('member_tracks');
    if (memberTracks.length === 0) {
      const defaultTracks: MemberTrack[] = [
        {
          id: 'track-1',
          user_id: 'membro-1',
          discipulado: true,
          discipulado_por: 'lider-life-1',
          equipe_lideranca: false,
          is_discipulador: true,
          batizado: true,
          pizza_com_pastor: true,
          estacao_dna: true,
          nova_criatura: true,
          acompanhamento_inicial: true,
          expresso_1: true,
          expresso_2: 'progress',
          voluntario: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'track-2',
          user_id: 'membro-2',
          discipulado: 'progress',
          discipulado_por: null,
          equipe_lideranca: false,
          is_discipulador: false,
          batizado: false,
          pizza_com_pastor: true,
          estacao_dna: true,
          nova_criatura: true,
          acompanhamento_inicial: 'progress',
          expresso_1: false,
          expresso_2: false,
          voluntario: 'progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      this.setData('member_tracks', defaultTracks);
    }

    // Initialize weekly reports if empty
    const weeklyReports = this.getData<WeeklyReport>('weekly_reports');
    if (weeklyReports.length === 0) {
      const lastWeekStart = this.getLastWeekStart();
      const lastWeekEnd = this.getLastWeekEnd();
      
      const defaultReports: WeeklyReport[] = [
        {
          id: 'report-1',
          leader_id: 'lider-life-1',
          week_start_date: lastWeekStart,
          week_end_date: lastWeekEnd,
          fixed_members_present: 8,
          guests_present: 2,
          children_present: 3,
          observations: 'Ótima reunião, muita participação dos membros.',
          submitted_at: new Date(lastWeekEnd + 'T10:30:00').toISOString(),
          created_at: new Date(lastWeekEnd + 'T10:30:00').toISOString(),
          updated_at: new Date(lastWeekEnd + 'T10:30:00').toISOString(),
        },
        {
          id: 'report-2',
          leader_id: 'lider-life-2',
          week_start_date: lastWeekStart,
          week_end_date: lastWeekEnd,
          fixed_members_present: 6,
          guests_present: 1,
          children_present: 2,
          observations: null,
          submitted_at: new Date(lastWeekEnd + 'T11:15:00').toISOString(),
          created_at: new Date(lastWeekEnd + 'T11:15:00').toISOString(),
          updated_at: new Date(lastWeekEnd + 'T11:15:00').toISOString(),
        }
      ];
      this.setData('weekly_reports', defaultReports);
    }

    // Initialize event types if empty
    const eventTypes = this.getData<EventType>('event_types');
    if (eventTypes.length === 0) {
      const defaultEventTypes: EventType[] = [
        {
          id: 'type-1',
          name: 'Culto Domingo',
          description: 'Culto principal de domingo',
          default_time: '19:00',
          default_day: 0, // Domingo
          is_recurring: true,
          recurrence_pattern: 'weekly',
          target_roles: ['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life'],
          created_by: 'superadmin-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'type-2',
          name: 'Lifegroup',
          description: 'Reunião de célula',
          default_time: '20:00',
          default_day: 3, // Quarta
          is_recurring: true,
          recurrence_pattern: 'weekly',
          target_roles: ['lider_life', 'membro_life'],
          created_by: 'superadmin-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'type-3',
          name: 'Tadel Fim de Semana',
          description: 'Reunião de jovens',
          default_time: '19:00',
          default_day: 5, // Sexta
          is_recurring: true,
          recurrence_pattern: 'weekly',
          target_roles: ['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life'],
          created_by: 'superadmin-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      this.setData('event_types', defaultEventTypes);
    }

    // Initialize events if empty
    const events = this.getData<Event>('events');
    if (events.length === 0) {
      const today = new Date();
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + (7 - today.getDay()));
      
      const nextWednesday = new Date(today);
      nextWednesday.setDate(today.getDate() + ((3 - today.getDay() + 7) % 7));
      
      const nextFriday = new Date(today);
      nextFriday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));

      const defaultEvents: Event[] = [
        {
          id: 'event-1',
          title: 'Culto Domingo',
          description: 'Culto principal de domingo',
          event_date: nextSunday.toISOString().split('T')[0],
          event_time: '19:00',
          is_recurring: true,
          recurrence_pattern: 'weekly',
          target_roles: ['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life'],
          created_by: 'superadmin-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'event-2',
          title: 'Lifegroup - Esperança',
          description: 'Reunião do lifegroup Esperança',
          event_date: nextWednesday.toISOString().split('T')[0],
          event_time: '20:00',
          is_recurring: true,
          recurrence_pattern: 'weekly',
          target_roles: ['lider_life', 'membro_life'],
          created_by: 'lider-life-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'event-3',
          title: 'Lifegroup - Vitória',
          description: 'Reunião do lifegroup Vitória',
          event_date: nextFriday.toISOString().split('T')[0],
          event_time: '19:30',
          is_recurring: true,
          recurrence_pattern: 'weekly',
          target_roles: ['lider_life', 'membro_life'],
          created_by: 'lider-life-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      this.setData('events', defaultEvents);
    }

    // Initialize attendance if empty
    const attendance = this.getData<Attendance>('attendance');
    if (attendance.length === 0) {
      const defaultAttendance: Attendance[] = [
        {
          id: 'att-1',
          user_id: 'membro-1',
          event_id: 'event-1',
          status: 'present',
          justification: null,
          checked_in_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: 'att-2',
          user_id: 'membro-2',
          event_id: 'event-1',
          status: 'present',
          justification: null,
          checked_in_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      ];
      this.setData('attendance', defaultAttendance);
    }

    // Initialize notifications if empty
    const notifications = this.getData<Notification>('notifications');
    if (notifications.length === 0) {
      const defaultNotifications: Notification[] = [
        {
          id: 'notif-1',
          title: 'Novo evento criado',
          message: 'O evento "Culto Domingo" foi criado para este domingo às 19:00',
          image_url: null,
          target_roles: ['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life'],
          target_users: [],
          created_by: 'superadmin-1',
          is_read: false,
          type: 'event',
          created_at: new Date().toISOString(),
          read_at: null,
        }
      ];
      this.setData('notifications', defaultNotifications);
    }
  }

  // Helper methods for week dates
  private getLastWeekStart(): string {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayOfWeek = lastWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(lastWeek);
    monday.setDate(lastWeek.getDate() + daysToMonday);
    return monday.toISOString().split('T')[0];
  }

  private getLastWeekEnd(): string {
    const lastWeekStart = new Date(this.getLastWeekStart());
    const sunday = new Date(lastWeekStart);
    sunday.setDate(lastWeekStart.getDate() + 6);
    return sunday.toISOString().split('T')[0];
  }

  // Generic CRUD operations
  async findAll<T>(table: string): Promise<T[]> {
    return this.getData<T>(table);
  }

  async findById<T extends { id: string }>(table: string, id: string): Promise<T | null> {
    const data = this.getData<T>(table);
    return data.find(item => item.id === id) || null;
  }

  async create<T extends { id?: string; created_at?: string; updated_at?: string }>(
    table: string, 
    item: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<T> {
    const data = this.getData<T>(table);
    const newItem = {
      ...item,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as T;
    
    data.push(newItem);
    this.setData(table, data);
    return newItem;
  }

  async update<T extends { id: string; updated_at?: string }>(
    table: string, 
    id: string, 
    updates: Partial<T>
  ): Promise<T | null> {
    const data = this.getData<T>(table);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    const updatedItem = {
      ...data[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    data[index] = updatedItem;
    this.setData(table, data);
    return updatedItem;
  }

  async delete<T extends { id: string }>(table: string, id: string): Promise<boolean> {
    const data = this.getData<T>(table);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    data.splice(index, 1);
    this.setData(table, data);
    return true;
  }

  // Custom query methods
  async findWhere<T>(table: string, predicate: (item: T) => boolean): Promise<T[]> {
    const data = this.getData<T>(table);
    return data.filter(predicate);
  }
}

export const mockDb = new MockDatabase();

// Initialize the database
mockDb.init();

// Mock query function to replace the real database query
export const query = async (text: string, params?: any[]) => {
  // This is a simplified mock - in a real implementation you'd parse SQL
  // For now, we'll just return a mock result structure
  return {
    rows: [],
    rowCount: 0
  };
};

// Test connection function
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('✅ Mock database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing mock database:', error);
    return false;
  }
};