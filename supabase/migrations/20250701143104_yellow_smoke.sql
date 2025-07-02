/*
  # Criar usuário Super Admin

  1. Novo usuário
    - Cria usuário superadmin com UUID válido
    - Email: admin@myweblife.com
    - Senha será configurada via Supabase Auth
    - Role: superadmin

  2. Eventos padrão
    - Cria todos os eventos recorrentes da igreja
    - Vincula ao usuário superadmin criado

  3. Segurança
    - Usuário ativo por padrão
    - Sem superior (é o topo da hierarquia)
*/

-- Primeiro, vamos limpar qualquer usuário superadmin existente que possa ter problemas
DELETE FROM users WHERE email = 'masterapp@myweblife.com' OR role = 'superadmin';

-- Criar usuário super admin com UUID válido
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
    phone,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    superadmin_uuid,
    'admin@myweblife.com',
    'Administrador do Sistema',
    'superadmin',
    NULL,
    NULL,
    true,
    now(),
    now()
  );
  
  -- Inserir eventos padrão usando o UUID do superadmin
  -- Culto Sábado 17:00
  INSERT INTO events (
    title,
    description,
    event_date,
    event_time,
    is_recurring,
    recurrence_pattern,
    target_roles,
    created_by
  ) VALUES (
    'Culto Sábado',
    'Culto de sábado à noite',
    CURRENT_DATE + (6 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
    '17:00:00',
    true,
    'weekly',
    ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
    superadmin_uuid
  );

  -- Culto Domingo 09:30
  INSERT INTO events (
    title,
    description,
    event_date,
    event_time,
    is_recurring,
    recurrence_pattern,
    target_roles,
    created_by
  ) VALUES (
    'Culto Domingo',
    'Culto de domingo manhã',
    CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
    '09:30:00',
    true,
    'weekly',
    ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
    superadmin_uuid
  );

  -- Culto Domingo 11:30
  INSERT INTO events (
    title,
    description,
    event_date,
    event_time,
    is_recurring,
    recurrence_pattern,
    target_roles,
    created_by
  ) VALUES (
    'Culto Domingo',
    'Culto de domingo manhã',
    CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
    '11:30:00',
    true,
    'weekly',
    ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
    superadmin_uuid
  );

  -- Culto Domingo 16:30
  INSERT INTO events (
    title,
    description,
    event_date,
    event_time,
    is_recurring,
    recurrence_pattern,
    target_roles,
    created_by
  ) VALUES (
    'Culto Domingo',
    'Culto de domingo tarde',
    CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
    '16:30:00',
    true,
    'weekly',
    ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
    superadmin_uuid
  );

  -- Culto Domingo 18:30
  INSERT INTO events (
    title,
    description,
    event_date,
    event_time,
    is_recurring,
    recurrence_pattern,
    target_roles,
    created_by
  ) VALUES (
    'Culto Domingo',
    'Culto de domingo noite',
    CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
    '18:30:00',
    true,
    'weekly',
    ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
    superadmin_uuid
  );

  -- Culto Domingo 20:30
  INSERT INTO events (
    title,
    description,
    event_date,
    event_time,
    is_recurring,
    recurrence_pattern,
    target_roles,
    created_by
  ) VALUES (
    'Culto Domingo',
    'Culto de domingo noite',
    CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
    '20:30:00',
    true,
    'weekly',
    ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
    superadmin_uuid
  );

  -- Culto Segunda 20:30
  INSERT INTO events (
    title,
    description,
    event_date,
    event_time,
    is_recurring,
    recurrence_pattern,
    target_roles,
    created_by
  ) VALUES (
    'Culto Segunda',
    'Culto de segunda-feira',
    CURRENT_DATE + (1 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7,
    '20:30:00',
    true,
    'weekly',
    ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
    superadmin_uuid
  );

  -- Lifegroup (Quarta-feira)
  INSERT INTO events (
    title,
    description,
    event_date,
    event_time,
    is_recurring,
    recurrence_pattern,
    target_roles,
    created_by
  ) VALUES (
    'Lifegroup',
    'Reunião de célula',
    CURRENT_DATE + (3 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7,
    '20:00:00',
    true,
    'weekly',
    ARRAY['lider_life', 'membro_life']::user_role[],
    superadmin_uuid
  );

  -- Tadel Fim de Semana (Sexta-feira)
  INSERT INTO events (
    title,
    description,
    event_date,
    event_time,
    is_recurring,
    recurrence_pattern,
    target_roles,
    created_by
  ) VALUES (
    'Tadel Fim de Semana',
    'Reunião de jovens',
    CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7,
    '19:00:00',
    true,
    'weekly',
    ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
    superadmin_uuid
  );

END $$;