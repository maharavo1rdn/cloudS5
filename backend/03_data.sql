-- ============================================
-- DONNÉES POUR ANTANANARIVO, MADAGASCAR
-- ============================================

-- 1. Insertion des entreprises locales
INSERT INTO entreprises (nom, email, telephone) VALUES
('Travaux Publics Tana', 'contact@tptana.mg', '+261 20 22 12345'),
('BTP Madagascar', 'btp@btpmadagascar.mg', '+261 20 22 23456'),
('Routes et Infrastructures Malagasy', 'rim@rim.mg', '+261 34 05 67890'),
('Entreprise Générale des Travaux', 'egt@egt.mg', '+261 32 11 22334'),
('Société Malagasy de Construction', 'smc@construction.mg', '+261 33 12 34567');

-- 2. Insertion des problèmes types courants à Tana
INSERT INTO problemes (nom, description) VALUES
('Nid de poule', 'Trous dans la chaussée causés par l''érosion'),
('Fissure longitudinale', 'Fissures dans le sens de la circulation'),
('Affaissement', 'Affaissement de la chaussée dû aux intempéries'),
('Revêtement usé', 'Usure excessive de la surface de roulement'),
('Bordure endommagée', 'Bordure de trottoir cassée ou manquante'),
('Drainage obstrué', 'Caniveaux et systèmes de drainage bloqués'),
('Nids de poule multiples', 'Zones avec plusieurs nids de poule rapprochés'),
('Ornières', 'Ornières profondes dans les voies de circulation');

-- 3. Insertion des routes principales d''Antananarivo
INSERT INTO routes (nom, description, etat, statut, surface_m2, budget, probleme_id, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
('Avenue de l''Indépendance', 'Artère principale du centre-ville', 'EN_TRAVAUX', 'EN_COURS', 1500.50, 250000000.00, 4, 1, '2024-01-10', '2024-01-20', '2024-03-20', 40),
('RN1 - Sortie Nord', 'Route Nationale 1 vers Ambohimanga', 'EN_TRAVAUX', 'EN_COURS', 3200.75, 450000000.00, 1, 2, '2024-01-15', '2024-02-01', '2024-04-30', 25),
('RN2 - Sortie Est', 'Route Nationale 2 vers Tamatave', 'ENDOMMAGEE', 'NOUVEAU', 2800.25, 380000000.00, 6, 3, '2024-01-05', NULL, NULL, 0),
('RN3 - Sortie Sud', 'Route Nationale 3 vers Antsirabe', 'INTACTE', 'TERMINE', 2200.00, 320000000.00, 3, 4, '2023-11-20', '2023-12-01', '2024-01-15', 100),
('RN4 - Sortie Ouest', 'Route Nationale 4 vers Majunga', 'EN_ATTENTE', 'NOUVEAU', 1800.50, 280000000.00, 2, 5, '2024-01-12', '2024-02-15', '2024-05-15', 0),
('Boulevard de la Révolution', 'Ceinture périphérique', 'EN_TRAVAUX', 'EN_COURS', 4200.00, 650000000.00, 7, 1, '2024-01-08', '2024-01-25', '2024-06-30', 15),
('Route d''Andraharo', 'Axe industriel vers la zone d''Andraharo', 'ENDOMMAGEE', 'NOUVEAU', 950.75, 120000000.00, 8, 2, '2024-01-18', NULL, NULL, 0),
('Route d''Ivandry', 'Axe résidentiel haut-standing', 'FINI', 'TERMINE', 850.25, 95000000.00, 5, 3, '2023-12-10', '2023-12-15', '2024-01-30', 100),
('Route d''Anosy', 'Axe vers le lac Anosy', 'EN_TRAVAUX', 'EN_COURS', 1250.00, 180000000.00, 1, 4, '2024-01-22', '2024-02-10', '2024-03-31', 60),
('Route de l''Aéroport', 'Accès à l''aéroport Ivato', 'INTACTE', 'TERMINE', 2100.50, 310000000.00, 4, 5, '2023-11-25', '2023-12-05', '2024-01-20', 100);

-- 4. Insertion des points géographiques pour les routes
-- Route 1: Avenue de l''Indépendance (coordonnées d''Antananarivo)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
(1, -18.910012, 47.525580, 1, 'FINI'),      -- Début: Analakely
(1, -18.908500, 47.527200, 2, 'EN_COURS'),  -- Milieu: Place de l''Indépendance
(1, -18.907000, 47.528800, 3, 'A_TRAITER'), -- Fin: Ambohijatovo
(1, -18.905500, 47.530400, 4, 'A_TRAITER'), -- Extension: Soarano

-- Route 2: RN1 - Sortie Nord (vers Ambohimanga)
(2, -18.916667, 47.516667, 1, 'FINI'),      -- Départ: Antaninarenina
(2, -18.920000, 47.513333, 2, 'EN_COURS'),  -- Section 1
(2, -18.923333, 47.510000, 3, 'A_TRAITER'), -- Section 2
(2, -18.926667, 47.506667, 4, 'A_TRAITER'), -- Section 3
(2, -18.930000, 47.503333, 5, 'A_TRAITER'), -- Arrivée: Ambohimanga

-- Route 3: RN2 - Sortie Est (vers Tamatave)
(3, -18.900000, 47.533333, 1, 'A_TRAITER'), -- Départ: Anosy
(3, -18.897500, 47.536667, 2, 'A_TRAITER'), -- Section 1
(3, -18.895000, 47.540000, 3, 'A_TRAITER'), -- Section 2

-- Route 4: RN3 - Sortie Sud (vers Antsirabe) - Route terminée
(4, -18.933333, 47.516667, 1, 'FINI'),      -- Départ: Isoraka
(4, -18.936667, 47.520000, 2, 'FINI'),      -- Section 1
(4, -18.940000, 47.523333, 3, 'FINI'),      -- Section 2
(4, -18.943333, 47.526667, 4, 'FINI'),      -- Sortie sud

-- Route 5: RN4 - Sortie Ouest (vers Majunga)
(5, -18.883333, 47.500000, 1, 'A_TRAITER'), -- Départ: Andohalo
(5, -18.880000, 47.496667, 2, 'A_TRAITER'), -- Section 1
(5, -18.876667, 47.493333, 3, 'A_TRAITER'), -- Section 2

-- Route 6: Boulevard de la Révolution
(6, -18.910000, 47.510000, 1, 'FINI'),      -- Point 1: Ouest
(6, -18.908000, 47.513000, 2, 'EN_COURS'),  -- Point 2
(6, -18.906000, 47.516000, 3, 'A_TRAITER'), -- Point 3
(6, -18.904000, 47.519000, 4, 'A_TRAITER'), -- Point 4: Sud
(6, -18.902000, 47.522000, 5, 'A_TRAITER'), -- Point 5

-- Route 7: Route d''Andraharo
(7, -18.890000, 47.550000, 1, 'A_TRAITER'), -- Départ
(7, -18.888333, 47.553333, 2, 'A_TRAITER'), -- Zone industrielle
(7, -18.886667, 47.556667, 3, 'A_TRAITER'), -- Arrivée

-- Route 8: Route d''Ivandry (terminée)
(8, -18.870000, 47.530000, 1, 'FINI'),      -- Début
(8, -18.872000, 47.532000, 2, 'FINI'),      -- Résidence 1
(8, -18.874000, 47.534000, 3, 'FINI'),      -- Résidence 2
(8, -18.876000, 47.536000, 4, 'FINI'),      -- Fin

-- Route 9: Route d''Anosy
(9, -18.920000, 47.520000, 1, 'FINI'),      -- Départ: Ambatovinaky
(9, -18.918333, 47.523333, 2, 'EN_COURS'),  -- Section lac
(9, -18.916667, 47.526667, 3, 'A_TRAITER'), -- Arrivée: Anosy

-- Route 10: Route de l''Aéroport (terminée)
(10, -18.950000, 47.480000, 1, 'FINI'),     -- Centre-ville
(10, -18.953333, 47.476667, 2, 'FINI'),     -- Sortie ouest
(10, -18.956667, 47.473333, 3, 'FINI'),     -- Périphérie
(10, -18.960000, 47.470000, 4, 'FINI');     -- Aéroport Ivato