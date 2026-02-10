# Guide de Test - Statistiques de Délai de Traitement

## ✅ Checklist de Vérification

### 1. Backend

#### A. Route API Active
- [ ] Vérifier que le serveur démarre sans erreur
- [ ] Accéder à `http://localhost:3000/api-docs` pour voir la documentation Swagger
- [ ] Chercher `/api/stats/processing-times` dans la documentation

#### B. Test de l'Endpoint
```bash
# Test sans authentification (doit retourner 401)
curl http://localhost:3000/api/stats/processing-times

# Test avec token JWT (remplacer TOKEN par un vrai token)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/stats/processing-times
```

#### C. Vérifier les Données
- [ ] Vérifier que la base de données contient:
  - Des points avec `date_debut` et `date_fin`
  - Des points avec statut "TERMINE"
  - Des points avec statut "EN_COURS"

Query SQL pour vérifier:
```sql
SELECT 
  ps.code as status,
  COUNT(*) as count,
  COUNT(p.date_debut) as with_start_date,
  COUNT(p.date_fin) as with_end_date
FROM points p
LEFT JOIN point_statut ps ON p.point_statut_id = ps.id
GROUP BY ps.code;
```

### 2. Frontend

#### A. Fichiers Créés
- [ ] `frontend-web/src/components/ProcessingTimeStats.js` existe
- [ ] `frontend-web/src/components/ProcessingTimeStats.css` existe
- [ ] `PointsManager.js` importe `ProcessingTimeStats`

#### B. Navigation
- [ ] Aller à `/manager/points` (Gestion Points)
- [ ] Vous devez être connecté en tant que manager
- [ ] Le composant de statistiques doit apparaître en haut

#### C. Affichage
- [ ] 3 cartes principales s'affichent avec des chiffres
- [ ] 2 tableaux s'affichent (par problème, par entreprise)
- [ ] Bouton "Actualiser" fonctionne
- [ ] Le composant ne bloque pas la liste des points

### 3. Fonctionnalité

#### A. Chargement Initial
- [ ] L'écran affiche "Chargement des statistiques..." brièvement
- [ ] Les données s'affichent après quelques secondes
- [ ] Aucune erreur dans la console du navigateur

#### B. Interactions
- [ ] Cliquer sur "Actualiser" met à jour les données
- [ ] Les tableaux sont scrollables horizontalement sur mobile
- [ ] Les cartes s'adaptent à la taille de l'écran

#### C. Contenu Attendu
- [ ] Les cartes affichent des nombres > 0 (ou 0 selon les données)
- [ ] Les délais sont en jours
- [ ] Les tableaux listent les problèmes/entreprises
- [ ] Message d'info au bas explique les calculs

## 🔍 Dépannage

### Erreur: "Cannot find package 'firebase-admin'"
**Solution:** Reconstruire l'image Docker
```bash
docker-compose down
docker image prune -af
docker-compose up --build --no-cache
```

### Erreur: "401 Unauthorized" sur l'API
**Solution:** Vérifier que:
- Le token JWT est valide
- Le header `Authorization: Bearer TOKEN` est correct
- L'utilisateur est authentifié

### Composant ne s'affiche pas
**Solution:** Vérifier:
- Les imports dans `PointsManager.js`
- Les chemins des fichiers
- La console du navigateur pour les erreurs
- Que vous êtes connecté en tant que manager

### Aucune donnée n'apparaît
**Solution:** Vérifier:
- Les points existent dans la base de données
- Au moins un point a une `date_debut`
- Au moins un point terminé a une `date_fin`
- Consulter la réponse brute de l'API:
  ```javascript
  fetch('http://localhost:3000/api/stats/processing-times', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json()).then(console.log)
  ```

## 📊 Test Manuel des Données

Accédez au panneau d'administration des points et:

1. **Créez des points de test:**
   - Point 1: Statut TERMINE, Date début: 2024-01-01, Date fin: 2024-01-31 (30 jours)
   - Point 2: Statut EN_COURS, Date début: 2024-02-01 (48+ jours)

2. **Attendez-vous à voir:**
   - Délai moyen global: ~39 jours
   - Délai pour terminés: ~30 jours
   - Délai pour en cours: ~48+ jours

## 🚀 Cas d'Usage Complets

### Scénario 1: Nouvelle Installation
1. Déployer le code
2. Accéder à `/manager/points`
3. Les statistiques devraient afficher 0 ou "Aucune donnée disponible"
4. Ajouter des points avec dates
5. Rafraîchir - les données apparaissent

### Scénario 2: Mise à Jour Existante
1. Déployer le code
2. Les statistiques s'affichent immédiatement avec les données existantes
3. Aucune modification nécessaire à la base de données

### Scénario 3: Rapport de Performance
1. Accéder à `/manager/points`
2. Voir le délai moyen par entreprise
3. Identifier les entreprises lentes
4. Cliquer sur le lien entreprise pour filtrer les points

## 📝 Logs à Vérifier

### Logs du Backend
```
✅ Associations Sequelize configurées
Error calculating processing times: [any error details]
```

### Logs du Frontend (Console du Navigateur)
```
Chargement des statistiques...
Erreur: [any error message]
```

## ✨ Success Criteria

✅ Tous les tests ci-dessus passent  
✅ La route API retourne les données correctes  
✅ Le composant s'affiche sans erreur  
✅ Les statistiques sont cohérentes avec les données  
✅ L'authentification fonctionne  
✅ Le design est responsive
