-- Foto opcional que o turista tira no momento da visita, guardada apenas
-- para o diario/perfil dele — nunca faz parte da validacao da visita, que
-- continua sendo feita exclusivamente por geolocalizacao (geofencing).
ALTER TABLE visits ADD COLUMN IF NOT EXISTS photo_key VARCHAR(500);
