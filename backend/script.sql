-- Script SQL pour initialiser la base de données PostgreSQL
-- Base de données : cloud_db

-- Créer la base de données (si elle n'existe pas)
-- Note: Dans Docker Compose, la base est créée automatiquement

-- Se connecter à la base cloud_db

-- Créer la table roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    level INT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP

);

-- Créer la table users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id) ON DELETE SET NULL,
    isBlocked BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Créer la table pour les tentatives de connexion
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    attempts INT DEFAULT 0,
    last_attempt TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP WITHOUT TIME ZONE
);

-- Créer la table settings
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    value VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les rôles par défaut
INSERT INTO roles (name, level) VALUES
('utilisateur', 3),
('admin', 10)
ON CONFLICT (name) DO NOTHING;

-- Insérer des utilisateurs de test
-- Mot de passe pour user1: password123 (hashé)
-- Mot de passe pour user2: testpass (hashé)
INSERT INTO users (username, email, password, role_id) VALUES
('Jean Dupont', 'user@gmail.com', '$2b$10$ZtILaT9EXLGMcj0bah9O4usgz3XG.7MRBhslmBdQDJyb/UPUvSCfO', (SELECT id FROM roles WHERE name = 'utilisateur')),
('admin', 'admin@gmail.com', '$2b$10$j6DCBuJAnByRjz0sv0YRguf0AoVZQlG.aKUSfvu2EGMyTD20gyTcS', (SELECT id FROM roles WHERE name = 'admin'))
ON CONFLICT (email) DO NOTHING;

-- Insérer les paramètres par défaut
INSERT INTO settings (code, value, type) VALUES
('max_login_attempts', '3', 'number'),
('session_lifetime_hours', '24', 'number')
ON CONFLICT (code) DO NOTHING;

-- Vérifier les données
SELECT * FROM users;