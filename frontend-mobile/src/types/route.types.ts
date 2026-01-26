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

export type PointStatut = 'NOUVEAU' | 'EN_COURS' | 'TERMINE';

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
  
  // Entreprise et dates
  entreprise_id?: string;
  entreprise?: Entreprise; // Populated
  date_detection: Date;
  date_debut?: Date;
  date_fin?: Date;
  
  // État d'avancement
  point_statut: PointStatut;
  avancement_pourcentage: number;
  
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
  entreprise_id?: string;
  date_debut?: Date;
  date_fin?: Date;
  avancement_pourcentage?: number;
}

// Alias pour compatibilité
export type CreateRouteInput = CreatePointInput;
