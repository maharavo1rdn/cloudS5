// Types basés sur le schéma SQL - Table POINTS uniquement

export interface Probleme {
  id: string;
  nom: string;
  description?: string;
  created_at: Date;
}

export interface Entreprise {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  created_at: Date;
}

export type PointStatut = 'A_FAIRE' | 'EN_COURS' | 'TERMINE';

export interface PointImage {
  id: string;
  point_id: string;
  image_url: string;
  firebase_url?: string;
  created_at: Date;
}

export interface PointHisto {
  id: string;
  point_id: string;
  point_statut_id?: number;
  avancement_pourcentage: number;
  date: Date;
}

// Chaque Point = un signalement complet (table points dans la DB)
export interface Point {
  id: string;
  nom: string;
  description?: string;
  
  // Infos sur le problème
  probleme_id: string;
  probleme?: Probleme; // Populated
  
  // Géolocalisation
  latitude: number;
  longitude: number;
  
  // Détails technique
  surface_m2?: number;
  budget?: number;
  niveau?: number | null;
  prix_par_m2?: number | null;
  
  // Entreprise et dates
  entreprise_id?: string;
  entreprise?: Entreprise; // Populated
  date_detection: Date;
  date_debut?: Date;
  date_fin?: Date;
  
  // État d'avancement
  point_statut: PointStatut;
  avancement_pourcentage: number;
  
  // Images et historique
  images?: PointImage[];
  historique?: PointHisto[];
  
  // Métadonnées
  created_by: string;
  created_at: Date;
}

// Alias pour compatibilité UI (Route = Point)
export type Route = Point;
export type RouteStatut = PointStatut;

export interface CreatePointInput {
  nom: string;
  description?: string;
  probleme_id: string;
  point_statut?: PointStatut;
  latitude: number;
  longitude: number;
  surface_m2?: number;
  budget?: number;
  niveau?: number | null;
  prix_par_m2?: number | null;
  entreprise_id?: string;
  date_debut?: Date;
  date_fin?: Date;
  avancement_pourcentage?: number;
  images?: Blob[]; // Blobs pour l'upload
}

// Alias pour compatibilité
export type CreateRouteInput = CreatePointInput;
