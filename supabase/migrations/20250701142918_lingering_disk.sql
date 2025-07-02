/*
  # Inserir dados padrão do sistema

  1. Dados Padrão
    - Usuário super admin com UUID válido
    - Eventos recorrentes da igreja
  
  2. Validações
    - Verifica se dados já existem antes de inserir
    - Usa UUIDs válidos gerados automaticamente
*/

-- Inserir usuário super admin (apenas se não existir)
DO $$
DECLARE
  superadmin_uuid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'masterapp@myweblife.com') THEN
    -- Gerar UUID válido para o superadmin
    superadmin_uuid := gen_random_uuid();
    
    INSERT INTO users (
      id,
      email,
      name,
      role,
      is_active
    ) VALUES (
      superadmin_uuid,
      'masterapp@myweblife.com',
      'Super Admin',
      'superadmin',
      true
    );
  END IF;
END $$;

-- Inserir eventos padrão (apenas se não existirem)
DO $$
DECLARE
  superadmin_id uuid;
BEGIN
  -- Buscar ID do superadmin
  SELECT id INTO superadmin_id FROM users WHERE role = 'superadmin' LIMIT 1;
  
  IF superadmin_id IS NOT NULL THEN
    -- Culto Sábado
    IF NOT EXISTS (SELECT 1 FROM events WHERE title = 'Culto Sábado' AND event_time = '17:00:00') THEN
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
        CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 6,
        '17:00:00',
        true,
        'weekly',
        ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
        superadmin_id
      );
    END IF;

    -- Culto Domingo 09:30
    IF NOT EXISTS (SELECT 1 FROM events WHERE title = 'Culto Domingo' AND event_time = '09:30:00') THEN
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
        CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER,
        '09:30:00',
        true,
        'weekly',
        ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
        superadmin_id
      );
    END IF;

    -- Culto Domingo 11:30
    IF NOT EXISTS (SELECT 1 FROM events WHERE title = 'Culto Domingo' AND event_time = '11:30:00') THEN
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
        CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER,
        '11:30:00',
        true,
        'weekly',
        ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
        superadmin_id
      );
    END IF;

    -- Culto Domingo 16:30
    IF NOT EXISTS (SELECT 1 FROM events WHERE title = 'Culto Domingo' AND event_time = '16:30:00') THEN
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
        CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER,
        '16:30:00',
        true,
        'weekly',
        ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
        superadmin_id
      );
    END IF;

    -- Culto Domingo 18:30
    IF NOT EXISTS (SELECT 1 FROM events WHERE title = 'Culto Domingo' AND event_time = '18:30:00') THEN
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
        CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER,
        '18:30:00',
        true,
        'weekly',
        ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
        superadmin_id
      );
    END IF;

    -- Culto Domingo 20:30
    IF NOT EXISTS (SELECT 1 FROM events WHERE title = 'Culto Domingo' AND event_time = '20:30:00') THEN
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
        CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER,
        '20:30:00',
        true,
        'weekly',
        ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
        superadmin_id
      );
    END IF;

    -- Culto Segunda 20:30
    IF NOT EXISTS (SELECT 1 FROM events WHERE title = 'Culto Segunda' AND event_time = '20:30:00') THEN
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
        CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1,
        '20:30:00',
        true,
        'weekly',
        ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
        superadmin_id
      );
    END IF;

    -- Lifegroup
    IF NOT EXISTS (SELECT 1 FROM events WHERE title = 'Lifegroup') THEN
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
        CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 3,
        '20:00:00',
        true,
        'weekly',
        ARRAY['lider_life', 'membro_life']::user_role[],
        superadmin_id
      );
    END IF;

    -- Tadel Fim de Semana
    IF NOT EXISTS (SELECT 1 FROM events WHERE title = 'Tadel Fim de Semana') THEN
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
        (CURRENT_DATE + INTERVAL '1 week') - (EXTRACT(DOW FROM CURRENT_DATE)::int * INTERVAL '1 day') + INTERVAL '6 days'
        '19:00:00',
        true,
        'weekly',
        ARRAY['pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life']::user_role[],
        superadmin_id
      );
    END IF;
  END IF;
END $$;