-- Migration pour ajouter les champs de synchronisation Firebase
-- Compatible: exécutable de manière sûre même si la table n'existe pas encore

-- Ajouter les colonnes si elles n'existent pas
ALTER TABLE IF EXISTS points
  ADD COLUMN IF NOT EXISTS firebase_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Créer des index si nécessaires (ne plante pas si existent)
CREATE INDEX IF NOT EXISTS idx_points_firebase_id ON points(firebase_id);
CREATE INDEX IF NOT EXISTS idx_points_last_synced ON points(last_synced_at);

-- Ajouter des commentaires seulement si la colonne existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'points' AND column_name = 'firebase_id'
  ) THEN
    COMMENT ON COLUMN points.firebase_id IS 'ID du document correspondant dans Firestore';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'points' AND column_name = 'last_synced_at'
  ) THEN
    COMMENT ON COLUMN points.last_synced_at IS 'Timestamp de la dernière synchronisation avec Firebase';
  END IF;
END
$$;

-- Note: la contrainte d'unicité est mieux gérée dans une migration dédiée
-- si nécessaire, exécuter manuellement après vérification des doublons.
