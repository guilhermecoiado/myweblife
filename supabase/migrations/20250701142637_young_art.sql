/*
  # Criar tabela de eventos

  1. Nova Tabela
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, optional)
      - `event_date` (date)
      - `event_time` (time)
      - `is_recurring` (boolean, default false)
      - `recurrence_pattern` (text, optional)
      - `target_roles` (array of user_role)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `events`
    - Política para usuários lerem eventos direcionados ao seu role
    - Política para líderes criarem e gerenciarem eventos
*/

-- Criar tabela events
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

-- Habilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Política para usuários lerem eventos direcionados ao seu role
CREATE POLICY "Users can read events for their role"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = ANY(events.target_roles)
    )
  );

-- Política para líderes criarem eventos
CREATE POLICY "Leaders can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'pastor_rede', 'lider_area', 'lider_setor', 'lider_life')
    )
  );

-- Política para criadores gerenciarem seus eventos
CREATE POLICY "Creators can manage their events"
  ON events
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_target_roles ON events USING GIN(target_roles);