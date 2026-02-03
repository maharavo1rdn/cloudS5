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
import { Point, Route, Probleme, Entreprise, CreatePointInput, CreateRouteInput, PointStatut } from '../types/route.types';

class RouteService {
  private readonly POINTS_COLLECTION = 'points';
  private readonly PROBLEMES_COLLECTION = 'problemes';
  private readonly ENTREPRISES_COLLECTION = 'entreprises';

  // Créer un signalement (document dans collection 'points')
  async createRoute(input: CreateRouteInput, userId: string): Promise<Route> {
    try {
      const pointRef = doc(collection(db, this.POINTS_COLLECTION));

      const pointDoc: any = {
        nom: input.nom,
        description: input.description || '',
        probleme_id: input.probleme_id,
        surface_m2: input.surface_m2 || 0,
        budget: input.budget || 0,
        entreprise_id: input.entreprise_id || null,
        date_detection: new Date(),
        date_debut: input.date_debut || null,
        date_fin: input.date_fin || null,
        avancement_pourcentage: input.avancement_pourcentage || 0,
        latitude: input.latitude,
        longitude: input.longitude,
        point_statut: input.point_statut || 'A_FAIRE',
        created_by: userId,
        created_at: new Date()
      };

      await setDoc(pointRef, pointDoc);

      const point: Point = {
        id: pointRef.id,
        nom: pointDoc.nom,
        description: pointDoc.description,
        probleme_id: pointDoc.probleme_id?.toString(),
        probleme: undefined,
        latitude: pointDoc.latitude,
        longitude: pointDoc.longitude,
        point_statut: pointDoc.point_statut as PointStatut,
        surface_m2: pointDoc.surface_m2,
        budget: pointDoc.budget,
        entreprise_id: pointDoc.entreprise_id?.toString(),
        date_detection: pointDoc.date_detection,
        date_debut: pointDoc.date_debut,
        date_fin: pointDoc.date_fin,
        avancement_pourcentage: pointDoc.avancement_pourcentage,
        created_by: userId,
        created_at: pointDoc.created_at
      };

      return point;
    } catch (error) {
      console.error('Erreur lors de la création du signalement:', error);
      throw new Error('Impossible de créer le signalement');
    }
  }

  // Récupérer tous les signalements (points)
  async getAllRoutes(): Promise<Point[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.POINTS_COLLECTION));

      const points: Point[] = [];
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();

        // Récupérer le problème associé
        let probleme: Probleme | undefined;
        if (data.probleme_id) {
          try {
            const problemeDoc = await getDoc(doc(db, this.PROBLEMES_COLLECTION, data.probleme_id.toString()));
            if (problemeDoc.exists()) {
              const pData = problemeDoc.data();
              probleme = {
                id: problemeDoc.id,
                nom: pData.nom,
                description: pData.description,
                created_at: pData.created_at?.toDate?.() || new Date()
              };
            }
          } catch (err) { }
        }

        points.push({
          id: docSnap.id,
          nom: data.nom || 'Signalement',
          description: data.description || '',
          probleme_id: data.probleme_id?.toString(),
          probleme: probleme,
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          point_statut: (data.point_statut as PointStatut) || 'A_FAIRE',
          surface_m2: data.surface_m2 || 0,
          budget: data.budget || 0,
          entreprise_id: data.entreprise_id?.toString(),
          date_detection: data.date_detection?.toDate?.() || new Date(),
          date_debut: data.date_debut?.toDate?.() || null,
          date_fin: data.date_fin?.toDate?.() || null,
          avancement_pourcentage: data.avancement_pourcentage || 0,
          created_by: data.created_by || 'unknown',
          created_at: data.created_at?.toDate?.() || new Date()
        });
      }

      return points;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des signalements:', error);
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

  // Récupérer toutes les entreprises
  async getEntreprises(): Promise<Entreprise[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.ENTREPRISES_COLLECTION));
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          created_at: data.created_at?.toDate?.() || new Date(data.created_at),
        } as Entreprise;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des entreprises:', error);
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

  // Mettre à jour le statut d'un point
  async updateRouteStatus(routeId: string, statut: PointStatut): Promise<void> {
    try {
      const pointRef = doc(db, this.POINTS_COLLECTION, routeId);
      // store status in point_statut field to follow new model
      await updateDoc(pointRef, { point_statut: statut, updated_at: new Date() });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  // Mettre à jour un point
  async updateRoute(routeId: string, updates: Partial<Omit<Point, 'id' | 'created_at' | 'created_by' | 'latitude' | 'longitude'>>): Promise<void> {
    try {
      const pointRef = doc(db, this.POINTS_COLLECTION, routeId);
      const updateData: any = {
        ...updates,
        updated_at: new Date(),
      };
      
      // Nettoyer les valeurs undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      await updateDoc(pointRef, updateData);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la route:', error);
      throw new Error('Impossible de mettre à jour le signalement');
    }
  }

  // Supprimer un signalement
  async deleteRoute(routeId: string): Promise<void> {
    try {
      // For the new model a signalement is a single document in 'points'
      await deleteDoc(doc(db, this.POINTS_COLLECTION, routeId));
    } catch (error) {
      console.error('Erreur lors de la suppression du signalement:', error);
      throw error;
    }
  }
}

export default new RouteService();
