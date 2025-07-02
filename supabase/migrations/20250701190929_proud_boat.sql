/*
  # Schema limpo do MyWebLife

  1. Tabelas principais
    - `users` - Usuários do sistema com hierarquia
    - `events` - Eventos da igreja
    - `attendance` - Controle de presença
    - `member_track` - Trilho dos membros

  2. Apenas um usuário superadmin
    - Email: admin@myweblife.com
    - Sem eventos pré-criados

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso baseadas na hierarquia
*/

-- Criar enum para roles
CREATE TYPE user_role AS ENUM (
  'superadmin',
  'pastor_rede', 
  'lider_area',
  'lider_setor',
  'lider_life',
  'membro_life'
);

-- Criar enum para status de presença
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'justified');

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'membro_life',
  superior_id uuid REFERENCES users(id),
  phone text,
  profile_photo text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time NOT NULL,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  target_roles user_role[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de presença
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  event_id uuid REFERENCES events(id) NOT NULL,
  status attendance_status NOT NULL DEFAULT 'absent',
  justification text,
  checked_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Tabela de trilho dos membros
CREATE TABLE IF NOT EXISTS member_track (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) UNIQUE NOT NULL,
  dna boolean DEFAULT false,
  nova_criatura boolean DEFAULT false,
  acompanhamento_inicial boolean DEFAULT false,
  pizza_com_pastor boolean DEFAULT false,
  batizado boolean DEFAULT false,
  expresso_1 boolean DEFAULT false,
  expresso_2 boolean DEFAULT false,
  discipulado boolean DEFAULT false,
  discipulado_por uuid REFERENCES users(id),
  equipe_lideranca boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_track ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela users
CREATE POLICY "Users can read own data"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Leaders can manage subordinates"
  ON users FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users leader
      WHERE leader.id = auth.uid()
      AND (
        leader.role = 'superadmin'
        OR (leader.role = 'pastor_rede' AND users.role IN ('lider_area', 'lider_setor', 'lider_life', 'membro_life'))
        OR (leader.role = 'lider_area' AND users.role IN ('lider_setor', 'lider_life', 'membro_life'))
        OR (leader.role = 'lider_setor' AND users.role IN ('lider_life', 'membro_life'))
        OR (leader.role = 'lider_life' AND users.role = 'membro_life')
      )
    )
  );

-- Políticas para tabela events
CREATE POLICY "Users can read events for their role"
  ON events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = ANY(events.target_roles)
    )
  );

CREATE POLICY "Leaders can create events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'pastor_rede', 'lider_area', 'lider_setor', 'lider_life')
    )
  );

CREATE POLICY "Creators can manage their events"
  ON events FOR ALL TO authenticated
  USING (created_by = auth.uid());

-- Políticas para tabela attendance
CREATE POLICY "Users can read own attendance"
  ON attendance FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own attendance"
  ON attendance FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Leaders can manage subordinates attendance"
  ON attendance FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users leader, users member
      WHERE leader.id = auth.uid()
      AND member.id = attendance.user_id
      AND (
        leader.role = 'superadmin'
        OR (leader.role = 'pastor_rede' AND member.role IN ('lider_area', 'lider_setor', 'lider_life', 'membro_life'))
        OR (leader.role = 'lider_area' AND member.role IN ('lider_setor', 'lider_life', 'membro_life'))
        OR (leader.role = 'lider_setor' AND member.role IN ('lider_life', 'membro_life'))
        OR (leader.role = 'lider_life' AND member.role = 'membro_life')
      )
    )
  );

-- Políticas para tabela member_track
CREATE POLICY "Users can read own track"
  ON member_track FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Leaders can manage subordinates track"
  ON member_track FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users leader, users member
      WHERE leader.id = auth.uid()
      AND member.id = member_track.user_id
      AND (
        leader.role = 'superadmin'
        OR (leader.role = 'pastor_rede' AND member.role IN ('lider_area', 'lider_setor', 'lider_life', 'membro_life'))
        OR (leader.role = 'lider_area' AND member.role IN ('lider_setor', 'lider_life', 'membro_life'))
        OR (leader.role = 'lider_setor' AND member.role IN ('lider_life', 'membro_life'))
        OR (leader.role = 'lider_life' AND member.role = 'membro_life')
      )
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_track_updated_at
  BEFORE UPDATE ON member_track
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar trilho automaticamente para membros_life
CREATE OR REPLACE FUNCTION create_member_track_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'membro_life' THEN
    INSERT INTO member_track (user_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar trilho automaticamente
CREATE TRIGGER create_member_track_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_member_track_for_new_user();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_superior_id ON users(superior_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_target_roles ON events USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);
CREATE INDEX IF NOT EXISTS idx_member_track_user_id ON member_track(user_id);
CREATE INDEX IF NOT EXISTS idx_member_track_discipulado_por ON member_track(discipulado_por);

-- Criar apenas o usuário superadmin
DO $$
DECLARE
  superadmin_uuid uuid;
BEGIN
  -- Gerar UUID válido para o superadmin
  superadmin_uuid := gen_random_uuid();
  
  INSERT INTO users (
    id,
    email,
    name,
    role,
    superior_id,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    superadmin_uuid,
    'admin@myweblife.com',
    'Administrador do Sistema',
    'superadmin',
    NULL,
    true,
    now(),
    now()
  );
END $$;