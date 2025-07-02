/*
  # Criar tabela de trilho dos membros

  1. Nova Tabela
    - `member_track`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key, unique)
      - `dna` (boolean, default false)
      - `nova_criatura` (boolean, default false)
      - `acompanhamento_inicial` (boolean, default false)
      - `pizza_com_pastor` (boolean, default false)
      - `batizado` (boolean, default false)
      - `expresso_1` (boolean, default false)
      - `expresso_2` (boolean, default false)
      - `discipulado` (boolean, default false)
      - `discipulado_por` (uuid, foreign key, optional)
      - `equipe_lideranca` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `member_track`
    - Política para usuários lerem seu próprio trilho
    - Política para líderes gerenciarem trilho de subordinados
*/

-- Criar tabela member_track
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

-- Habilitar RLS
ALTER TABLE member_track ENABLE ROW LEVEL SECURITY;

-- Política para usuários lerem seu próprio trilho
CREATE POLICY "Users can read own track"
  ON member_track
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para líderes gerenciarem trilho de subordinados
CREATE POLICY "Leaders can manage subordinates track"
  ON member_track
  FOR ALL
  TO authenticated
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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_member_track_user_id ON member_track(user_id);
CREATE INDEX IF NOT EXISTS idx_member_track_discipulado_por ON member_track(discipulado_por);