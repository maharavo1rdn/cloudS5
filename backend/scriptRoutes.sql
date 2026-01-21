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

CREATE TABLE point_statut(
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    niveau INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE points (
    id SERIAL PRIMARY KEY,
    probleme_id INTEGER REFERENCES problemes(id),
    surface_m2 DECIMAL(10,2),
    budget DECIMAL(12,2),
    entreprise_id INTEGER REFERENCES entreprises(id),
    date_detection DATE DEFAULT CURRENT_DATE,
    date_debut DATE,
    date_fin DATE,
    avancement_pourcentage INTEGER DEFAULT 0,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    point_statut_id INTEGER REFERENCES point_statut(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);