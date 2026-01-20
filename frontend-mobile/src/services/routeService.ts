import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Route, RoutePoint, Probleme, CreateRouteInput } from '../types/route.types';

class RouteService {
  private readonly ROUTES_COLLECTION = 'routes';
  private readonly POINTS_COLLECTION = 'route_points';
  private readonly PROBLEMES_COLLECTION = 'problemes';

  // Créer un signalement de route
  async createRoute(input: CreateRouteInput, userId: string): Promise<Route> {
    try {
      const routeRef = doc(collection(db, this.ROUTES_COLLECTION));
      
      const route: Route = {
        id: routeRef.id,
        nom: input.nom,
        description: input.description,
        probleme_id: input.probleme_id,
        statut: 'NOUVEAU',
        surface_m2: input.surface_m2,
        date_detection: new Date(),
        avancement_pourcentage: 0,
        created_by: userId,
        created_at: new Date(),
      };

      await setDoc(routeRef, route);

      // Créer le point géographique
      const pointRef = doc(collection(db, this.POINTS_COLLECTION));
      const point: RoutePoint = {
        id: pointRef.id,
        route_id: route.id,
        latitude: input.latitude,
        longitude: input.longitude,
        ordre: 1,
        point_statut: 'A_TRAITER',
        created_at: new Date(),
      };

      await setDoc(pointRef, point);

      return route;
    } catch (error) {
      console.error('Erreur lors de la création du signalement:', error);
      throw new Error('Impossible de créer le signalement');
    }
  }

  // Récupérer tous les signalements
  async getAllRoutes(): Promise<Route[]> {
    try {
      const querySnapshot = await getDocs(
        collection(db, this.ROUTES_COLLECTION)
      );

      const routes: Route[] = [];
      for (const docSnap of querySnapshot.docs) {
        const routeData = docSnap.data();
        
        // Récupérer les points de cette route
        const pointsSnapshot = await getDocs(
          collection(db, this.ROUTES_COLLECTION, docSnap.id, 'points')
        );
        
        const points: RoutePoint[] = pointsSnapshot.docs.map(pointDoc => {
          const pointData = pointDoc.data();
          return {
            id: pointDoc.id,
            route_id: docSnap.id,
            latitude: pointData.latitude,
            longitude: pointData.longitude,
            ordre: pointData.ordre,
            point_statut: pointData.point_statut || 'A_TRAITER',
            created_at: pointData.created_at?.toDate?.() || new Date()
          };
        });
        
        // Récupérer le problème associé
        let probleme: Probleme | undefined;
        if (routeData.probleme_id) {
          const problemeDoc = await getDoc(doc(db, this.PROBLEMES_COLLECTION, routeData.probleme_id.toString()));
          if (problemeDoc.exists()) {
            const pData = problemeDoc.data();
            probleme = {
              id: problemeDoc.id,
              nom: pData.nom,
              description: pData.description,
              created_at: pData.created_at?.toDate?.() || new Date()
            };
          }
        }
        
        routes.push({
          id: docSnap.id,
          nom: routeData.nom || 'Route sans nom',
          description: routeData.description,
          probleme_id: routeData.probleme_id?.toString(),
          probleme: probleme,
          statut: routeData.statut || 'NOUVEAU',
          surface_m2: routeData.surface_m2 || routeData.superficie || 0,
          budget: routeData.budget || 0,
          entreprise_id: routeData.entreprise_id?.toString(),
          date_detection: routeData.date_detection?.toDate?.() || routeData.date_creation?.toDate?.() || new Date(),
          date_debut: routeData.date_debut?.toDate?.(),
          date_fin: routeData.date_fin?.toDate?.(),
          avancement_pourcentage: routeData.avancement_pourcentage || 0,
          points: points,
          created_by: routeData.created_by || routeData.user_id || 'unknown',
          created_at: routeData.created_at?.toDate?.() || new Date()
        });
      }

      return routes;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des signalements:', error);
      return [];
    }
  }

  // Récupérer les points d'une route
  async getRoutePoints(routeId: string): Promise<RoutePoint[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.POINTS_COLLECTION),
          where('route_id', '==', routeId),
          orderBy('ordre', 'asc')
        )
      );

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          created_at: data.created_at?.toDate?.() || new Date(data.created_at),
        } as RoutePoint;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des points:', error);
      return [];
    }
  }

  // Récupérer tous les types de problèmes
  async getProblemes(): Promise<Probleme[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.PROBLEMES_COLLECTION));
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          created_at: data.created_at?.toDate?.() || new Date(data.created_at),
        } as Probleme;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des problèmes:', error);
      return [];
    }
  }

  // Initialiser les types de problèmes par défaut
  async initializeDefaultProblemes(): Promise<void> {
    const defaultProblemes = [
      { nom: 'Nid de poule', description: 'Trou dans la chaussée' },
      { nom: 'Fissure', description: 'Fissure dans le revêtement' },
      { nom: 'Affaissement', description: 'Affaissement de la chaussée' },
      { nom: 'Revêtement dégradé', description: 'Revêtement usé ou abîmé' },
      { nom: 'Signalisation manquante', description: 'Absence de signalisation' },
      { nom: 'Obstacle', description: 'Obstacle sur la chaussée' },
      { nom: 'Inondation', description: 'Accumulation d\'eau' },
      { nom: 'Autre', description: 'Autre type de problème' },
    ];

    try {
      for (const probleme of defaultProblemes) {
        const problemeRef = doc(collection(db, this.PROBLEMES_COLLECTION));
        await setDoc(problemeRef, {
          ...probleme,
          created_at: new Date(),
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des problèmes:', error);
    }
  }

  // Mettre à jour le statut d'une route
  async updateRouteStatus(routeId: string, statut: Route['statut']): Promise<void> {
    try {
      const routeRef = doc(db, this.ROUTES_COLLECTION, routeId);
      await updateDoc(routeRef, { statut });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  // Supprimer un signalement
  async deleteRoute(routeId: string): Promise<void> {
    try {
      // Supprimer les points associés
      const points = await this.getRoutePoints(routeId);
      for (const point of points) {
        await deleteDoc(doc(db, this.POINTS_COLLECTION, point.id));
      }

      // Supprimer la route
      await deleteDoc(doc(db, this.ROUTES_COLLECTION, routeId));
    } catch (error) {
      console.error('Erreur lors de la suppression du signalement:', error);
      throw error;
    }
  }
}

export default new RouteService();
