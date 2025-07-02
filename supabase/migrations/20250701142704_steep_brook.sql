/*
  # Criar funções e triggers auxiliares

  1. Funções
    - Função para atualizar updated_at automaticamente
    - Função para criar trilho automaticamente quando usuário é criado

  2. Triggers
    - Trigger para atualizar updated_at nas tabelas users, events e member_track
    - Trigger para criar member_track quando novo usuário é inserido
*/

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para member_track
CREATE TRIGGER update_member_track_updated_at
  BEFORE UPDATE ON member_track
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar trilho automaticamente
CREATE OR REPLACE FUNCTION create_member_track_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar trilho apenas para membros_life
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