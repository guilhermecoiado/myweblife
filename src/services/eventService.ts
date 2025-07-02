import { mockDb } from '../lib/mockDatabase';
import { Event, EventType, UserRole, User } from '../types';
import { userService } from './userService';

export const eventService = {
  // Buscar todos os eventos
  async getAll(): Promise<Event[]> {
    const events = await mockDb.findAll<Event>('events');
    return events.sort((a, b) => {
      const dateA = new Date(`${a.event_date} ${a.event_time}`);
      const dateB = new Date(`${b.event_date} ${b.event_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  },

  // Buscar evento por ID
  async getById(id: string): Promise<Event | null> {
    return await mockDb.findById<Event>('events', id);
  },

  // Criar novo evento
  async create(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    return await mockDb.create<Event>('events', eventData);
  },

  // Atualizar evento
  async update(id: string, eventData: Partial<Event>): Promise<Event> {
    const updated = await mockDb.update<Event>('events', id, eventData);
    if (!updated) {
      throw new Error('Evento não encontrado');
    }
    return updated;
  },

  // Deletar evento
  async delete(id: string): Promise<boolean> {
    return await mockDb.delete<Event>('events', id);
  },

  // Buscar eventos por role do usuário com filtro hierárquico
  async getByUserRole(role: UserRole, userId?: string): Promise<Event[]> {
    const allEvents = await mockDb.findAll<Event>('events');
    
    // Filtrar eventos que o usuário pode ver
    let visibleEvents = allEvents.filter(event => 
      event.target_roles.includes(role) || event.created_by === userId
    );

    // Para líderes de life, mostrar eventos criados por eles ou seus superiores
    if (role === 'lider_life' && userId) {
      const allUsers = await userService.getAll();
      const currentUser = allUsers.find(u => u.id === userId);
      
      if (currentUser) {
        // Buscar hierarquia superior
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
    const events = await mockDb.findWhere<Event>('events', (event) => 
      event.created_by === userId
    );
    return events.sort((a, b) => {
      const dateA = new Date(`${a.event_date} ${a.event_time}`);
      const dateB = new Date(`${b.event_date} ${b.event_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }
};

export const eventTypeService = {
  // Buscar todos os tipos de eventos
  async getAll(): Promise<EventType[]> {
    const eventTypes = await mockDb.findAll<EventType>('event_types');
    return eventTypes.sort((a, b) => a.name.localeCompare(b.name));
  },

  // Buscar tipo de evento por ID
  async getById(id: string): Promise<EventType | null> {
    return await mockDb.findById<EventType>('event_types', id);
  },

  // Criar novo tipo de evento
  async create(eventTypeData: Omit<EventType, 'id' | 'created_at' | 'updated_at'>): Promise<EventType> {
    return await mockDb.create<EventType>('event_types', eventTypeData);
  },

  // Atualizar tipo de evento
  async update(id: string, eventTypeData: Partial<EventType>): Promise<EventType> {
    const updated = await mockDb.update<EventType>('event_types', id, eventTypeData);
    if (!updated) {
      throw new Error('Tipo de evento não encontrado');
    }
    return updated;
  },

  // Deletar tipo de evento
  async delete(id: string): Promise<boolean> {
    return await mockDb.delete<EventType>('event_types', id);
  }
};