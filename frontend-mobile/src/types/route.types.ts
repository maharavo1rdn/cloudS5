// Types basés sur le schéma SQL

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

export type RouteStatut = 'NOUVEAU' | 'EN_COURS' | 'TERMINE';
export type PointStatut = 'A_TRAITER' | 'EN_COURS' | 'FINI';

export interface RoutePoint {
  id: string;
  route_id: string;
  latitude: number;
  longitude: number;
  ordre: number;
  point_statut: PointStatut;
  created_at: Date;
}

export interface Route {
  id: string;
  nom: string;
  description?: string;
  
  // Infos sur le problème
  probleme_id: string;
  probleme?: Probleme; // Populated
  statut: RouteStatut;
  surface_m2?: number;
  budget?: number;
  
  // Entreprise et dates
  entreprise_id?: string;
  entreprise?: Entreprise; // Populated
  date_detection: Date;
  date_debut?: Date;
  date_fin?: Date;
  
  // État d'avancement
  avancement_pourcentage: number;
  
  // Points géographiques
  points?: RoutePoint[];
  
  // Métadonnées
  created_by: string; // UID de l'utilisateur Firebase
  created_at: Date;
}

export interface CreateRouteInput {
  nom: string;
  description?: string;
  probleme_id: string;
  statut?: RouteStatut;
  latitude: number;
  longitude: number;
  surface_m2?: number;
}
