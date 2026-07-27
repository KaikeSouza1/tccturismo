-- Um atrativo passa a poder ter varias fotos (galeria) em vez de uma unica
-- imagem substituivel. A antiga coluna image_key vira a primeira linha desta
-- tabela para nao perder fotos ja cadastradas.

CREATE TABLE IF NOT EXISTS attraction_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attraction_id UUID NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
    image_key VARCHAR(500) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attraction_images_attraction_id ON attraction_images(attraction_id);

INSERT INTO attraction_images (attraction_id, image_key, position)
SELECT id, image_key, 0 FROM attractions WHERE image_key IS NOT NULL;

ALTER TABLE attractions DROP COLUMN IF EXISTS image_key;
