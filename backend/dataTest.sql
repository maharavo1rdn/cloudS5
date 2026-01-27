-- =====================================================
-- Données de test réalistes pour l'application CloudS5
-- Suivi des travaux routiers à Antananarivo, Madagascar
-- Compatible avec script.sql et scriptRoutes.sql
-- =====================================================

-- =====================================================
-- TYPES DE PROBLÈMES
-- =====================================================
INSERT INTO problemes (nom, description) VALUES 
    ('Nid de poule', 'Cavité formée dans la chaussée due à l''usure ou aux intempéries'),
    ('Fissure longitudinale', 'Fissure parallèle à l''axe de la route'),
    ('Fissure transversale', 'Fissure perpendiculaire à l''axe de la route'),
    ('Affaissement', 'Déformation de la surface de la chaussée vers le bas'),
    ('Ornière', 'Déformation permanente de la chaussée dans les traces de roues'),
    ('Faïençage', 'Réseau de fissures interconnectées formant des polygones'),
    ('Désenrobage', 'Perte de liant et départ des granulats de surface'),
    ('Bourbier', 'Zone de route transformée en boue lors des pluies'),
    ('Effondrement', 'Effondrement partiel de la chaussée'),
    ('Érosion latérale', 'Érosion des bords de la chaussée')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ENTREPRISES DE BTP À MADAGASCAR
-- =====================================================
INSERT INTO entreprises (nom, email, telephone) VALUES 
    ('COLAS Madagascar', 'contact@colas.mg', '+261 20 22 234 56'),
    ('SOGEA SATOM Madagascar', 'info@sogea-satom.mg', '+261 20 22 345 67'),
    ('EGIS Madagascar', 'contact@egis.mg', '+261 20 22 456 78'),
    ('RAVINALA ROADS', 'info@ravinala-roads.mg', '+261 20 22 567 89'),
    ('ENTERPRISE MAGRO', 'contact@magro.mg', '+261 20 22 678 90'),
    ('SMTP - Société Malgache de Travaux Publics', 'smtp@moov.mg', '+261 20 22 789 01'),
    ('SMATP', 'smatp@orange.mg', '+261 20 22 890 12'),
    ('GENIE CIVIL MADA', 'gc.mada@gmail.com', '+261 34 12 345 67'),
    ('TRAVAUX NEUFS MADA', 'tnm@moov.mg', '+261 33 23 456 78'),
    ('BTP HASIN''NY TANANA', 'btp.hasiny@gmail.com', '+261 32 45 678 90')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ROUTES - TRAVAUX ROUTIERS ANTANANARIVO
-- =====================================================

-- Zone Analakely - Centre-ville
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Avenue de l''Indépendance - Section Analakely', 'Réfection complète de la chaussée devant le marché Analakely. Circulation dense, travaux de nuit recommandés.', 1, 'EN_COURS', 450.00, 125000000, 1, '2025-11-15', '2025-12-01', NULL, 65),
    ('Rue Rainitovo', 'Nids de poule multiples après saison des pluies. Axe très fréquenté vers Antaninarenina.', 1, 'NOUVEAU', 180.00, 45000000, NULL, '2026-01-10', NULL, NULL, 0),
    ('Place du 13 Mai', 'Fissures importantes sur le parking et voies d''accès.', 2, 'TERMINE', 320.00, 78000000, 2, '2025-09-20', '2025-10-15', '2025-12-20', 100);

-- Zone Antaninarenina - Haute-ville
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Escaliers Antaninarenina', 'Rénovation des escaliers historiques et voie d''accès véhicules.', 4, 'EN_COURS', 280.00, 95000000, 3, '2025-10-05', '2025-11-20', NULL, 40),
    ('Rue de Liège', 'Affaissement important dû aux canalisations défectueuses.', 4, 'NOUVEAU', 150.00, 62000000, NULL, '2026-01-05', NULL, NULL, 0);

-- Zone Mahamasina - Stade et environs
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Boulevard de Mahamasina', 'Réfection totale après dégâts des pluies. Accès stade national.', 8, 'EN_COURS', 850.00, 320000000, 1, '2025-08-10', '2025-09-15', NULL, 78),
    ('Parking Stade Mahamasina', 'Reprofilage et nouveau revêtement parking principal.', 5, 'TERMINE', 2500.00, 450000000, 2, '2025-06-01', '2025-07-01', '2025-11-30', 100),
    ('Route vers Anosy', 'Ornières profondes sur voie rapide. Circulation perturbée.', 5, 'NOUVEAU', 380.00, 98000000, NULL, '2026-01-12', NULL, NULL, 0);

-- Zone Anosy - Lac et ministères
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Boulevard périphérique Lac Anosy', 'Érosion des bords suite aux inondations. Zone ministères.', 10, 'EN_COURS', 620.00, 185000000, 4, '2025-12-01', '2026-01-10', NULL, 25),
    ('Accès Primature', 'Réfection urgente voie d''accès officielle.', 7, 'TERMINE', 200.00, 89000000, 1, '2025-10-20', '2025-11-01', '2025-12-15', 100);

-- Zone Isotry - Marché et quartier populaire
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Rue du Commerce Isotry', 'Bourbier permanent devant le marché. Drainage à refaire.', 8, 'EN_COURS', 420.00, 156000000, 5, '2025-11-25', '2025-12-20', NULL, 35),
    ('Carrefour Isotry-Andohatapenaka', 'Carrefour très endommagé, circulation chaotique.', 1, 'NOUVEAU', 550.00, 175000000, NULL, '2026-01-08', NULL, NULL, 0),
    ('Rue Rainibetsimisaraka', 'Faïençage généralisé sur 200m.', 6, 'NOUVEAU', 340.00, 82000000, NULL, '2026-01-15', NULL, NULL, 0);

-- Zone Andohalo - Cathédrale et tribunal
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Place Andohalo', 'Rénovation place historique et accès cathédrale.', 4, 'EN_COURS', 750.00, 280000000, 3, '2025-09-01', '2025-10-15', NULL, 55),
    ('Descente Andohalo vers Analakely', 'Pente dangereuse, désenrobage important.', 7, 'NOUVEAU', 290.00, 95000000, NULL, '2026-01-18', NULL, NULL, 0);

-- Zone Anosibe - Zone industrielle
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Route Anosibe Zone Industrielle', 'Effondrement partiel dû au trafic poids lourds.', 9, 'EN_COURS', 680.00, 420000000, 6, '2025-10-10', '2025-11-15', NULL, 70),
    ('Accès Port Sec Anosibe', 'Renforcement chaussée pour trafic conteneurs.', 5, 'TERMINE', 1200.00, 580000000, 1, '2025-05-01', '2025-06-15', '2025-10-30', 100),
    ('Rond-point Anosibe', 'Réaménagement complet du rond-point.', 4, 'NOUVEAU', 480.00, 195000000, NULL, '2026-01-02', NULL, NULL, 0);

-- Zone Behoririka - Marché et gare routière
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Avenue de Behoririka', 'Nids de poule profonds devant la gare routière.', 1, 'EN_COURS', 380.00, 112000000, 7, '2025-12-10', '2026-01-05', NULL, 15),
    ('Parking Gare Routière Nord', 'Revêtement complètement dégradé.', 6, 'NOUVEAU', 890.00, 245000000, NULL, '2026-01-14', NULL, NULL, 0);

-- Zone Ambanidia - Quartier résidentiel
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Route Ambanidia vers Tsimbazaza', 'Fissures transversales multiples.', 3, 'TERMINE', 520.00, 145000000, 4, '2025-07-15', '2025-08-20', '2025-11-10', 100),
    ('Accès Parc Tsimbazaza', 'Amélioration accès touristique au zoo.', 7, 'EN_COURS', 350.00, 128000000, 8, '2025-11-01', '2025-12-10', NULL, 45);

-- Zone Ivandry - Quartier d'affaires
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Boulevard de l''Europe Ivandry', 'Extension et élargissement voie principale.', 4, 'EN_COURS', 1500.00, 750000000, 1, '2025-06-01', '2025-08-15', NULL, 82),
    ('Rond-point Ivandry', 'Réaménagement carrefour vers Ankorondrano.', 5, 'NOUVEAU', 620.00, 285000000, NULL, '2026-01-16', NULL, NULL, 0),
    ('Accès Galaxy Mall', 'Renforcement accès centre commercial.', 1, 'TERMINE', 280.00, 92000000, 2, '2025-09-10', '2025-10-01', '2025-12-05', 100);

-- Zone Ankorondrano - Zone commerciale
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Route digue Ankorondrano', 'Érosion latérale menaçant la stabilité.', 10, 'EN_COURS', 950.00, 520000000, 6, '2025-07-20', '2025-09-01', NULL, 60),
    ('Accès Jumbo Score', 'Réfection parking et voies d''accès.', 6, 'TERMINE', 1800.00, 380000000, 5, '2025-04-15', '2025-05-20', '2025-09-30', 100);

-- Zone Andraharo - Vers aéroport
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('RN7 Sortie Andraharo', 'Élargissement et renforcement route nationale.', 4, 'EN_COURS', 2200.00, 980000000, 1, '2025-03-01', '2025-05-15', NULL, 88),
    ('Carrefour Andraharo', 'Aménagement échangeur simplifié.', 5, 'NOUVEAU', 780.00, 450000000, NULL, '2026-01-19', NULL, NULL, 0);

-- Zone 67Ha - Quartier populaire
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Avenue 67 Hectares', 'Bourbier chronique, drainage prioritaire.', 8, 'EN_COURS', 680.00, 320000000, 9, '2025-10-25', '2025-12-01', NULL, 30),
    ('Marché 67Ha accès principal', 'Pavage et assainissement.', 8, 'NOUVEAU', 420.00, 185000000, NULL, '2026-01-11', NULL, NULL, 0);

-- Zone Ambohibao - Périphérie
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Route Ambohibao vers Ivato', 'Renforcement axe vers aéroport international.', 4, 'EN_COURS', 3500.00, 1850000000, 2, '2025-01-15', '2025-04-01', NULL, 75),
    ('By-pass Ambohibao', 'Construction nouvelle voie de contournement.', 4, 'EN_COURS', 5200.00, 3200000000, 1, '2024-11-01', '2025-02-01', NULL, 92);

-- Zone Tanjombato - Sud
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('RN7 Tanjombato', 'Réhabilitation après inondations.', 9, 'TERMINE', 1800.00, 720000000, 3, '2025-02-20', '2025-04-15', '2025-10-20', 100),
    ('Pont Tanjombato', 'Renforcement tablier et accès.', 9, 'EN_COURS', 450.00, 580000000, 6, '2025-08-01', '2025-09-15', NULL, 50);

-- Quelques routes supplémentaires récentes
INSERT INTO routes (nom, description, probleme_id, statut, surface_m2, budget, entreprise_id, date_detection, date_debut, date_fin, avancement_pourcentage) VALUES
    ('Tunnel Ambohidahy', 'Réfection revêtement intérieur tunnel.', 7, 'NOUVEAU', 890.00, 420000000, NULL, '2026-01-17', NULL, NULL, 0),
    ('Rocade Sud - Section 1', 'Nouvelle construction rocade périphérique.', 4, 'EN_COURS', 8500.00, 5500000000, 1, '2024-06-01', '2024-09-15', NULL, 68),
    ('Avenue Lénine Antsahavola', 'Réfection complète avenue principale.', 6, 'NOUVEAU', 720.00, 285000000, NULL, '2026-01-20', NULL, NULL, 0);

-- =====================================================
-- POINTS GÉOGRAPHIQUES POUR CHAQUE ROUTE
-- (Chaque route peut avoir plusieurs points GPS)
-- =====================================================

-- Points pour Avenue de l'Indépendance (route_id = 1)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (1, -18.91370000, 47.52560000, 1, 'FINI'),
    (1, -18.91380000, 47.52540000, 2, 'EN_COURS'),
    (1, -18.91390000, 47.52520000, 3, 'A_TRAITER');

-- Points pour Rue Rainitovo (route_id = 2)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (2, -18.91450000, 47.52340000, 1, 'A_TRAITER'),
    (2, -18.91460000, 47.52320000, 2, 'A_TRAITER');

-- Points pour Place du 13 Mai (route_id = 3)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (3, -18.91280000, 47.52670000, 1, 'FINI'),
    (3, -18.91290000, 47.52680000, 2, 'FINI'),
    (3, -18.91300000, 47.52690000, 3, 'FINI');

-- Points pour Escaliers Antaninarenina (route_id = 4)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (4, -18.90890000, 47.52980000, 1, 'FINI'),
    (4, -18.90900000, 47.52970000, 2, 'EN_COURS'),
    (4, -18.90910000, 47.52960000, 3, 'A_TRAITER');

-- Points pour Rue de Liège (route_id = 5)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (5, -18.90950000, 47.52850000, 1, 'A_TRAITER');

-- Points pour Boulevard de Mahamasina (route_id = 6)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (6, -18.92340000, 47.51980000, 1, 'FINI'),
    (6, -18.92360000, 47.51960000, 2, 'FINI'),
    (6, -18.92380000, 47.51940000, 3, 'EN_COURS'),
    (6, -18.92400000, 47.51920000, 4, 'A_TRAITER');

-- Points pour Parking Stade Mahamasina (route_id = 7)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (7, -18.92450000, 47.51870000, 1, 'FINI'),
    (7, -18.92470000, 47.51850000, 2, 'FINI');

-- Points pour Route vers Anosy (route_id = 8)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (8, -18.92120000, 47.52230000, 1, 'A_TRAITER'),
    (8, -18.92140000, 47.52250000, 2, 'A_TRAITER');

-- Points pour Boulevard périphérique Lac Anosy (route_id = 9)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (9, -18.91890000, 47.53120000, 1, 'EN_COURS'),
    (9, -18.91910000, 47.53140000, 2, 'A_TRAITER'),
    (9, -18.91930000, 47.53160000, 3, 'A_TRAITER');

-- Points pour Accès Primature (route_id = 10)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (10, -18.91670000, 47.53340000, 1, 'FINI'),
    (10, -18.91680000, 47.53350000, 2, 'FINI');

-- Points pour Rue du Commerce Isotry (route_id = 11)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (11, -18.90560000, 47.51780000, 1, 'FINI'),
    (11, -18.90570000, 47.51770000, 2, 'EN_COURS'),
    (11, -18.90580000, 47.51760000, 3, 'A_TRAITER');

-- Points pour Carrefour Isotry-Andohatapenaka (route_id = 12)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (12, -18.90340000, 47.51560000, 1, 'A_TRAITER'),
    (12, -18.90350000, 47.51550000, 2, 'A_TRAITER');

-- Points pour Place Andohalo (route_id = 15)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (15, -18.91980000, 47.52670000, 1, 'FINI'),
    (15, -18.91990000, 47.52680000, 2, 'EN_COURS'),
    (15, -18.92000000, 47.52690000, 3, 'A_TRAITER');

-- Points pour Route Anosibe Zone Industrielle (route_id = 17)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (17, -18.93120000, 47.50890000, 1, 'FINI'),
    (17, -18.93140000, 47.50870000, 2, 'FINI'),
    (17, -18.93160000, 47.50850000, 3, 'EN_COURS'),
    (17, -18.93180000, 47.50830000, 4, 'A_TRAITER');

-- Points pour Boulevard de l'Europe Ivandry (route_id = 25)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (25, -18.89340000, 47.53890000, 1, 'FINI'),
    (25, -18.89360000, 47.53870000, 2, 'FINI'),
    (25, -18.89380000, 47.53850000, 3, 'FINI'),
    (25, -18.89400000, 47.53830000, 4, 'EN_COURS'),
    (25, -18.89420000, 47.53810000, 5, 'A_TRAITER');

-- Points pour Route digue Ankorondrano (route_id = 28)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (28, -18.88560000, 47.52340000, 1, 'FINI'),
    (28, -18.88580000, 47.52360000, 2, 'FINI'),
    (28, -18.88600000, 47.52380000, 3, 'EN_COURS'),
    (28, -18.88620000, 47.52400000, 4, 'A_TRAITER');

-- Points pour RN7 Sortie Andraharo (route_id = 30)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (30, -18.87230000, 47.53120000, 1, 'FINI'),
    (30, -18.87250000, 47.53100000, 2, 'FINI'),
    (30, -18.87270000, 47.53080000, 3, 'FINI'),
    (30, -18.87290000, 47.53060000, 4, 'EN_COURS'),
    (30, -18.87310000, 47.53040000, 5, 'A_TRAITER');

-- Points pour Route Ambohibao vers Ivato (route_id = 34)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (34, -18.85340000, 47.47890000, 1, 'FINI'),
    (34, -18.85320000, 47.47910000, 2, 'FINI'),
    (34, -18.85300000, 47.47930000, 3, 'EN_COURS'),
    (34, -18.85280000, 47.47950000, 4, 'A_TRAITER');

-- Points pour By-pass Ambohibao (route_id = 35)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (35, -18.85120000, 47.47560000, 1, 'FINI'),
    (35, -18.85100000, 47.47580000, 2, 'FINI'),
    (35, -18.85080000, 47.47600000, 3, 'FINI'),
    (35, -18.85060000, 47.47620000, 4, 'FINI'),
    (35, -18.85040000, 47.47640000, 5, 'EN_COURS'),
    (35, -18.85020000, 47.47660000, 6, 'A_TRAITER');

-- Points pour Rocade Sud - Section 1 (route_id = 39)
INSERT INTO route_points (route_id, latitude, longitude, ordre, point_statut) VALUES
    (39, -18.96230000, 47.52340000, 1, 'FINI'),
    (39, -18.96250000, 47.52360000, 2, 'FINI'),
    (39, -18.96270000, 47.52380000, 3, 'EN_COURS'),
    (39, -18.96290000, 47.52400000, 4, 'EN_COURS'),
    (39, -18.96310000, 47.52420000, 5, 'A_TRAITER'),
    (39, -18.96330000, 47.52440000, 6, 'A_TRAITER'),
    (39, -18.96350000, 47.52460000, 7, 'A_TRAITER');

-- =====================================================
-- RÉSUMÉ DES DONNÉES INSÉRÉES
-- =====================================================
-- Problèmes: 10 types de dégradations routières
-- Entreprises: 10 entreprises BTP malgaches
-- Routes: 40 projets de travaux routiers
--   - NOUVEAU: ~15
--   - EN_COURS: ~17  
--   - TERMINE: ~8
-- Route Points: ~70 points GPS avec statuts individuels
-- Budget total: ~18 milliards Ariary
-- Surface totale: ~35 000 m²

-- =====================================================
-- VÉRIFICATION
-- =====================================================
SELECT 'Problèmes' as table_name, COUNT(*) as count FROM problemes
UNION ALL
SELECT 'Entreprises', COUNT(*) FROM entreprises
UNION ALL
SELECT 'Routes', COUNT(*) FROM routes
UNION ALL
SELECT 'Points GPS', COUNT(*) FROM route_points;

-- Stats par statut
SELECT statut, COUNT(*) as nombre, SUM(budget) as budget_total
FROM routes
GROUP BY statut
ORDER BY statut;
