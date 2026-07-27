-- ============================================================
-- GymMasterRS - Estrutura Multi-Ginásio com Perfis e Permissões
-- ATUALIZADO com dados do mockData.ts
-- PostgreSQL 15+
-- ============================================================

-- ============================================================
-- 1. TABELA: gyms (Unidades de Ginásio)
-- ============================================================
CREATE TABLE IF NOT EXISTS gyms (
                                    id              SERIAL PRIMARY KEY,
                                    nome            VARCHAR(150) NOT NULL,
                                    slug            VARCHAR(150) UNIQUE NOT NULL,
                                    endereco        VARCHAR(255),
                                    cidade          VARCHAR(100),
                                    ilha            VARCHAR(50),           -- Específico para Cabo Verde
                                    telefone        VARCHAR(20),
                                    email           VARCHAR(100),
                                    horario_abertura TIME,
                                    horario_fechamento TIME,
                                    capacidade_max   INTEGER DEFAULT 100,
                                    status          VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao')),
                                    logo_url        VARCHAR(500),
                                    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE gyms IS 'Unidades físicas do ginásio';
COMMENT ON COLUMN gyms.ilha IS 'Ilha de Cabo Verde (Santiago, São Vicente, etc.)';

-- ============================================================
-- 2. TABELA: gym_areas (Áreas/Espaços do Ginásio) - NOVA
-- ============================================================
CREATE TABLE IF NOT EXISTS gym_areas (
                                         id              VARCHAR(10) PRIMARY KEY,
                                         gym_id          INTEGER REFERENCES gyms(id) ON DELETE CASCADE,
                                         nome            VARCHAR(100) NOT NULL,
                                         icon            VARCHAR(50) DEFAULT 'Dumbbell',
                                         capacidade      INTEGER DEFAULT 20,
                                         ocupacao_atual  INTEGER DEFAULT 0,
                                         descricao       TEXT,
                                         status          VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao')),
                                         created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                         updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE gym_areas IS 'Áreas/espaços dentro de cada unidade (Musculação, Cardio, Yoga, etc.)';

-- ============================================================
-- 3. TABELA: perfis (Perfis de Acesso / Roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS perfis (
                                      id              SERIAL PRIMARY KEY,
                                      nome            VARCHAR(50) UNIQUE NOT NULL,
                                      descricao       TEXT,
                                      nivel_acesso    INTEGER NOT NULL DEFAULT 1 CHECK (nivel_acesso BETWEEN 1 AND 5),
    -- 1=Membro, 2=Trainer/Recepcionista/Nutricionista, 3=Gerente, 4=Gestor Regional, 5=Super Admin
                                      permissoes      JSONB DEFAULT '{}',
                                      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE perfis IS 'Perfis de acesso do sistema (RBAC)';
COMMENT ON COLUMN perfis.permissoes IS 'JSON com permissões granulares por módulo';

-- Inserir perfis padrão
INSERT INTO perfis (nome, descricao, nivel_acesso, permissoes) VALUES
                                                                   ('super_admin', 'Acesso total a todas as unidades e configurações', 5,
                                                                    '{"dashboard":"all","membros":"crud_global","planos":"crud_global","pagamentos":"all","checkin":"all","relatorios":"all","funcionarios":"crud_global","configuracoes":"all","multi_ginasio":"crud","areas":"crud","aulas":"crud","agenda":"crud"}'),

                                                                   ('gestor_regional', 'Gestão de várias unidades designadas', 4,
                                                                    '{"dashboard":"multi_unidade","membros":"crud_unidade","planos":"visualizar","pagamentos":"unidades","checkin":"unidades","relatorios":"unidades","funcionarios":"crud_unidade","configuracoes":"limitado","multi_ginasio":"visualizar","areas":"visualizar","aulas":"crud_unidade","agenda":"visualizar"}'),

                                                                   ('gerente_unidade', 'Gestão de uma unidade específica', 3,
                                                                    '{"dashboard":"unidade","membros":"crud_unidade","planos":"visualizar","pagamentos":"unidade","checkin":"unidade","relatorios":"unidade","funcionarios":"crud_unidade","configuracoes":"limitado","areas":"visualizar","aulas":"crud_unidade","agenda":"visualizar"}'),

                                                                   ('recepcionista', 'Operações diárias da unidade', 2,
                                                                    '{"dashboard":"unidade","membros":"visualizar_checkin","planos":"visualizar","pagamentos":"registrar_visualizar","checkin":"registrar","relatorios":"none","areas":"visualizar","aulas":"visualizar","agenda":"visualizar"}'),

                                                                   ('personal_trainer', 'Aulas, planos de treino e membros atribuídos', 2,
                                                                    '{"dashboard":"resumo","membros":"seus_alunos","planos":"visualizar","pagamentos":"none","checkin":"none","relatorios":"seus_alunos","areas":"visualizar","aulas":"crud_proprias","agenda":"crud_proprias"}'),

                                                                   ('nutricionista', 'Planos alimentares e acompanhamento', 2,
                                                                    '{"dashboard":"resumo","membros":"seus_alunos","planos":"visualizar","pagamentos":"none","checkin":"none","relatorios":"seus_alunos_nutricao","areas":"none","aulas":"none","agenda":"visualizar"}'),

                                                                   ('membro', 'Acesso ao próprio perfil e check-in', 1,
                                                                    '{"dashboard":"proprio","membros":"proprio","planos":"visualizar","pagamentos":"proprios","checkin":"proprio","relatorios":"none","areas":"visualizar","aulas":"inscrever","agenda":"visualizar"}')
ON CONFLICT (nome) DO NOTHING;

-- ============================================================
-- 4. TABELA: usuarios (Usuários do Sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
                                        id              VARCHAR(20) PRIMARY KEY,
                                        nome            VARCHAR(150) NOT NULL,
                                        email           VARCHAR(150) UNIQUE NOT NULL,
                                        telefone        VARCHAR(20),
                                        senha_hash      VARCHAR(255) NOT NULL,

    -- Perfil e unidade principal
                                        perfil_id       INTEGER NOT NULL REFERENCES perfis(id) ON DELETE RESTRICT,
                                        gym_id          INTEGER REFERENCES gyms(id) ON DELETE SET NULL,

    -- Dados pessoais
                                        foto_url        VARCHAR(500),
                                        data_nascimento DATE,
                                        genero          VARCHAR(20) CHECK (genero IN ('masculino', 'feminino', 'outro')),
                                        bi              VARCHAR(20),

    -- Status e controle
                                        status          VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso', 'pendente')),
                                        ultimo_acesso   TIMESTAMP,
                                        email_verificado BOOLEAN DEFAULT FALSE,

    -- Campos para membros
                                        numero_cartao   VARCHAR(50) UNIQUE,
                                        qr_code         VARCHAR(255) UNIQUE,
                                        pin_checkin     VARCHAR(10),

                                        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuarios IS 'Todos os usuários do sistema (staff e membros)';
COMMENT ON COLUMN usuarios.bi IS 'Bilhete de Identidade de Cabo Verde';
COMMENT ON COLUMN usuarios.qr_code IS 'Código QR único para check-in rápido';

-- ============================================================
-- 5. TABELA: usuario_gyms (Associação Usuário ↔ Ginásios)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuario_gyms (
                                            id              SERIAL PRIMARY KEY,
                                            usuario_id      VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                            gym_id          INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
                                            perfil_local_id INTEGER REFERENCES perfis(id) ON DELETE SET NULL,
                                            is_principal    BOOLEAN DEFAULT FALSE,
                                            data_inicio     DATE DEFAULT CURRENT_DATE,
                                            data_fim        DATE,
                                            motivo          VARCHAR(50) CHECK (motivo IN ('contrato', 'transferencia', 'temporario', 'plano_multi')),
                                            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            UNIQUE(usuario_id, gym_id)
);

COMMENT ON TABLE usuario_gyms IS 'Associação N:N entre usuários e ginásios com perfis locais';

-- ============================================================
-- 6. TABELA: planos (Planos de Assinatura)
-- ============================================================
CREATE TABLE IF NOT EXISTS planos (
                                      id              VARCHAR(10) PRIMARY KEY,
                                      nome            VARCHAR(100) NOT NULL,
                                      descricao       TEXT,
                                      tipo_acesso     VARCHAR(20) DEFAULT 'unico' CHECK (tipo_acesso IN ('unico', 'multi', 'regional')),
                                      preco_mensal    DECIMAL(10,2) NOT NULL,
                                      preco_anual     DECIMAL(10,2),
                                      moeda           VARCHAR(3) DEFAULT 'CVE',
                                      duracao_dias    INTEGER DEFAULT 30,
                                      limite_checkins_dia INTEGER DEFAULT 1,
                                      gyms_permitidos INTEGER[] DEFAULT NULL,
    -- NOVO: áreas permitidas (referência a gym_areas.id)
                                      areas_permitidas VARCHAR(10)[] DEFAULT NULL,
                                      billing_cycle   VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
                                      cor             VARCHAR(7) DEFAULT '#3B82F6',
                                      inclui_aulas    BOOLEAN DEFAULT FALSE,
                                      inclui_nutricao BOOLEAN DEFAULT FALSE,
                                      inclui_pt       BOOLEAN DEFAULT FALSE,
                                      status          VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'promocional')),
                                      criado_por      VARCHAR(20) REFERENCES usuarios(id) ON DELETE SET NULL,
                                      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE planos IS 'Planos de assinatura disponíveis';
COMMENT ON COLUMN planos.areas_permitidas IS 'Array de gym_areas.id permitidos para este plano';
COMMENT ON COLUMN planos.billing_cycle IS 'Ciclo de faturamento: monthly, quarterly, yearly';

-- ============================================================
-- 7. TABELA: assinaturas (Assinaturas dos Membros)
-- ============================================================
CREATE TABLE IF NOT EXISTS assinaturas (
                                           id              SERIAL PRIMARY KEY,
                                           membro_id       VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                           plano_id        VARCHAR(10) NOT NULL REFERENCES planos(id) ON DELETE RESTRICT,
                                           gym_id          INTEGER NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
                                           data_inicio     DATE NOT NULL,
                                           data_fim        DATE,
                                           data_renovacao  DATE,
                                           valor_pago      DECIMAL(10,2),
                                           metodo_pagamento VARCHAR(50) CHECK (metodo_pagamento IN ('dinheiro', 'transferencia', 'cartao_credito', 'cartao_debito', 'mbway', 'paypal')),
                                           status          VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'pendente', 'cancelada', 'expirada', 'suspensa')),
                                           auto_renovar    BOOLEAN DEFAULT TRUE,
                                           criado_por      VARCHAR(20) REFERENCES usuarios(id) ON DELETE SET NULL,
                                           created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                           updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE assinaturas IS 'Assinaturas ativas e histórico de membros';

-- ============================================================
-- 8. TABELA: pagamentos (Registro de Pagamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS pagamentos (
                                          id              VARCHAR(20) PRIMARY KEY,
                                          membro_id       VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                          assinatura_id   INTEGER REFERENCES assinaturas(id) ON DELETE SET NULL,
                                          gym_id          INTEGER NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
                                          descricao       VARCHAR(255) NOT NULL,
                                          valor           DECIMAL(10,2) NOT NULL,
                                          moeda           VARCHAR(3) DEFAULT 'CVE',
                                          data_vencimento DATE NOT NULL,
                                          data_pagamento  DATE,
                                          status          VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado', 'reembolsado')),
                                          metodo_pagamento VARCHAR(50),
                                          referencia      VARCHAR(100),
                                          comprovante_url VARCHAR(500),
                                          observacoes     TEXT,
                                          registrado_por  VARCHAR(20) REFERENCES usuarios(id) ON DELETE SET NULL,
                                          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pagamentos IS 'Faturas e registros de pagamento';

-- ============================================================
-- 9. TABECOMMENT ON COLUMN planos.areas_permitidas IS 'Array de gym_areas.id permitidos para este plano';LA: checkins (Registro de Entradas)
-- ============================================================
CREATE TABLE IF NOT EXISTS checkins (
                                        id              VARCHAR(20) PRIMARY KEY,
                                        membro_id       VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                        gym_id          INTEGER NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
                                        area_id         VARCHAR(10) REFERENCES gym_areas(id) ON DELETE SET NULL,
                                        data_hora       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                        metodo          VARCHAR(20) NOT NULL CHECK (metodo IN ('qr_code', 'pin', 'biometria', 'cartao', 'manual')),
                                        valido          BOOLEAN DEFAULT TRUE,
                                        motivo_invalido VARCHAR(255),
                                        terminal_id     VARCHAR(50),
                                        ip_address      INET,
                                        registrado_por  VARCHAR(20) REFERENCES usuarios(id) ON DELETE SET NULL,
                                        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE checkins IS 'Registro de entradas dos membros nas unidades';

-- ============================================================
-- 10. TABELA: transferencias (Transferência entre Unidades)
-- ============================================================
CREATE TABLE IF NOT EXISTS transferencias (
                                              id              SERIAL PRIMARY KEY,
                                              membro_id       VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                              gym_origem_id   INTEGER NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
                                              gym_destino_id  INTEGER NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
                                              motivo          TEXT,
                                              status          VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'concluida')),
                                              data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              data_transferencia TIMESTAMP,
                                              solicitado_por  VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
                                              aprovado_por    VARCHAR(20) REFERENCES usuarios(id) ON DELETE SET NULL,
                                              assinatura_id   INTEGER REFERENCES assinaturas(id) ON DELETE SET NULL,
                                              created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE transferencias IS 'Solicitações de transferência de membros entre unidades';

-- ============================================================
-- 11. TABELA: schedule_sessions (Aulas Agendadas) - ATUALIZADA
-- ============================================================
CREATE TABLE IF NOT EXISTS schedule_sessions (
                                                 id              VARCHAR(20) PRIMARY KEY,
                                                 gym_id          INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
                                                 titulo          VARCHAR(100) NOT NULL,
                                                 descricao       TEXT,
                                                 instrutor_id    VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
                                                 area_id         VARCHAR(10) REFERENCES gym_areas(id) ON DELETE SET NULL,
                                                 dia_semana      INTEGER CHECK (dia_semana BETWEEN 0 AND 6),
                                                 hora_inicio     TIME NOT NULL,
                                                 hora_fim        TIME NOT NULL,
                                                 capacidade_max  INTEGER DEFAULT 20,
                                                 inscritos       INTEGER DEFAULT 0,
                                                 tipo            VARCHAR(50) CHECK (tipo IN ('musculacao', 'cardio', 'yoga', 'pilates', 'crossfit', 'danca', 'spinning', 'funcional', 'luta', 'boxe', 'muay_thai', 'jiu_jitsu', 'outro')),
                                                 status          VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'suspensa')),
                                                 created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                 updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE schedule_sessions IS 'Aulas em grupo agendadas por unidade';

-- ============================================================
-- 12. TABELA: session_participants (Participantes das Aulas) - NOVA
-- ============================================================
CREATE TABLE IF NOT EXISTS session_participants (
                                                    id              SERIAL PRIMARY KEY,
                                                    session_id      VARCHAR(20) NOT NULL REFERENCES schedule_sessions(id) ON DELETE CASCADE,
                                                    membro_id       VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                                    data_inscricao  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                    presente        BOOLEAN DEFAULT NULL,
                                                    avaliacao       INTEGER CHECK (avaliacao BETWEEN 1 AND 5),
                                                    comentario      TEXT,
                                                    UNIQUE(session_id, membro_id)
);

COMMENT ON TABLE session_participants IS 'Inscrições e presenças em aulas agendadas';

-- ============================================================
-- 13. TABELA: planos_treino (Planos de Treino Personalizados)
-- ============================================================
CREATE TABLE IF NOT EXISTS planos_treino (
                                             id              SERIAL PRIMARY KEY,
                                             membro_id       VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                             instrutor_id    VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
                                             gym_id          INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
                                             nome            VARCHAR(100) NOT NULL,
                                             descricao       TEXT,
                                             objetivo        VARCHAR(50) CHECK (objetivo IN ('emagrecimento', 'hipertrofia', 'condicionamento', 'reabilitacao', 'manutencao')),
                                             duracao_semanas INTEGER DEFAULT 4,
                                             exercicios      JSONB DEFAULT '[]',
                                             ativo           BOOLEAN DEFAULT TRUE,
                                             created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                             updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE planos_treino IS 'Planos de treino personalizados criados por PTs';



-- ============================================================
-- FIX: Adicionar colunas faltantes na tabela planos existente
-- Execute isto PRIMEIRO, depois o script completo
-- ============================================================

-- Adicionar coluna areas_permitidas (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'areas_permitidas'
        ) THEN
            ALTER TABLE planos ADD COLUMN areas_permitidas VARCHAR(10)[] DEFAULT NULL;
            RAISE NOTICE 'Coluna areas_permitidas adicionada.';
        END IF;
    END $$;

-- Adicionar coluna billing_cycle (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'billing_cycle'
        ) THEN
            ALTER TABLE planos ADD COLUMN billing_cycle VARCHAR(20) DEFAULT 'monthly';
            ALTER TABLE planos ADD CONSTRAINT chk_planos_billing_cycle
                CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly'));
            RAISE NOTICE 'Coluna billing_cycle adicionada.';
        END IF;
    END $$;

-- Adicionar coluna cor (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'cor'
        ) THEN
            ALTER TABLE planos ADD COLUMN cor VARCHAR(7) DEFAULT '#3B82F6';
            RAISE NOTICE 'Coluna cor adicionada.';
        END IF;
    END $$;

-- Adicionar coluna preco_anual (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'preco_anual'
        ) THEN
            ALTER TABLE planos ADD COLUMN preco_anual DECIMAL(10,2);
            RAISE NOTICE 'Coluna preco_anual adicionada.';
        END IF;
    END $$;

-- Adicionar coluna gyms_permitidos (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'gyms_permitidos'
        ) THEN
            ALTER TABLE planos ADD COLUMN gyms_permitidos INTEGER[] DEFAULT NULL;
            RAISE NOTICE 'Coluna gyms_permitidos adicionada.';
        END IF;
    END $$;

-- Adicionar coluna duracao_dias (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'duracao_dias'
        ) THEN
            ALTER TABLE planos ADD COLUMN duracao_dias INTEGER DEFAULT 30;
            RAISE NOTICE 'Coluna duracao_dias adicionada.';
        END IF;
    END $$;

-- Adicionar coluna limite_checkins_dia (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'limite_checkins_dia'
        ) THEN
            ALTER TABLE planos ADD COLUMN limite_checkins_dia INTEGER DEFAULT 1;
            RAISE NOTICE 'Coluna limite_checkins_dia adicionada.';
        END IF;
    END $$;

-- Adicionar coluna tipo_acesso (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'tipo_acesso'
        ) THEN
            ALTER TABLE planos ADD COLUMN tipo_acesso VARCHAR(20) DEFAULT 'unico';
            ALTER TABLE planos ADD CONSTRAINT chk_planos_tipo_acesso
                CHECK (tipo_acesso IN ('unico', 'multi', 'regional'));
            RAISE NOTICE 'Coluna tipo_acesso adicionada.';
        END IF;
    END $$;

-- Adicionar coluna inclui_aulas (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'inclui_aulas'
        ) THEN
            ALTER TABLE planos ADD COLUMN inclui_aulas BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Coluna inclui_aulas adicionada.';
        END IF;
    END $$;

-- Adicionar coluna inclui_nutricao (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'inclui_nutricao'
        ) THEN
            ALTER TABLE planos ADD COLUMN inclui_nutricao BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Coluna inclui_nutricao adicionada.';
        END IF;
    END $$;

-- Adicionar coluna inclui_pt (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'inclui_pt'
        ) THEN
            ALTER TABLE planos ADD COLUMN inclui_pt BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Coluna inclui_pt adicionada.';
        END IF;
    END $$;

-- Adicionar coluna moeda (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'moeda'
        ) THEN
            ALTER TABLE planos ADD COLUMN moeda VARCHAR(3) DEFAULT 'CVE';
            RAISE NOTICE 'Coluna moeda adicionada.';
        END IF;
    END $$;

-- Adicionar coluna criado_por (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'criado_por'
        ) THEN
            ALTER TABLE planos ADD COLUMN criado_por VARCHAR(20) REFERENCES usuarios(id) ON DELETE SET NULL;
            RAISE NOTICE 'Coluna criado_por adicionada.';
        END IF;
    END $$;

-- Adicionar coluna updated_at (se não existir)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'planos' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE planos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Coluna updated_at adicionada.';
        END IF;
    END $$;

-- Adicionar COMMENTS
COMMENT ON TABLE planos IS 'Planos de assinatura disponíveis';
COMMENT ON COLUMN planos.areas_permitidas IS 'Array de gym_areas.id permitidos para este plano';
COMMENT ON COLUMN planos.billing_cycle IS 'Ciclo de faturamento: monthly, quarterly, yearly';
COMMENT ON COLUMN planos.cor IS 'Cor hexadecimal para identificação visual do plano';
COMMENT ON COLUMN planos.preco_anual IS 'Preço anual do plano (para cálculo de desconto)';
COMMENT ON COLUMN planos.gyms_permitidos IS 'Array de gym_ids permitidos (para planos multi)';
COMMENT ON COLUMN planos.duracao_dias IS 'Duração do plano em dias';
COMMENT ON COLUMN planos.limite_checkins_dia IS 'Limite de check-ins permitidos por dia';
COMMENT ON COLUMN planos.tipo_acesso IS 'Tipo de acesso: unico, multi, regional';
COMMENT ON COLUMN planos.inclui_aulas IS 'Se o plano inclui aulas em grupo';
COMMENT ON COLUMN planos.inclui_nutricao IS 'Se o plano inclui acompanhamento nutricional';
COMMENT ON COLUMN planos.inclui_pt IS 'Se o plano inclui personal trainer';
COMMENT ON COLUMN planos.moeda IS 'Moeda do plano (CVE, EUR, USD)';
COMMENT ON COLUMN planos.criado_por IS 'ID do usuário que criou o plano';

-- Atualizar dados dos planos existentes
UPDATE planos SET
                  billing_cycle = 'monthly',
                  cor = '#3B82F6',
                  duracao_dias = 30,
                  limite_checkins_dia = 1,
                  tipo_acesso = 'unico',
                  inclui_aulas = FALSE,
                  inclui_nutricao = FALSE,
                  inclui_pt = FALSE,
                  moeda = 'CVE',
                  updated_at = CURRENT_TIMESTAMP
WHERE billing_cycle IS NULL;

-- Planos específicos
UPDATE planos SET areas_permitidas = ARRAY['a1','a2'], cor = '#3B82F6', preco_anual = 37800.00 WHERE id = 'p1';
UPDATE planos SET areas_permitidas = ARRAY['a1','a2','a3','a4','a5','a6'], cor = '#FF6B00', preco_anual = 59400.00, inclui_aulas = TRUE WHERE id = 'p2';
UPDATE planos SET areas_permitidas = ARRAY['a1','a2','a3'], cor = '#22C55E', preco_anual = 27000.00, inclui_aulas = TRUE WHERE id = 'p3';
UPDATE planos SET areas_permitidas = ARRAY['a1','a2','a3','a4','a5','a6'], cor = '#8B5CF6', preco_anual = 129600.00, inclui_aulas = TRUE WHERE id = 'p4';
UPDATE planos SET areas_permitidas = ARRAY['a1','a2','a3','a4','a5','a6'], cor = '#F59E0B', billing_cycle = 'quarterly', preco_anual = 14500.00, inclui_aulas = TRUE WHERE id = 'p5';
UPDATE planos SET areas_permitidas = ARRAY['a1','a2','a3','a4','a5','a6'], cor = '#EF4444', billing_cycle = 'yearly', preco_anual = 55000.00, inclui_aulas = TRUE, inclui_nutricao = TRUE, inclui_pt = TRUE WHERE id = 'p6';

SELECT 'Correção aplicada com sucesso!' as status;
SELECT id, nome, billing_cycle, cor, tipo_acesso, areas_permitidas FROM planos ORDER BY id;


-- ============================================================
-- 14. TABELA: avaliacoes_fisicas (Avaliações Físicas)
-- ============================================================
CREATE TABLE IF NOT EXISTS avaliacoes_fisicas (
                                                  id              SERIAL PRIMARY KEY,
                                                  membro_id       VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                                  avaliador_id    VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
                                                  gym_id          INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
                                                  data_avaliacao  DATE NOT NULL DEFAULT CURRENT_DATE,
                                                  peso_kg         DECIMAL(5,2),
                                                  altura_cm       DECIMAL(5,2),
                                                  imc             DECIMAL(4,2),
                                                  gordura_pct     DECIMAL(5,2),
                                                  massa_magra_kg  DECIMAL(5,2),
                                                  braco_direito_cm DECIMAL(5,2),
                                                  braco_esquerdo_cm DECIMAL(5,2),
                                                  cintura_cm      DECIMAL(5,2),
                                                  quadril_cm      DECIMAL(5,2),
                                                  coxa_direita_cm DECIMAL(5,2),
                                                  coxa_esquerda_cm DECIMAL(5,2),
                                                  observacoes     TEXT,
                                                  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 15. TABELA: configuracoes (Configurações por Unidade)
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
                                             id              SERIAL PRIMARY KEY,
                                             gym_id          INTEGER REFERENCES gyms(id) ON DELETE CASCADE,
                                             chave           VARCHAR(100) NOT NULL,
                                             valor           TEXT,
                                             tipo            VARCHAR(20) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json', 'array')),
                                             descricao       TEXT,
                                             is_global       BOOLEAN DEFAULT FALSE,
                                             created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                             updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                             UNIQUE(gym_id, chave)
);

COMMENT ON TABLE configuracoes IS 'Configurações globais e por unidade';

-- ============================================================
-- 16. TABELA: auditoria_log (Log de Auditoria)
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria_log (
                                             id              BIGSERIAL PRIMARY KEY,
                                             tabela_afetada  VARCHAR(100) NOT NULL,
                                             registro_id     VARCHAR(20),
                                             acao            VARCHAR(20) NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CHECKIN', 'PAGAMENTO')),
                                             dados_anteriores JSONB,
                                             dados_novos     JSONB,
                                             usuario_id      VARCHAR(20) REFERENCES usuarios(id) ON DELETE SET NULL,
                                             gym_id          INTEGER REFERENCES gyms(id) ON DELETE SET NULL,
                                             ip_address      INET,
                                             user_agent      TEXT,
                                             created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE auditoria_log IS 'Log de auditoria para rastreabilidade de ações';

-- ============================================================
-- 17. TABELA: notificacoes (Notificações do Sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS notificacoes (
                                            id              SERIAL PRIMARY KEY,
                                            usuario_id      VARCHAR(20) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                            tipo            VARCHAR(50) CHECK (tipo IN ('pagamento', 'checkin', 'aula', 'sistema', 'promocao', 'transferencia')),
                                            titulo          VARCHAR(200) NOT NULL,
                                            mensagem        TEXT,
                                            acao_url        VARCHAR(500),
                                            lida            BOOLEAN DEFAULT FALSE,
                                            data_leitura    TIMESTAMP,
                                            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 18. TABELA: receitas_semanais (Histórico de Receitas) - NOVA
-- ============================================================
CREATE TABLE IF NOT EXISTS receitas_semanais (
                                                 id              SERIAL PRIMARY KEY,
                                                 gym_id          INTEGER REFERENCES gyms(id) ON DELETE CASCADE,
                                                 data_inicio     DATE NOT NULL,
                                                 data_fim        DATE NOT NULL,
                                                 label           VARCHAR(10) NOT NULL,
                                                 receita_planos  DECIMAL(12,2) DEFAULT 0,
                                                 receita_extras  DECIMAL(12,2) DEFAULT 0,
                                                 receita_total   DECIMAL(12,2) GENERATED ALWAYS AS (receita_planos + receita_extras) STORED,
                                                 moeda           VARCHAR(3) DEFAULT 'CVE',
                                                 created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE receitas_semanais IS 'Histórico semanal de receitas por unidade';

-- ============================================================
-- 19. TABELA: receitas_mensais (Histórico Mensal de Receitas) - NOVA
-- ============================================================
CREATE TABLE IF NOT EXISTS receitas_mensais (
                                                id              SERIAL PRIMARY KEY,
                                                gym_id          INTEGER REFERENCES gyms(id) ON DELETE CASCADE,
                                                ano             INTEGER NOT NULL,
                                                mes             INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
                                                label           VARCHAR(20) NOT NULL,
                                                receita_planos  DECIMAL(12,2) DEFAULT 0,
                                                receita_extras  DECIMAL(12,2) DEFAULT 0,
                                                receita_total   DECIMAL(12,2) GENERATED ALWAYS AS (receita_planos + receita_extras) STORED,
                                                moeda           VARCHAR(3) DEFAULT 'CVE',
                                                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                UNIQUE(gym_id, ano, mes)
);

COMMENT ON TABLE receitas_mensais IS 'Histórico mensal de receitas por unidade';

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_gym ON usuarios(gym_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_qr ON usuarios(qr_code);

CREATE INDEX IF NOT EXISTS idx_usuario_gyms_usuario ON usuario_gyms(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_gyms_gym ON usuario_gyms(gym_id);

CREATE INDEX IF NOT EXISTS idx_gym_areas_gym ON gym_areas(gym_id);

CREATE INDEX IF NOT EXISTS idx_planos_status ON planos(status);

CREATE INDEX IF NOT EXISTS idx_assinaturas_membro ON assinaturas(membro_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_plano ON assinaturas(plano_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_gym ON assinaturas(gym_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_renovacao ON assinaturas(data_renovacao);

CREATE INDEX IF NOT EXISTS idx_pagamentos_membro ON pagamentos(membro_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_gym ON pagamentos(gym_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_vencimento ON pagamentos(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_checkins_membro ON checkins(membro_id);
CREATE INDEX IF NOT EXISTS idx_checkins_gym ON checkins(gym_id);
CREATE INDEX IF NOT EXISTS idx_checkins_area ON checkins(area_id);
CREATE INDEX IF NOT EXISTS idx_checkins_data ON checkins(data_hora);
CREATE INDEX IF NOT EXISTS idx_checkins_membro_data ON checkins(membro_id, data_hora);

CREATE INDEX IF NOT EXISTS idx_sessions_gym ON schedule_sessions(gym_id);
CREATE INDEX IF NOT EXISTS idx_sessions_instrutor ON schedule_sessions(instrutor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_area ON schedule_sessions(area_id);
CREATE INDEX IF NOT EXISTS idx_sessions_dia ON schedule_sessions(dia_semana);

CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_membro ON session_participants(membro_id);

CREATE INDEX IF NOT EXISTS idx_transferencias_membro ON transferencias(membro_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_status ON transferencias(status);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela ON auditoria_log(tabela_afetada);

CREATE INDEX IF NOT EXISTS idx_receitas_semanais_gym ON receitas_semanais(gym_id);
CREATE INDEX IF NOT EXISTS idx_receitas_mensais_gym ON receitas_mensais(gym_id);

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

CREATE OR REPLACE VIEW v_resumo_gym AS
SELECT
    g.id AS gym_id,
    g.nome AS gym_nome,
    COUNT(DISTINCT u.id) FILTER (WHERE p.nome = 'membro' AND u.status = 'ativo') AS total_membros,
    COUNT(DISTINCT c.id) FILTER (WHERE c.data_hora >= CURRENT_DATE) AS checkins_hoje,
    COALESCE(SUM(pag.valor) FILTER (WHERE pag.status = 'pago' AND pag.data_pagamento >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS receita_mes,
    COALESCE(SUM(pag.valor) FILTER (WHERE pag.status = 'pendente'), 0) AS pagamentos_pendentes
FROM gyms g
         LEFT JOIN usuarios u ON u.gym_id = g.id
         LEFT JOIN perfis p ON p.id = u.perfil_id
         LEFT JOIN checkins c ON c.gym_id = g.id
         LEFT JOIN pagamentos pag ON pag.gym_id = g.id
GROUP BY g.id, g.nome;

CREATE OR REPLACE VIEW v_membros_multi_gym AS
SELECT
    u.id AS membro_id,
    u.nome,
    u.email,
    COUNT(ug.gym_id) AS total_unidades,
    ARRAY_AGG(g.nome ORDER BY g.nome) AS unidades
FROM usuarios u
         JOIN usuario_gyms ug ON ug.usuario_id = u.id
         JOIN gyms g ON g.id = ug.gym_id
         JOIN perfis p ON p.id = u.perfil_id
WHERE p.nome = 'membro'
GROUP BY u.id, u.nome, u.email
HAVING COUNT(ug.gym_id) > 1;

CREATE OR REPLACE VIEW v_pagamentos_atrasados AS
SELECT
    p.*,
    u.nome AS membro_nome,
    g.nome AS gym_nome,
    CURRENT_DATE - p.data_vencimento AS dias_atraso
FROM pagamentos p
         JOIN usuarios u ON u.id = p.membro_id
         JOIN gyms g ON g.id = p.gym_id
WHERE p.status = 'pendente' AND p.data_vencimento < CURRENT_DATE;

CREATE OR REPLACE VIEW v_ocupacao_areas AS
SELECT
    ga.id AS area_id,
    ga.nome AS area_nome,
    ga.gym_id,
    g.nome AS gym_nome,
    ga.capacidade,
    ga.ocupacao_atual,
    ROUND((ga.ocupacao_atual::NUMERIC / NULLIF(ga.capacidade, 0)) * 100, 1) AS ocupacao_pct
FROM gym_areas ga
         JOIN gyms g ON g.id = ga.gym_id
WHERE ga.status = 'ativo';

-- ============================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION pode_checkin(p_membro_id VARCHAR(20), p_gym_id INTEGER, p_area_id VARCHAR(10) DEFAULT NULL)
    RETURNS BOOLEAN AS $$
DECLARE
    v_tem_acesso BOOLEAN;
    v_plano_ativo BOOLEAN;
    v_area_permitida BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM usuario_gyms
        WHERE usuario_id = p_membro_id
          AND gym_id = p_gym_id
          AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
    ) INTO v_tem_acesso;

    SELECT EXISTS(
        SELECT 1 FROM assinaturas
        WHERE membro_id = p_membro_id
          AND status = 'ativa'
          AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
    ) INTO v_plano_ativo;

    IF p_area_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM assinaturas a
                              JOIN planos pl ON pl.id = a.plano_id
            WHERE a.membro_id = p_membro_id
              AND a.status = 'ativa'
              AND (pl.areas_permitidas IS NULL OR p_area_id = ANY(pl.areas_permitidas))
        ) INTO v_area_permitida;
    ELSE
        v_area_permitida := TRUE;
    END IF;

    RETURN v_tem_acesso AND v_plano_ativo AND v_area_permitida;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gyms_updated_at BEFORE UPDATE ON gyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_gym_areas_updated_at BEFORE UPDATE ON gym_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_usuario_gyms_updated_at BEFORE UPDATE ON usuario_gyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_planos_updated_at BEFORE UPDATE ON planos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_assinaturas_updated_at BEFORE UPDATE ON assinaturas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_pagamentos_updated_at BEFORE UPDATE ON pagamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_transferencias_updated_at BEFORE UPDATE ON transferencias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_schedule_sessions_updated_at BEFORE UPDATE ON schedule_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_planos_treino_updated_at BEFORE UPDATE ON planos_treino
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_configuracoes_updated_at BEFORE UPDATE ON configuracoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DADOS DE EXEMPLO DO mockData.ts
-- ============================================================

-- Ginásios
INSERT INTO gyms (nome, slug, endereco, cidade, ilha, telefone, status) VALUES
                                                                            ('GymMaster Centro', 'gym-centro', 'Avenida Amílcar Cabral, 123', 'Praia', 'Santiago', '+238 123 4567', 'ativo'),
                                                                            ('GymMaster Praia', 'gym-praia', 'Rua 5 de Julho, 45', 'Praia', 'Santiago', '+238 234 5678', 'ativo'),
                                                                            ('GymMaster Mindelo', 'gym-mindelo', 'Avenida Marginal, 78', 'Mindelo', 'São Vicente', '+238 345 6789', 'ativo')
ON CONFLICT (slug) DO NOTHING;

-- Áreas do ginásio (gym_areas) - associadas ao gym_id=1 (Centro)
INSERT INTO gym_areas (id, gym_id, nome, icon, capacidade, ocupacao_atual, descricao) VALUES
                                                                                          ('a1', 1, 'Musculacao', 'Dumbbell', 40, 18, 'Area de musculacao completa'),
                                                                                          ('a2', 1, 'Cardio', 'Heart', 25, 12, 'Esteiras, bicicletas e elipticos'),
                                                                                          ('a3', 1, 'CrossFit', 'Flame', 20, 8, 'Treino funcional e CrossFit'),
                                                                                          ('a4', 1, 'Yoga', 'Sparkles', 15, 6, 'Sala de yoga e meditacao'),
                                                                                          ('a5', 1, 'Pilates', 'Activity', 12, 4, 'Equipamentos de Pilates'),
                                                                                          ('a6', 1, 'Luta', 'Swords', 16, 7, 'Boxe, Muay Thai e Jiu-Jitsu')
ON CONFLICT (id) DO NOTHING;

-- Planos de assinatura
INSERT INTO planos (id, nome, descricao, tipo_acesso, preco_mensal, preco_anual, billing_cycle, areas_permitidas, cor, inclui_aulas, status) VALUES
                                                                                                                                                 ('p1', 'Basico', 'Acesso a area de musculacao e cardio', 'unico', 3500.00, 37800.00, 'monthly', ARRAY['a1', 'a2'], '#3B82F6', FALSE, 'ativo'),
                                                                                                                                                 ('p2', 'Premium', 'Acesso a todas as areas do ginasio', 'unico', 5500.00, 59400.00, 'monthly', ARRAY['a1', 'a2', 'a3', 'a4', 'a5', 'a6'], '#FF6B00', TRUE, 'ativo'),
                                                                                                                                                 ('p3', 'Estudante', 'Plano especial para estudantes', 'unico', 2500.00, 27000.00, 'monthly', ARRAY['a1', 'a2', 'a3'], '#22C55E', TRUE, 'ativo'),
                                                                                                                                                 ('p4', 'Familia', 'Plano familiar ate 4 pessoas', 'unico', 12000.00, 129600.00, 'monthly', ARRAY['a1', 'a2', 'a3', 'a4', 'a5', 'a6'], '#8B5CF6', TRUE, 'ativo'),
                                                                                                                                                 ('p5', 'Trimestral Premium', 'Plano trimestral com desconto', 'unico', 4833.33, 14500.00, 'quarterly', ARRAY['a1', 'a2', 'a3', 'a4', 'a5', 'a6'], '#F59E0B', TRUE, 'ativo'),
                                                                                                                                                 ('p6', 'Anual VIP', 'Plano anual com todos os beneficios', 'unico', 4583.33, 55000.00, 'yearly', ARRAY['a1', 'a2', 'a3', 'a4', 'a5', 'a6'], '#EF4444', TRUE, 'ativo')
ON CONFLICT (id) DO NOTHING;

-- Membros (usuários com perfil 'membro')
INSERT INTO usuarios (id, nome, email, telefone, senha_hash, perfil_id, gym_id, status, pin_checkin) VALUES
                                                                                                         ('m1', 'Ana Silva', 'ana.silva@email.cv', '+238 912 345 678', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '1234'),
                                                                                                         ('m2', 'Carlos Mendes', 'carlos.m@email.cv', '+238 923 456 789', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '5678'),
                                                                                                         ('m3', 'Maria Fernandes', 'maria.f@email.cv', '+238 934 567 890', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '9012'),
                                                                                                         ('m4', 'Joao Santos', 'joao.s@email.cv', '+238 945 678 901', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '3456'),
                                                                                                         ('m5', 'Beatriz Lopes', 'beatriz.l@email.cv', '+238 956 789 012', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'inactive', '7890'),
                                                                                                         ('m6', 'Pedro Goncalves', 'pedro.g@email.cv', '+238 967 890 123', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '2345'),
                                                                                                         ('m7', 'Sofia Rocha', 'sofia.r@email.cv', '+238 978 901 234', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '6789'),
                                                                                                         ('m8', 'Miguel Andrade', 'miguel.a@email.cv', '+238 989 012 345', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '0123'),
                                                                                                         ('m9', 'Laura Pires', 'laura.p@email.cv', '+238 990 123 456', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '4567'),
                                                                                                         ('m10', 'Rui Barros', 'rui.b@email.cv', '+238 901 234 567', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'inactive', '8901'),
                                                                                                         ('m11', 'Catarina Neves', 'catarina.n@email.cv', '+238 912 345 679', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '1111'),
                                                                                                         ('m12', 'Tiago Vieira', 'tiago.v@email.cv', '+238 923 456 780', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '2222'),
                                                                                                         ('m13', 'Diana Correia', 'diana.c@email.cv', '+238 934 567 891', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '3333'),
                                                                                                         ('m14', 'Bruno Teixeira', 'bruno.t@email.cv', '+238 945 678 902', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '4444'),
                                                                                                         ('m15', 'Ines Duarte', 'ines.d@email.cv', '+238 956 789 013', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '5555'),
                                                                                                         ('m16', 'Filipe Cardoso', 'filipe.c@email.cv', '+238 967 890 124', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '6666'),
                                                                                                         ('m17', 'Raquel Martins', 'raquel.m@email.cv', '+238 978 901 235', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '7777'),
                                                                                                         ('m18', 'Andre Fonseca', 'andre.f@email.cv', '+238 989 012 346', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '8888'),
                                                                                                         ('m19', 'Mariana Reis', 'mariana.r@email.cv', '+238 990 123 457', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '9999'),
                                                                                                         ('m20', 'Goncalo Lima', 'goncalo.l@email.cv', '+238 901 234 568', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='membro'), 1, 'active', '0000')
ON CONFLICT (id) DO NOTHING;

-- Team Members (Staff)
INSERT INTO usuarios (id, nome, email, telefone, senha_hash, perfil_id, gym_id, status) VALUES
                                                                                            ('t1', 'Ricardo Sousa', 'ricardo@ginasio.cv', '+238 912 000 001', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='super_admin'), 1, 'active'),
                                                                                            ('t2', 'Patricia Amaral', 'patricia@ginasio.cv', '+238 912 000 002', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='gerente_unidade'), 1, 'active'),
                                                                                            ('t3', 'Daniel Costa', 'daniel@ginasio.cv', '+238 912 000 003', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='personal_trainer'), 1, 'active'),
                                                                                            ('t4', 'Helena Matos', 'helena@ginasio.cv', '+238 912 000 004', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='personal_trainer'), 1, 'active'),
                                                                                            ('t5', 'Sergio Pinheiro', 'sergio@ginasio.cv', '+238 912 000 005', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='personal_trainer'), 1, 'inactive'),
                                                                                            ('t6', 'Carla Ribeiro', 'carla@ginasio.cv', '+238 912 000 006', '$2a$10$hashed', (SELECT id FROM perfis WHERE nome='recepcionista'), 1, 'active')
ON CONFLICT (id) DO NOTHING;

-- Associar membros ao gym via usuario_gyms
INSERT INTO usuario_gyms (usuario_id, gym_id, is_principal, motivo) VALUES
                                                                        ('m1', 1, TRUE, 'contrato'), ('m2', 1, TRUE, 'contrato'), ('m3', 1, TRUE, 'contrato'),
                                                                        ('m4', 1, TRUE, 'contrato'), ('m5', 1, TRUE, 'contrato'), ('m6', 1, TRUE, 'contrato'),
                                                                        ('m7', 1, TRUE, 'contrato'), ('m8', 1, TRUE, 'contrato'), ('m9', 1, TRUE, 'contrato'),
                                                                        ('m10', 1, TRUE, 'contrato'), ('m11', 1, TRUE, 'contrato'), ('m12', 1, TRUE, 'contrato'),
                                                                        ('m13', 1, TRUE, 'contrato'), ('m14', 1, TRUE, 'contrato'), ('m15', 1, TRUE, 'contrato'),
                                                                        ('m16', 1, TRUE, 'contrato'), ('m17', 1, TRUE, 'contrato'), ('m18', 1, TRUE, 'contrato'),
                                                                        ('m19', 1, TRUE, 'contrato'), ('m20', 1, TRUE, 'contrato')
ON CONFLICT DO NOTHING;

-- Associar staff ao gym
INSERT INTO usuario_gyms (usuario_id, gym_id, is_principal, motivo) VALUES
                                                                        ('t1', 1, TRUE, 'contrato'), ('t2', 1, TRUE, 'contrato'), ('t3', 1, TRUE, 'contrato'),
                                                                        ('t4', 1, TRUE, 'contrato'), ('t5', 1, TRUE, 'contrato'), ('t6', 1, TRUE, 'contrato')
ON CONFLICT DO NOTHING;

-- Faturas/Pagamentos
INSERT INTO pagamentos (id, membro_id, gym_id, descricao, valor, data_vencimento, status, metodo_pagamento) VALUES
                                                                                                                ('i1', 'm5', 1, 'Mensalidade Maio - Premium', 5500.00, '2026-05-15', 'atrasado', NULL),
                                                                                                                ('i2', 'm10', 1, 'Mensalidade Maio - Premium', 5500.00, '2026-05-15', 'atrasado', NULL),
                                                                                                                ('i3', 'm1', 1, 'Mensalidade Junho - Premium', 5500.00, '2026-06-15', 'pendente', NULL),
                                                                                                                ('i4', 'm2', 1, 'Mensalidade Junho - Basico', 3500.00, '2026-06-15', 'pendente', NULL),
                                                                                                                ('i5', 'm3', 1, 'Mensalidade Junho - Estudante', 2500.00, '2026-06-15', 'pendente', NULL),
                                                                                                                ('i6', 'm4', 1, 'Mensalidade Junho - Premium', 5500.00, '2026-06-15', 'pendente', NULL),
                                                                                                                ('i7', 'm6', 1, 'Mensalidade Junho - Premium', 5500.00, '2026-06-15', 'pendente', NULL),
                                                                                                                ('i8', 'm7', 1, 'Mensalidade Junho - Familia', 12000.00, '2026-06-15', 'pendente', NULL),
                                                                                                                ('i9', 'm11', 1, 'Mensalidade Junho - Basico', 3500.00, '2026-06-01', 'pago', 'transferencia'),
                                                                                                                ('i10', 'm12', 1, 'Mensalidade Junho - Premium', 5500.00, '2026-06-01', 'pago', 'transferencia'),
                                                                                                                ('i11', 'm15', 1, 'Mensalidade Junho - Premium', 5500.00, '2026-06-01', 'pago', 'cartao_credito'),
                                                                                                                ('i12', 'm17', 1, 'Mensalidade Junho - Premium', 5500.00, '2026-06-01', 'pago', 'cartao_debito')
ON CONFLICT (id) DO NOTHING;

-- Atualizar datas de pagamento para os pagos
UPDATE pagamentos SET data_pagamento = '2026-06-01' WHERE id IN ('i9', 'i10');
UPDATE pagamentos SET data_pagamento = '2026-06-02' WHERE id = 'i11';
UPDATE pagamentos SET data_pagamento = '2026-06-03' WHERE id = 'i12';

-- Check-ins (Attendance Records)
INSERT INTO checkins (id, membro_id, gym_id, area_id, data_hora, metodo) VALUES
                                                                             ('at1', 'm1', 1, 'a1', '2026-05-31T08:30:00', 'qr_code'),
                                                                             ('at2', 'm6', 1, 'a2', '2026-05-31T08:45:00', 'qr_code'),
                                                                             ('at3', 'm3', 1, 'a3', '2026-05-31T09:00:00', 'pin'),
                                                                             ('at4', 'm4', 1, 'a1', '2026-05-31T09:15:00', 'qr_code'),
                                                                             ('at5', 'm14', 1, 'a2', '2026-05-31T09:30:00', 'qr_code'),
                                                                             ('at6', 'm9', 1, 'a4', '2026-05-31T10:00:00', 'pin'),
                                                                             ('at7', 'm16', 1, 'a1', '2026-05-31T10:15:00', 'qr_code'),
                                                                             ('at8', 'm18', 1, 'a6', '2026-05-31T10:30:00', 'qr_code'),
                                                                             ('at9', 'm20', 1, 'a1', '2026-05-31T11:00:00', 'qr_code'),
                                                                             ('at10', 'm19', 1, 'a2', '2026-05-31T11:15:00', 'pin'),
                                                                             ('at11', 'm12', 1, 'a3', '2026-05-31T14:00:00', 'qr_code'),
                                                                             ('at12', 'm7', 1, 'a5', '2026-05-31T14:30:00', 'qr_code'),
                                                                             ('at13', 'm1', 1, 'a2', '2026-05-31T15:00:00', 'qr_code'),
                                                                             ('at14', 'm4', 1, 'a6', '2026-05-31T16:00:00', 'pin'),
                                                                             ('at15', 'm15', 1, 'a1', '2026-05-31T16:30:00', 'qr_code')
ON CONFLICT (id) DO NOTHING;

-- Aulas agendadas (Schedule Sessions)
INSERT INTO schedule_sessions (id, gym_id, titulo, instrutor_id, area_id, dia_semana, hora_inicio, hora_fim, capacidade_max, inscritos, tipo) VALUES
                                                                                                                                                  ('s1', 1, 'Musculacao Iniciante', 't3', 'a1', 1, '07:00', '08:00', 12, 8, 'musculacao'),
                                                                                                                                                  ('s2', 1, 'HIIT Cardio', 't4', 'a2', 1, '08:00', '09:00', 15, 10, 'cardio'),
                                                                                                                                                  ('s3', 1, 'CrossFit WOD', 't3', 'a3', 1, '18:00', '19:00', 16, 14, 'crossfit'),
                                                                                                                                                  ('s4', 1, 'Yoga Flow', 't4', 'a4', 1, '19:00', '20:00', 12, 9, 'yoga'),
                                                                                                                                                  ('s5', 1, 'Pilates', 't4', 'a5', 2, '07:00', '08:00', 10, 7, 'pilates'),
                                                                                                                                                  ('s6', 1, 'Boxe Fitness', 't3', 'a6', 2, '18:00', '19:00', 14, 11, 'boxe'),
                                                                                                                                                  ('s7', 1, 'Musculacao Avancado', 't3', 'a1', 2, '19:00', '20:00', 10, 6, 'musculacao'),
                                                                                                                                                  ('s8', 1, 'Spinning', 't4', 'a2', 3, '07:00', '08:00', 15, 12, 'spinning'),
                                                                                                                                                  ('s9', 1, 'CrossFit WOD', 't3', 'a3', 3, '18:00', '19:00', 16, 13, 'crossfit'),
                                                                                                                                                  ('s10', 1, 'Yoga Relax', 't4', 'a4', 3, '19:00', '20:00', 12, 8, 'yoga'),
                                                                                                                                                  ('s11', 1, 'Musculacao Iniciante', 't3', 'a1', 4, '07:00', '08:00', 12, 9, 'musculacao'),
                                                                                                                                                  ('s12', 1, 'Muay Thai', 't3', 'a6', 4, '18:00', '19:00', 14, 10, 'muay_thai'),
                                                                                                                                                  ('s13', 1, 'Pilates Avancado', 't4', 'a5', 4, '19:00', '20:00', 10, 6, 'pilates'),
                                                                                                                                                  ('s14', 1, 'HIIT Cardio', 't4', 'a2', 5, '07:00', '08:00', 15, 11, 'cardio'),
                                                                                                                                                  ('s15', 1, 'CrossFit Team', 't3', 'a3', 5, '18:00', '19:00', 16, 15, 'crossfit'),
                                                                                                                                                  ('s16', 1, 'Jiu-Jitsu', 't3', 'a6', 5, '19:00', '20:00', 14, 9, 'jiu_jitsu'),
                                                                                                                                                  ('s17', 1, 'Yoga Manha', 't4', 'a4', 6, '09:00', '10:00', 12, 7, 'yoga'),
                                                                                                                                                  ('s18', 1, 'Musculacao Livre', 't3', 'a1', 6, '10:00', '11:00', 15, 10, 'musculacao')
ON CONFLICT (id) DO NOTHING;

-- Receitas semanais
INSERT INTO receitas_semanais (gym_id, data_inicio, data_fim, label, receita_planos, receita_extras) VALUES
                                                                                                         (1, '2026-05-25', '2026-05-31', '25/05', 42000, 8500),
                                                                                                         (1, '2026-05-26', '2026-06-01', '26/05', 38000, 6200),
                                                                                                         (1, '2026-05-27', '2026-06-02', '27/05', 45000, 9800),
                                                                                                         (1, '2026-05-28', '2026-06-03', '28/05', 51000, 11200),
                                                                                                         (1, '2026-05-29', '2026-06-04', '29/05', 48000, 10500),
                                                                                                         (1, '2026-05-30', '2026-06-05', '30/05', 55000, 12500),
                                                                                                         (1, '2026-05-31', '2026-06-06', '31/05', 72300, 17450)
ON CONFLICT DO NOTHING;

-- Receitas mensais
INSERT INTO receitas_mensais (gym_id, ano, mes, label, receita_planos, receita_extras) VALUES
                                                                                           (1, 2025, 12, 'Dez', 152000, 28000),
                                                                                           (1, 2026, 1, 'Jan', 168000, 32000),
                                                                                           (1, 2026, 2, 'Fev', 175000, 35000),
                                                                                           (1, 2026, 3, 'Mar', 162000, 31000),
                                                                                           (1, 2026, 4, 'Abr', 180000, 38000),
                                                                                           (1, 2026, 5, 'Mai', 195000, 42000)
ON CONFLICT DO NOTHING;

-- Configurações globais
INSERT INTO configuracoes (chave, valor, tipo, descricao, is_global) VALUES
                                                                         ('nome_empresa', 'GymMasterRS', 'string', 'Nome da empresa', TRUE),
                                                                         ('moeda_padrao', 'CVE', 'string', 'Moeda padrão', TRUE),
                                                                         ('timezone', 'Atlantic/Cape_Verde', 'string', 'Fuso horário', TRUE),
                                                                         ('checkin_antecipado_minutos', '15', 'number', 'Minutos antes para check-in', TRUE),
                                                                         ('checkin_limite_diario', '2', 'number', 'Limite de check-ins por dia', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- VALIDAÇÃO: Consultas de verificação
-- ============================================================

-- Verificar estrutura
SELECT 'Tabelas criadas' as verificacao, COUNT(*) as total FROM information_schema.tables WHERE table_schema = 'public';

-- Verificar dados inseridos
SELECT 'Ginásios' as entidade, COUNT(*) as total FROM gyms
UNION ALL SELECT 'Áreas', COUNT(*) FROM gym_areas
UNION ALL SELECT 'Planos', COUNT(*) FROM planos
UNION ALL SELECT 'Membros', COUNT(*) FROM usuarios WHERE perfil_id = (SELECT id FROM perfis WHERE nome='membro')
UNION ALL SELECT 'Staff', COUNT(*) FROM usuarios WHERE perfil_id != (SELECT id FROM perfis WHERE nome='membro')
UNION ALL SELECT 'Pagamentos', COUNT(*) FROM pagamentos
UNION ALL SELECT 'Check-ins', COUNT(*) FROM checkins
UNION ALL SELECT 'Aulas', COUNT(*) FROM schedule_sessions
UNION ALL SELECT 'Receitas Semanais', COUNT(*) FROM receitas_semanais
UNION ALL SELECT 'Receitas Mensais', COUNT(*) FROM receitas_mensais;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================