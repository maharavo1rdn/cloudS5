-- Table des problèmes types
CREATE TABLE problemes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des entreprises
CREATE TABLE entreprises (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table principale des routes
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Infos sur le problème
    probleme_id INTEGER REFERENCES problemes(id),
    statut VARCHAR(20) DEFAULT 'NOUVEAU', -- 'NOUVEAU', 'EN_COURS', 'TERMINE'
    surface_m2 DECIMAL(10,2),
    budget DECIMAL(12,2),
    
    -- Entreprise et dates
    entreprise_id INTEGER REFERENCES entreprises(id),
    date_detection DATE DEFAULT CURRENT_DATE,
    date_debut DATE,
    date_fin DATE,
    
    -- État d'avancement
    avancement_pourcentage INTEGER DEFAULT 0, -- 0-100%
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des points géographiques avec statut
CREATE TABLE route_points (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    ordre INTEGER NOT NULL,
    point_statut VARCHAR(20) DEFAULT 'A_TRAITER', -- 'A_TRAITER', 'EN_COURS', 'FINI'
    created_at TIMESTAMP DEFAULT NOW()
);