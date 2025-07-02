import { supabase } from '../lib/supabase';
import { Event, EventType, UserRole, User } from '../types';
import { userService } from './userService';

export const eventService = {
  // Buscar todos os eventos
  async getAll(): Promise<Event[]> {
    const { data, error } = await supabase
      .from<Event>('events')
      .select('*');

    if (error) throw error;
    return data.sort((a, b) => {
      const dateA = new Date(`${a.event_date} ${a.event_time}`);
      const dateB = new Date(`${b.event_date} ${b.event_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  },

  // Buscar evento por ID
  async getById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from<Event>('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  // Criar novo evento
  async create(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    const { data, error } = await supabase
      .from<Event>('events')
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar evento
  async update(id: string, eventData: Partial<Event>): Promise<Event> {
    const { data, error } = await supabase
      .from<Event>('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error('Evento não encontrado');
    return data;
  },

  // Deletar evento
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from<Event>('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Buscar eventos por role do usuário com filtro hierárquico
  async getByUserRole(role: UserRole, userId?: string): Promise<Event[]> {
    const { data: allEvents, error } = await supabase
      .from<Event>('events')
      .select('*');

    if (error || !allEvents) return [];

    let visibleEvents = allEvents.filter(event =>
      event.target_roles.includes(role) || event.created_by === userId
    );

    if (role === 'lider_life' && userId) {
      const allUsers = await userService.getAll();
      const currentUser = allUsers.find(u => u.id === userId);

      if (currentUser) {
        const superiorIds = await this.getSuperiorIds(currentUser, allUsers);

        visibleEvents = allEvents.filter(event =>
          event.target_roles.includes(role) ||
          event.created_by === userId ||
          superiorIds.includes(event.created_by)
        );
      }
    }

    return visibleEvents.sort((a, b) => {
      const dateA = new Date(`${a.event_date} ${a.event_time}`);
      const dateB = new Date(`${b.event_date} ${b.event_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  },

  // Buscar IDs dos superiores na hierarquia
  async getSuperiorIds(user: User, allUsers: User[]): Promise<string[]> {
    const superiorIds: string[] = [];
    let currentUser = user;

    while (currentUser.superior_id) {
      superiorIds.push(currentUser.superior_id);
      const superior = allUsers.find(u => u.id === currentUser.superior_id);
      if (!superior) break;
      currentUser = superior;
    }

    return superiorIds;
  },

  // Buscar eventos criados por um usuário
  async getByCreator(userId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from<Event>('events')
      .select('*')
      .eq('created_by', userId);

    if (error || !data) return [];
    return data.sort((a, b) => {
      const dateA = new Date(`${a.event_date} ${a.event_time}`);
      const dateB = new Date(`${b.event_date} ${b.event_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }
};

export const eventTypeService = {
  // Buscar todos os tipos de eventos
  async getAll(): Promise<EventType[]> {
    const { data, error } = await supabase
      .from<EventType>('event_types')
      .select('*');

    if (error) throw error;
    return data.sort((a, b) => a.name.localeCompare(b.name));
  },

  // Buscar tipo de evento por ID
  async getById(id: string): Promise<EventType | null> {
    const { data, error } = await supabase
      .from<EventType>('event_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  // Criar novo tipo de evento
  async create(eventTypeData: Omit<EventType, 'id' | 'created_at' | 'updated_at'>): Promise<EventType> {
    const { data, error } = await supabase
      .from<EventType>('event_types')
      .insert(eventTypeData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar tipo de evento
  async update(id: string, eventTypeData: Partial<EventType>): Promise<EventType> {
    const { data, error } = await supabase
      .from<EventType>('event_types')
      .update(eventTypeData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error('Tipo de evento não encontrado');
    return data;
  },

  // Deletar tipo de evento
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from<EventType>('event_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
