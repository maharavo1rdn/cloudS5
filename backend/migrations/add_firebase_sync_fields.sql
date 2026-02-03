-- Migration pour ajouter les champs de synchronisation Firebase
-- À exécuter dans PostgreSQL

-- Ajouter la colonne firebase_id pour stocker l'ID du document Firestore
ALTER TABLE points 
ADD COLUMN firebase_id VARCHAR(255) UNIQUE,
ADD COLUMN last_synced_at TIMESTAMP;

-- Créer un index sur firebase_id pour les recherches rapides
CREATE INDEX idx_points_firebase_id ON points(firebase_id);
CREATE INDEX idx_points_last_synced ON points(last_synced_at);

-- Ajouter un commentaire pour documenter l'utilisation
COMMENT ON COLUMN points.firebase_id IS 'ID du document correspondant dans Firestore';
COMMENT ON COLUMN points.last_synced_at IS 'Timestamp de la dernière synchronisation avec Firebase';

-- Optionnel: ajouter une contrainte pour s'assurer que firebase_id est unique si présent
ALTER TABLE points ADD CONSTRAINT unique_firebase_id UNIQUE (firebase_id);