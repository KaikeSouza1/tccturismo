-- Papel de administrador da plataforma (nao vinculado a nenhuma organizacao):
-- visualiza as conquistas fixas e cria/configura novas organizacoes. Substitui
-- o fluxo manual via create-org.ts por uma conta de verdade no painel.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('tourist', 'admin', 'platform_admin'));
