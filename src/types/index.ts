export type UserRole = 'superadmin' | 'pastor_rede' | 'lider_area' | 'lider_setor' | 'lider_life' | 'membro_life';

export interface User {
  id: string;
  email: string;
  name: string;
  last_name: string;
  role: UserRole;
  superior_id: string | null;
  phone: string | null;
  profile_photo: string | null;
  is_active: boolean;
  group_id: string | null;
  birth_date: string | null;
  member_status: 'ativo' | 'consolidacao';
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  type: 'rede' | 'area' | 'setor' | 'lifegroup';
  leader_id: string;
  description: string | null;
  image_url: string | null;
  meeting_day: number | null; // 0 = domingo, 1 = segunda, etc.
  meeting_time: string | null;
  address: string | null;
  cep: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  target_roles: UserRole[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventType {
  id: string;
  name: string;
  description: string | null;
  default_time: string | null;
  default_day: number | null; // 0 = domingo, 1 = segunda, etc.
  is_recurring: boolean;
  recurrence_pattern: string | null;
  target_roles: UserRole[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  event_id: string;
  status: 'present' | 'absent' | 'justified';
  justification: string | null;
  checked_in_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  target_roles: UserRole[];
  target_users: string[];
  created_by: string;
  is_read: boolean;
  type: 'event' | 'message' | 'system' | 'birthday' | 'report_pending';
  created_at: string;
  read_at: string | null;
}

export type TrackStatus = boolean | 'progress';

export interface MemberTrack {
  id: string;
  user_id: string;
  discipulado: TrackStatus;
  discipulado_por: string | null;
  equipe_lideranca: TrackStatus;
  is_discipulador: TrackStatus;
  batizado: TrackStatus;
  pizza_com_pastor: TrackStatus;
  estacao_dna: TrackStatus;
  nova_criatura: TrackStatus;
  acompanhamento_inicial: TrackStatus;
  expresso_1: TrackStatus;
  expresso_2: TrackStatus;
  voluntario: TrackStatus;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReport {
  id: string;
  leader_id: string;
  week_start_date: string; // Data de início da semana (segunda-feira)
  week_end_date: string; // Data de fim da semana (domingo)
  fixed_members_present: number;
  guests_present: number;
  children_present: number;
  observations: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContext {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'superadmin': 0,
  'pastor_rede': 1,
  'lider_area': 2,
  'lider_setor': 3,
  'lider_life': 4,
  'membro_life': 5,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  'superadmin': 'Super Admin',
  'pastor_rede': 'Pastor de Rede',
  'lider_area': 'Líder de Área',
  'lider_setor': 'Líder de Setor',
  'lider_life': 'Líder de Life',
  'membro_life': 'Membro de Life',
};

export const GROUP_TYPE_LABELS: Record<string, string> = {
  'rede': 'Rede',
  'area': 'Área',
  'setor': 'Setor',
  'lifegroup': 'Lifegroup',
};

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  'ativo': 'Ativo',
  'consolidacao': 'Consolidação',
};

export const TRACK_STATUS_LABELS: Record<string, string> = {
  'true': 'Concluído',
  'progress': 'Em Andamento',
  'false': 'Não Iniciado',
};

export const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

// Roles disponíveis para seleção em eventos (sem superadmin)
export const EVENT_TARGET_ROLES: UserRole[] = ['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life'];

// Roles que podem criar tipos de eventos (líderes de setor para cima)
export const EVENT_TYPE_CREATOR_ROLES: UserRole[] = ['superadmin', 'pastor_rede', 'lider_area', 'lider_setor'];

// Roles que podem atribuir eventos para si mesmos e funções abaixo
export const getAvailableEventTargetRoles = (userRole: UserRole): UserRole[] => {
  const userLevel = ROLE_HIERARCHY[userRole];
  
  return EVENT_TARGET_ROLES.filter(role => {
    const roleLevel = ROLE_HIERARCHY[role];
    return roleLevel >= userLevel; // Pode atribuir para si mesmo e funções abaixo
  });
};

export const DEFAULT_EVENTS = [
  { title: 'Culto Sábado', time: '17:00', day: 6 },
  { title: 'Culto Domingo', time: '09:30', day: 0 },
  { title: 'Culto Domingo', time: '11:30', day: 0 },
  { title: 'Culto Domingo', time: '16:30', day: 0 },
  { title: 'Culto Domingo', time: '18:30', day: 0 },
  { title: 'Culto Domingo', time: '20:30', day: 0 },
  { title: 'Culto Segunda', time: '20:30', day: 1 },
  { title: 'Tadel Fim de Semana', time: '19:00', day: 5 },
  { title: 'Lifegroup', time: '20:00', day: 3 },
];