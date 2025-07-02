/*
  # Criar tabela de usuários

  1. Nova Tabela
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (enum)
      - `superior_id` (uuid, foreign key)
      - `phone` (text, optional)
      - `profile_photo` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `users`
    - Política para usuários autenticados lerem seus próprios dados
    - Política para líderes gerenciarem seus subordinados
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

-- Criar tabela users
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

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para usuários lerem seus próprios dados
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para usuários atualizarem seus próprios dados
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Política para líderes gerenciarem subordinados
CREATE POLICY "Leaders can manage subordinates"
  ON users
  FOR ALL
  TO authenticated
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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_superior_id ON users(superior_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);