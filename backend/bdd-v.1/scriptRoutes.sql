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


-- Insertion des 3 statuts essentiels
INSERT INTO point_statut (code, description, niveau) VALUES
('A_FAIRE', 'À traiter', 1),
('EN_COURS', 'En cours de traitement', 2),
('TERMINE', 'Terminé', 3);

-- Insertion des types de problèmes
INSERT INTO problemes (nom, description) VALUES
('Nid-de-poule', 'Dépression dans la chaussée nécessitant réparation'),
('Éclairage défectueux', 'Lampadaire ou système d''éclairage HS'),
('Signalisation endommagée', 'Panneau de signalisation abîmé ou manquant'),
('Déchet encombrant', 'Objet volumineux sur la voie publique'),
('Végétation invasive', 'Végétation gênant la circulation ou la visibilité'),
('Fuite eau', 'Fuite d''eau sur la voie publique'),
('Caniveau bouché', 'Caniveau obstrué par des déchets');

-- Insertion des entreprises de Tana
INSERT INTO entreprises (nom, email, telephone) VALUES
('TP Madagascar', 'contact@tpmadagascar.mg', '+261 20 22 345 67'),
('Jiro Sy Rano', 'jiro@commune-tana.mg', '+261 20 22 456 78'),
('Service Propreté Tana', 'proprete@mairie-tana.mg', '+261 20 22 567 89'),
('Jardins d''Antananarivo', 'jardins@mairie-tana.mg', '+261 20 22 678 90'),
('SMMC', 'contact@smmc.mg', '+261 20 22 789 01'),
('Entreprise RAZAFY', 'razafy.tp@blueline.mg', '+261 34 05 123 45');

-- Insertion des points dans différents quartiers de Tana
INSERT INTO points (probleme_id, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage, latitude, longitude, point_statut_id) VALUES
-- Analakely (Centre-ville)
(1, 3.50, 450000, 1, '2024-01-15', NULL, NULL, 0, -18.9087, 47.5256, 1), -- Avenue de l''Indépendance
(2, NULL, 280000, 2, '2024-01-16', NULL, NULL, 0, -18.9072, 47.5271, 1), -- Rue Rainandriamampandry
(4, 4.20, 150000, 3, '2024-01-10', '2024-01-17', NULL, 65, -18.9103, 47.5248, 2), -- Rue Rabozaka

-- Isoraka
(5, 8.00, 320000, 4, '2024-01-12', '2024-01-18', NULL, 80, -18.9145, 47.5289, 2), -- Rue Dr Villette
(3, NULL, 180000, NULL, '2024-01-14', NULL, NULL, 0, -18.9132, 47.5301, 1), -- Rue Rainitsararay
(6, 2.50, 550000, 5, '2023-12-20', '2024-01-05', '2024-01-15', 100, -18.9158, 47.5295, 3), -- Avenue Ramanantsoa

-- Ambohijatovo
(1, 5.20, 620000, 6, '2023-12-28', '2024-01-10', '2024-01-22', 100, -18.9120, 47.5223, 3), -- Rue Raveloary
(7, 3.00, 190000, 5, '2024-01-05', '2024-01-12', NULL, 45, -18.9115, 47.5218, 2), -- Rue Ratsimilaho

-- Antaninarenina
(2, NULL, 210000, 2, '2024-01-08', '2024-01-15', NULL, 70, -18.9182, 47.5189, 2), -- Rue Pierre Stibbe
(4, 6.50, 175000, 3, '2024-01-18', NULL, NULL, 0, -18.9190, 47.5201, 1), -- Avenue de la Libération

-- Tsaralalana
(3, NULL, 195000, 1, '2023-12-15', '2023-12-22', '2024-01-08', 100, -18.9058, 47.5186, 3), -- Rue Andrianary Ratianarivo
(1, 4.80, 580000, 6, '2024-01-03', '2024-01-10', NULL, 55, -18.9043, 47.5198, 2), -- Rue Rabehevitra

-- Mahamasina
(5, 12.00, 380000, 4, '2023-12-10', '2023-12-18', '2024-01-05', 100, -18.9215, 47.5162, 3), -- Stade Mahamasina alentours
(6, 3.50, 490000, 5, '2024-01-20', NULL, NULL, 0, -18.9221, 47.5175, 1), -- Avenue Gabriel Ramanantsoa

-- Anosy
(7, 2.80, 165000, NULL, '2024-01-17', NULL, NULL, 0, -18.9256, 47.5148, 1), -- Lac Anosy
(4, 5.50, 142000, 3, '2024-01-02', '2024-01-09', NULL, 90, -18.9243, 47.5132, 2), -- Avenue de la République

-- Andraharo
(2, NULL, 230000, 2, '2023-12-05', '2023-12-12', '2023-12-28', 100, -18.8987, 47.5109, 3), -- Route des Hydrocarbures
(1, 6.30, 710000, 1, '2024-01-22', NULL, NULL, 0, -18.9002, 47.5123, 1), -- Avenue de l''Océan Indien

-- Ivandry
(5, 9.50, 420000, 4, '2024-01-19', NULL, NULL, 0, -18.9328, 47.5081, 1), -- Zone industrielle
(3, NULL, 205000, 1, '2023-12-22', '2024-01-05', '2024-01-18', 100, -18.9315, 47.5094, 3); -- Rue des Entrepreneurs

-- Points supplémentaires sans entreprise assignée
INSERT INTO points (probleme_id, surface_m2, budget, entreprise_id, date_detection, avancement_pourcentage, latitude, longitude, point_statut_id) VALUES
(1, 2.20, 310000, NULL, '2024-01-23', 0, -18.9065, 47.5321, 1), -- Ambatonakanga
(7, 1.80, 125000, NULL, '2024-01-24', 0, -18.9098, 47.5194, 1), -- Besarety
(4, 7.00, 185000, NULL, '2024-01-25', 0, -18.9167, 47.5118, 1); -- Ambanidia