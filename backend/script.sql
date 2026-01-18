-- Script SQL pour initialiser la base de données PostgreSQL
-- Base de données : cloud_db

-- Créer la base de données (si elle n'existe pas)
-- Note: Dans Docker Compose, la base est créée automatiquement

-- Se connecter à la base cloud_db

-- Créer la table users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insérer des utilisateurs de test
-- Mot de passe pour user1: password123 (hashé)
-- Mot de passe pour user2: testpass (hashé)
INSERT INTO users (username, email, password) VALUES
('testuser', 'test@example.com', '$2b$10$ZtILaT9EXLGMcj0bah9O4usgz3XG.7MRBhslmBdQDJyb/UPUvSCfO'),
('admin', 'admin@example.com', '$2b$10$j6DCBuJAnByRjz0sv0YRguf0AoVZQlG.aKUSfvu2EGMyTD20gyTcS')
ON CONFLICT (email) DO NOTHING;

-- Vérifier les données
SELECT * FROM users;