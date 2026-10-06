-- Traduz nomes de tabelas e colunas do schema de ingles para portugues.
-- Contrato da API nao muda: a camada de codigo (services) passou a usar
-- "AS <nome_antigo>" nas queries para devolver exatamente os mesmos nomes
-- de campo que o app mobile e o painel admin ja esperam.

-- 1. Tabelas
ALTER TABLE users RENAME TO usuarios;
ALTER TABLE organizations RENAME TO organizacoes;
ALTER TABLE attractions RENAME TO atrativos;
ALTER TABLE attraction_images RENAME TO atrativo_imagens;
ALTER TABLE visits RENAME TO visitas;
ALTER TABLE achievements RENAME TO conquistas;
ALTER TABLE user_achievements RENAME TO usuario_conquistas;
ALTER TABLE schema_migrations RENAME TO migracoes_esquema;

-- 2. Colunas
ALTER TABLE usuarios RENAME COLUMN name TO nome;
ALTER TABLE usuarios RENAME COLUMN password_hash TO senha_hash;
ALTER TABLE usuarios RENAME COLUMN role TO papel;
ALTER TABLE usuarios RENAME COLUMN points TO pontos;
ALTER TABLE usuarios RENAME COLUMN created_at TO criado_em;
ALTER TABLE usuarios RENAME COLUMN updated_at TO atualizado_em;
ALTER TABLE usuarios RENAME COLUMN organization_id TO organizacao_id;

ALTER TABLE organizacoes RENAME COLUMN name TO nome;
ALTER TABLE organizacoes RENAME COLUMN created_at TO criado_em;

ALTER TABLE atrativos RENAME COLUMN name TO nome;
ALTER TABLE atrativos RENAME COLUMN description TO descricao;
ALTER TABLE atrativos RENAME COLUMN category TO categoria;
ALTER TABLE atrativos RENAME COLUMN radius_meters TO raio_metros;
ALTER TABLE atrativos RENAME COLUMN qr_code_token TO token_qr_code;
ALTER TABLE atrativos RENAME COLUMN active TO ativo;
ALTER TABLE atrativos RENAME COLUMN created_at TO criado_em;
ALTER TABLE atrativos RENAME COLUMN updated_at TO atualizado_em;
ALTER TABLE atrativos RENAME COLUMN organization_id TO organizacao_id;

ALTER TABLE atrativo_imagens RENAME COLUMN attraction_id TO atrativo_id;
ALTER TABLE atrativo_imagens RENAME COLUMN image_key TO chave_imagem;
ALTER TABLE atrativo_imagens RENAME COLUMN position TO posicao;
ALTER TABLE atrativo_imagens RENAME COLUMN created_at TO criado_em;

ALTER TABLE visitas RENAME COLUMN user_id TO usuario_id;
ALTER TABLE visitas RENAME COLUMN attraction_id TO atrativo_id;
ALTER TABLE visitas RENAME COLUMN distance_meters TO distancia_metros;
ALTER TABLE visitas RENAME COLUMN client_recorded_at TO registrado_em_cliente;
ALTER TABLE visitas RENAME COLUMN synced_at TO sincronizado_em;
ALTER TABLE visitas RENAME COLUMN created_at TO criado_em;
ALTER TABLE visitas RENAME COLUMN photo_key TO chave_foto;

ALTER TABLE conquistas RENAME COLUMN code TO codigo;
ALTER TABLE conquistas RENAME COLUMN name TO nome;
ALTER TABLE conquistas RENAME COLUMN description TO descricao;
ALTER TABLE conquistas RENAME COLUMN icon TO icone;
ALTER TABLE conquistas RENAME COLUMN criteria_type TO tipo_criterio;
ALTER TABLE conquistas RENAME COLUMN criteria_value TO valor_criterio;
ALTER TABLE conquistas RENAME COLUMN points TO pontos;
ALTER TABLE conquistas RENAME COLUMN created_at TO criado_em;
ALTER TABLE conquistas RENAME COLUMN organization_id TO organizacao_id;

ALTER TABLE usuario_conquistas RENAME COLUMN user_id TO usuario_id;
ALTER TABLE usuario_conquistas RENAME COLUMN achievement_id TO conquista_id;
ALTER TABLE usuario_conquistas RENAME COLUMN unlocked_at TO desbloqueado_em;

ALTER TABLE migracoes_esquema RENAME COLUMN name TO nome;
ALTER TABLE migracoes_esquema RENAME COLUMN applied_at TO aplicado_em;

-- 3. Constraints (nomeadas)
ALTER TABLE usuarios RENAME CONSTRAINT users_pkey TO usuarios_pkey;
ALTER TABLE usuarios RENAME CONSTRAINT users_email_key TO usuarios_email_key;
ALTER TABLE usuarios RENAME CONSTRAINT users_organization_id_fkey TO usuarios_organizacao_id_fkey;
ALTER TABLE usuarios RENAME CONSTRAINT users_role_check TO usuarios_papel_check;
ALTER TABLE usuarios RENAME CONSTRAINT users_admin_requires_org TO usuarios_admin_requer_organizacao;

ALTER TABLE organizacoes RENAME CONSTRAINT organizations_pkey TO organizacoes_pkey;
ALTER TABLE organizacoes RENAME CONSTRAINT organizations_slug_key TO organizacoes_slug_key;

ALTER TABLE atrativos RENAME CONSTRAINT attractions_pkey TO atrativos_pkey;
ALTER TABLE atrativos RENAME CONSTRAINT attractions_qr_code_token_key TO atrativos_token_qr_code_key;
ALTER TABLE atrativos RENAME CONSTRAINT attractions_organization_id_fkey TO atrativos_organizacao_id_fkey;

ALTER TABLE atrativo_imagens RENAME CONSTRAINT attraction_images_pkey TO atrativo_imagens_pkey;
ALTER TABLE atrativo_imagens RENAME CONSTRAINT attraction_images_attraction_id_fkey TO atrativo_imagens_atrativo_id_fkey;

ALTER TABLE visitas RENAME CONSTRAINT visits_pkey TO visitas_pkey;
ALTER TABLE visitas RENAME CONSTRAINT visits_user_id_fkey TO visitas_usuario_id_fkey;
ALTER TABLE visitas RENAME CONSTRAINT visits_attraction_id_fkey TO visitas_atrativo_id_fkey;

ALTER TABLE conquistas RENAME CONSTRAINT achievements_pkey TO conquistas_pkey;
ALTER TABLE conquistas RENAME CONSTRAINT achievements_code_key TO conquistas_codigo_key;
ALTER TABLE conquistas RENAME CONSTRAINT achievements_organization_id_fkey TO conquistas_organizacao_id_fkey;
ALTER TABLE conquistas RENAME CONSTRAINT achievements_criteria_type_check TO conquistas_tipo_criterio_check;

ALTER TABLE usuario_conquistas RENAME CONSTRAINT user_achievements_pkey TO usuario_conquistas_pkey;
ALTER TABLE usuario_conquistas RENAME CONSTRAINT user_achievements_user_id_achievement_id_key TO usuario_conquistas_usuario_id_conquista_id_key;
ALTER TABLE usuario_conquistas RENAME CONSTRAINT user_achievements_user_id_fkey TO usuario_conquistas_usuario_id_fkey;
ALTER TABLE usuario_conquistas RENAME CONSTRAINT user_achievements_achievement_id_fkey TO usuario_conquistas_conquista_id_fkey;

ALTER TABLE migracoes_esquema RENAME CONSTRAINT schema_migrations_pkey TO migracoes_esquema_pkey;

-- 4. Indices (nao-constraint)
ALTER INDEX idx_attractions_organization_id RENAME TO idx_atrativos_organizacao_id;
ALTER INDEX idx_attraction_images_attraction_id RENAME TO idx_atrativo_imagens_atrativo_id;
ALTER INDEX idx_visits_user_id RENAME TO idx_visitas_usuario_id;
ALTER INDEX idx_visits_attraction_id RENAME TO idx_visitas_atrativo_id;
ALTER INDEX idx_visits_created_at RENAME TO idx_visitas_criado_em;
ALTER INDEX idx_achievements_organization_id RENAME TO idx_conquistas_organizacao_id;
ALTER INDEX idx_user_achievements_user_id RENAME TO idx_usuario_conquistas_usuario_id;
