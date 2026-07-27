-- Introduz organizacoes (multi-tenant): cada prefeitura/associacao de turismo
-- que adotar a plataforma passa a ser uma organizacao, dona de seus proprios
-- atrativos e podendo criar ate 10 conquistas proprias, alem das 10 conquistas
-- fixas da plataforma (organization_id NULL).

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organizacao padrao para acomodar os dados ja existentes (Uniao da Vitoria).
INSERT INTO organizations (name, slug)
VALUES ('Uniao da Vitoria', 'uniao-da-vitoria')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE users SET organization_id = (SELECT id FROM organizations WHERE slug = 'uniao-da-vitoria')
WHERE role = 'admin' AND organization_id IS NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_admin_requires_org;
ALTER TABLE users ADD CONSTRAINT users_admin_requires_org
    CHECK (role <> 'admin' OR organization_id IS NOT NULL);

ALTER TABLE attractions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE attractions SET organization_id = (SELECT id FROM organizations WHERE slug = 'uniao-da-vitoria')
WHERE organization_id IS NULL;

ALTER TABLE attractions ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attractions_organization_id ON attractions(organization_id);

-- image_url guardava uma URL completa; agora guarda apenas a chave do objeto
-- no bucket R2 (ex: attractions/<id>/<uuid>.jpg), servida via proxy do backend.
ALTER TABLE attractions RENAME COLUMN image_url TO image_key;
ALTER TABLE attractions ALTER COLUMN image_key TYPE VARCHAR(500);

ALTER TABLE achievements ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_achievements_organization_id ON achievements(organization_id);

ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_criteria_type_check;
ALTER TABLE achievements ADD CONSTRAINT achievements_criteria_type_check CHECK (
    criteria_type IN (
        'attractions_visited_count',
        'specific_attractions',
        'all_attractions',
        'category_complete',
        'points_total',
        'distinct_categories_count',
        'distinct_organizations_count'
    )
);

-- As 3 conquistas ilustrativas antigas davam lugar a um conjunto fixo de 10
-- conquistas oficiais da plataforma (organization_id permanece NULL nelas).
-- Dados de demonstracao, seguro substituir.
DELETE FROM user_achievements WHERE achievement_id IN (
    SELECT id FROM achievements WHERE code IN ('primeira_visita', 'explorador_3', 'guardiao_da_cidade')
);
DELETE FROM achievements WHERE code IN ('primeira_visita', 'explorador_3', 'guardiao_da_cidade');
