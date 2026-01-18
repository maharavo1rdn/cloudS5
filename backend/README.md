# Backend Node.js avec PostgreSQL et Docker

Ce projet est un backend Node.js simple pour l'authentification utilisateur avec une base de données PostgreSQL, déployé via Docker.

## Fonctionnalités

- Inscription d'utilisateur
- Connexion avec génération de token JWT
- Utilisation de Sequelize ORM pour PostgreSQL

## Prérequis

- Docker et Docker Compose installés

## Installation et Démarrage

1. Cloner le repository
2. Aller dans le dossier backend
3. Lancer les conteneurs Docker :

```bash
docker-compose up --build
```

L'API sera disponible sur http://localhost:3000

## Endpoints

### Authentification
#### POST /api/auth/register
Inscrit un nouvel utilisateur.

**Body :**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### POST /api/auth/login
Connecte un utilisateur et retourne un token JWT.

**Body :**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response :**
```json
{
  "message": "Connexion réussie",
  "token": "jwt_token_here"
}
```

### Utilisateurs (nécessite un token JWT dans le header Authorization)
#### GET /api/users/profile
Récupère le profil de l'utilisateur connecté.

**Headers :**
```
Authorization: Bearer <jwt_token>
```

#### GET /api/users/:id
Récupère un utilisateur par ID (seulement son propre profil).

#### PUT /api/users/:id
Met à jour un utilisateur (seulement son propre profil).

**Body :**
```json
{
  "username": "nouveau_username",
  "email": "nouvel@email.com"
}
```

#### DELETE /api/users/:id
Supprime un utilisateur (seulement son propre compte).

## Variables d'environnement

Configurer dans le fichier `.env` :
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET
- PORT

## Développement

Pour le développement local sans Docker :
1. Installer PostgreSQL localement
2. Configurer les variables d'environnement
3. Lancer `npm run dev` pour nodemon