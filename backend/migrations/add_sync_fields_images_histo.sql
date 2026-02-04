-- Migration: Ajout des champs de synchronisation pour images et historique
-- Date: 2026-02-04

-- Ajouter firebase_id à points_images si pas déjà présent
ALTER TABLE points_images 
ADD COLUMN IF NOT EXISTS firebase_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Ajouter firebase_id à points_histo si pas déjà présent  
ALTER TABLE points_histo
ADD COLUMN IF NOT EXISTS firebase_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Ajouter firebase_uid à users pour lier avec Firebase Auth
ALTER TABLE users
ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Index pour améliorer les performances de synchronisation
CREATE INDEX IF NOT EXISTS idx_points_images_firebase_id ON points_images(firebase_id);
CREATE INDEX IF NOT EXISTS idx_points_images_point_id ON points_images(point_id);
CREATE INDEX IF NOT EXISTS idx_points_images_synced ON points_images(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_points_histo_firebase_id ON points_histo(firebase_id);
CREATE INDEX IF NOT EXISTS idx_points_histo_point_id ON points_histo(point_id);
CREATE INDEX IF NOT EXISTS idx_points_histo_synced ON points_histo(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_synced ON users(last_synced_at);

COMMENT ON COLUMN points_images.firebase_id IS 'ID du document Firebase correspondant';
COMMENT ON COLUMN points_histo.firebase_id IS 'ID du document Firebase correspondant';
COMMENT ON COLUMN users.firebase_uid IS 'UID Firebase Auth de l''utilisateur';
