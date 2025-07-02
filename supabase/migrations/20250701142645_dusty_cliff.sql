/*
  # Criar tabela de presença

  1. Nova Tabela
    - `attendance`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `event_id` (uuid, foreign key)
      - `status` (enum: present, absent, justified)
      - `justification` (text, optional)
      - `checked_in_at` (timestamp, optional)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `attendance`
    - Política para usuários lerem sua própria presença
    - Política para líderes gerenciarem presença de subordinados
*/

-- Criar enum para status de presença
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'justified');

-- Criar tabela attendance
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

-- Habilitar RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Política para usuários lerem sua própria presença
CREATE POLICY "Users can read own attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para usuários atualizarem sua própria presença
CREATE POLICY "Users can update own attendance"
  ON attendance
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Política para líderes gerenciarem presença de subordinados
CREATE POLICY "Leaders can manage subordinates attendance"
  ON attendance
  FOR ALL
  TO authenticated
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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);