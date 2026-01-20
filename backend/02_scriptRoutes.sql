-- Table des problèmes types
CREATE TABLE IF NOT EXISTS problemes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des entreprises
CREATE TABLE IF NOT EXISTS entreprises (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table principale des routes
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Infos sur le problème
    probleme_id INTEGER REFERENCES problemes(id),
    statut VARCHAR(20) DEFAULT 'NOUVEAU' CHECK (statut IN ('NOUVEAU', 'EN_COURS', 'TERMINE')),
    surface_m2 DECIMAL(10,2) CHECK (surface_m2 >= 0),
    budget DECIMAL(12,2) CHECK (budget >= 0),
    
    -- Entreprise et dates
    entreprise_id INTEGER REFERENCES entreprises(id),
    date_detection DATE DEFAULT CURRENT_DATE,
    date_debut DATE,
    date_fin DATE CHECK (date_fin IS NULL OR date_fin >= date_debut),
    
    -- État d'avancement
    avancement_pourcentage INTEGER DEFAULT 0 CHECK (avancement_pourcentage >= 0 AND avancement_pourcentage <= 100),
    
    -- Ajout de l'état de la route comme demandé précédemment
    etat VARCHAR(20) DEFAULT 'EN_TRAVAUX' CHECK (etat IN ('FINI', 'EN_TRAVAUX', 'EN_ATTENTE', 'INTACTE', 'ENDOMMAGEE')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des points géographiques avec statut
CREATE TABLE IF NOT EXISTS route_points (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DECIMAL(11,8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    ordre INTEGER NOT NULL CHECK (ordre >= 0),
    point_statut VARCHAR(20) DEFAULT 'A_TRAITER' CHECK (point_statut IN ('A_TRAITER', 'EN_COURS', 'FINI')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_routes_statut ON routes(statut);
CREATE INDEX IF NOT EXISTS idx_routes_etat ON routes(etat);
CREATE INDEX IF NOT EXISTS idx_routes_entreprise ON routes(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_routes_probleme ON routes(probleme_id);
CREATE INDEX IF NOT EXISTS idx_route_points_route ON route_points(route_id);
CREATE INDEX IF NOT EXISTS idx_route_points_statut ON route_points(point_statut);
CREATE INDEX IF NOT EXISTS idx_route_points_ordre ON route_points(route_id, ordre);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour routes
CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();