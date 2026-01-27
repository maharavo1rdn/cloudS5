<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <!-- Toolbar Principale -->
      <ion-toolbar color="primary">
        <ion-title>Gestion des Routes</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="isManager" @click="openRegisterModal" fill="clear">
            <ion-icon :icon="personAdd" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button v-if="isManager" @click="syncData" :disabled="isLoadingRoutes" fill="clear" title="Synchroniser les données">
            <ion-icon v-if="!isLoadingRoutes" :icon="refreshCircle" slot="icon-only"></ion-icon>
            <ion-spinner v-else name="crescent" slot="icon-only"></ion-spinner>
          </ion-button>
          <ion-button v-if="isManager" @click="showBlockedModal = true" fill="clear" title="Utilisateurs bloqués">
            <ion-icon :icon="warning" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button @click="showStatsModal = true" fill="clear" title="Statistiques">
            <ion-icon :icon="statsChart" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button @click="handleLogout" fill="clear">
            <ion-icon :icon="logOut" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>    
      </ion-toolbar>

      <!-- Toolbar Secondaire (Filtres) - Intégrée dans le header pour la visibilité -->
      <ion-toolbar class="filter-toolbar">
        <div class="toolbar-actions-wrapper">
          <div class="view-toggle">
            <ion-button 
              :fill="viewMode === 'map' ? 'solid' : 'outline'"
              size="small"
              @click="viewMode = 'map'"
              class="toggle-btn"
            >
              <ion-icon :icon="mapIcon" slot="start"></ion-icon>
              Carte
            </ion-button>
            <ion-button 
              :fill="viewMode === 'list' ? 'solid' : 'outline'"
              size="small"
              @click="viewMode = 'list'"
              class="toggle-btn"
            >
              <ion-icon :icon="list" slot="start"></ion-icon>
              Liste
            </ion-button>
          </div>
          <ion-button 
            :fill="showOnlyMyReports ? 'solid' : 'outline'"
            size="small"
            @click="toggleMyReports"
            class="filter-btn"
            :aria-pressed="showOnlyMyReports"
          >
            <ion-icon :icon="person" slot="start"></ion-icon>
            {{ showOnlyMyReports ? 'Tous les signalements' : 'Mes signalements' }}
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ConnectivityBanner />
      
      <!-- Barre de statut flottante sur la carte -->
      <div class="status-bar" :class="`status-${geolocationStatus}`">
        <div class="status-content">
          <div class="status-icon">
            <ion-icon 
              v-if="geolocationStatus === 'loading'" 
              :icon="locate" 
              class="rotating"
            ></ion-icon>
            <ion-icon 
              v-else-if="geolocationStatus === 'success'" 
              :icon="locate"
            ></ion-icon>
            <ion-icon 
              v-else
              :icon="warning"
            ></ion-icon>
          </div>
          <div class="status-info">
            <span class="status-label">
              {{ geolocationStatus === 'loading' ? 'Localisation en cours' : 
                 geolocationStatus === 'success' ? 'Position actuelle détectée' : 
                 'Utilisation de la position centrale' }}
            </span>
            <span v-if="currentLocation" class="status-coords">
              {{ currentLocation.lat.toFixed(4) }}, {{ currentLocation.lng.toFixed(4) }}
            </span>
          </div>
        </div>
      </div>
      
      <div v-show="viewMode === 'map'" id="map" ref="mapContainer" class="map-container"></div>
      
      <!-- Vue Liste -->
      <div v-show="viewMode === 'list'" class="list-container">
        <div v-if="filteredRoutes.length === 0" class="empty-state">
          <div class="empty-icon">
            <ion-icon :icon="documentOutline"></ion-icon>
          </div>
          <h3 class="empty-title">Aucun signalement</h3>
          <p class="empty-text">
            {{ showOnlyMyReports ? 'Vous n\'avez créé aucun signalement pour le moment' : 'Aucun signalement disponible' }}
          </p>
        </div>
        
        <div v-else class="routes-list">
          <div 
            v-for="route in filteredRoutes" 
            :key="route.id"
            class="route-card"
            @click="selectRoute(route)"
          >
            <div class="route-card-header" :style="{ background: getStatusConfig(route.point_statut).gradient }">
              <div class="route-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                  <path :d="getIconPathForStatus(route.point_statut)"/>
                </svg>
              </div>
              <div class="route-card-title-section">
                <h3 class="route-card-title">{{ route.probleme?.nom || 'Signalement' }}</h3>
                <span class="route-card-date">{{ formatDate(route.date_detection) }}</span>
              </div>
            </div>
            
            <div class="route-card-body">
              <div class="route-card-field">
                <span class="field-label">Titre</span>
                <span class="field-value">{{ route.nom }}</span>
              </div>
              
              <div v-if="route.description" class="route-card-field">
                <span class="field-label">Description</span>
                <span class="field-value">{{ route.description }}</span>
              </div>
              
              <div class="route-card-field">
                <span class="field-label">Statut</span>
                <span class="status-badge-inline" :style="{ background: getStatusConfig(route.point_statut).gradient }">
                  {{ getStatusConfig(route.point_statut).label }}
                </span>
              </div>

              <div v-if="route.entreprise" class="route-card-field">
                <span class="field-label">Entreprise</span>
                <span class="field-value">{{ route.entreprise.nom }}</span>
              </div>
              
              <div v-if="route.surface_m2" class="route-card-field">
                <span class="field-label">Surface</span>
                <span class="field-value">{{ route.surface_m2 }} m²</span>
              </div>
              
              <div v-if="route.latitude && route.longitude" class="route-card-field">
                <span class="field-label">Position</span>
                <span class="field-value coords">{{ route.latitude.toFixed(6) }}, {{ route.longitude.toFixed(6) }}</span>
              </div>
            </div>
            
            <div v-if="isManager" class="route-card-footer">
              <ion-button 
                size="small" 
                fill="outline"
                @click.stop="openEditModal(route)"
                class="edit-btn"
              >
                <ion-icon :icon="pencil" slot="start"></ion-icon>
                Modifier
              </ion-button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="isLoadingRoutes" class="loading-overlay">
        <div class="loading-card">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <span class="loading-text">Chargement des signalements</span>
          <span class="loading-subtext">Veuillez patienter...</span>
        </div>
      </div>
      
      <div class="stats-panel">
        <div class="stat-item">
          <div class="stat-icon stat-new">
            <ion-icon :icon="alertCircle"></ion-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ routesByStatus.NOUVEAU }}</span>
            <span class="stat-label">Nouveaux</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon stat-progress">
            <ion-icon :icon="construct"></ion-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ routesByStatus.EN_COURS }}</span>
            <span class="stat-label">En cours</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon stat-done">
            <ion-icon :icon="checkmarkCircle"></ion-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ routesByStatus.TERMINE }}</span>
            <span class="stat-label">Terminés</span>
          </div>
        </div>
      </div>
      
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="openReportModal">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <RegisterUserModal :is-open="showRegisterModal" @close="closeRegisterModal" />
    
    <ReportIssueModal 
      :is-open="showReportModal" 
      :current-location="clickedLocation || currentLocation"
      @close="closeReportModal"
      @success="onReportSuccess"
    />
    
    <EditRouteModal 
      v-if="isManager"
      :is-open="showEditModal" 
      :route="selectedRoute"
      @close="closeEditModal"
      @success="onEditSuccess"
    />

    <ResetAttemptsModal
      v-if="isManager"
      :is-open="showResetModal"
      @close="showResetModal = false"
      @success="showResetModal = false"
    />

    <BlockedUsersModal
      v-if="isManager"
      :is-open="showBlockedModal"
      @close="showBlockedModal = false"
      @success="showBlockedModal = false"
    />

    <StatisticsModal
      :is-open="showStatsModal"
      :routes="routes"
      @close="showStatsModal = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
} from '@ionic/vue';
import { logOut, add, personAdd, locate, warning, alertCircle, construct, checkmarkCircle, map as mapIcon, list, person, documentOutline, pencil, refreshCircle, statsChart } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import authService from '../services/authService';
import routeService from '../services/routeService';
import RegisterUserModal from '../components/modals/RegisterUserModal.vue';
import ReportIssueModal from '../components/modals/ReportIssueModal.vue';
import EditRouteModal from '../components/modals/EditRouteModal.vue';
import ResetAttemptsModal from '../components/modals/ResetAttemptsModal.vue';
import BlockedUsersModal from '../components/modals/BlockedUsersModal.vue';
import StatisticsModal from '../components/modals/StatisticsModal.vue';
import ConnectivityBanner from '../components/ConnectivityBanner.vue';
import { Route } from '../types/route.types';

const router = useRouter();
const mapContainer = ref<HTMLElement | null>(null);
const isManager = ref(false);
const showRegisterModal = ref(false);
const showReportModal = ref(false);
const showEditModal = ref(false);
const showResetModal = ref(false);
const showBlockedModal = ref(false);
const showStatsModal = ref(false);
const selectedRoute = ref<Route | null>(null);
const currentLocation = ref<{ lat: number; lng: number } | null>(null);
const clickedLocation = ref<{ lat: number; lng: number } | null>(null);
const routes = ref<Route[]>([]);
const isLoadingRoutes = ref(false);
const viewMode = ref<'map' | 'list'>('map');
const showOnlyMyReports = ref(false);
const currentUserId = ref<string>('');
let map: L.Map | null = null;
let userMarker: L.Marker | null = null;
let routeMarkers: L.Marker[] = [];
const geolocationStatus = ref<'loading' | 'success' | 'error' | 'default'>('loading');

const filteredRoutes = computed(() => {
  if (!showOnlyMyReports.value) {
    return routes.value;
  }
  return routes.value.filter(r => r.created_by === currentUserId.value);
});

const routesByStatus = computed(() => {
  const routesToCount = filteredRoutes.value;
  return {
    NOUVEAU: routesToCount.filter(r => r.point_statut === 'NOUVEAU').length,
    EN_COURS: routesToCount.filter(r => r.point_statut === 'EN_COURS').length,
    TERMINE: routesToCount.filter(r => r.point_statut === 'TERMINE').length,
  };
});

onMounted(async () => {
  const isAuth = await authService.isAuthenticated();
  if (!isAuth) {
    router.replace('/');
    return;
  }

  isManager.value = await authService.isManager();
  const userData = await authService.getUserData();
  if (userData && userData.localId) {
    currentUserId.value = userData.localId;
  }
  initMap();
  await loadRoutes();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

const initMap = () => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value).setView([-18.8792, 47.5079], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(map);

  // Capture des clics sur la carte
  map.on('click', (e: L.LeafletMouseEvent) => {
    clickedLocation.value = {
      lat: e.latlng.lat,
      lng: e.latlng.lng
    };
    // Ouvrir automatiquement le modal de signalement
    openReportModal();
  });

  geolocationStatus.value = 'loading';
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        currentLocation.value = { lat: latitude, lng: longitude };
        geolocationStatus.value = 'success';
        
        if (map) {
          map.setView([latitude, longitude], 15);

          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div class="pulse-ring"></div>
              <div class="user-dot"></div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userMarker = L.marker([latitude, longitude], {
            icon: userIcon,
          }).addTo(map);

          userMarker.bindPopup(`
            <div class="location-popup">
              <div class="popup-title">Votre position</div>
              <div class="popup-coords">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</div>
            </div>
          `);
        }
      },
      () => {
        geolocationStatus.value = 'default';
        currentLocation.value = { lat: -18.8792, lng: 47.5079 };
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  } else {
    geolocationStatus.value = 'default';
    currentLocation.value = { lat: -18.8792, lng: 47.5079 };
  }
};

const openReportModal = () => {
  // Si on a un clic sur la carte, utiliser ces coordonnées
  // Sinon utiliser la position actuelle de l'utilisateur
  if (!clickedLocation.value && !currentLocation.value) {
    currentLocation.value = { lat: -18.8792, lng: 47.5079 };
  }
  showReportModal.value = true;
};

const closeReportModal = () => {
  showReportModal.value = false;
  // Réinitialiser les coordonnées du clic
  clickedLocation.value = null;
};

const onReportSuccess = async () => {
  showReportModal.value = false;
  await loadRoutes();
};

const loadRoutes = async () => {
  try {
    isLoadingRoutes.value = true;
    routes.value = await routeService.getAllRoutes();
    displayRouteMarkers();
  } catch (error) {
    console.error('Erreur chargement:', error);
    routes.value = [];
  } finally {
    isLoadingRoutes.value = false;
  }
};

const syncData = async () => {
  try {
    // Reload routes and refresh UI
    await loadRoutes();
  } catch (err) {
    console.error('Erreur de synchronisation:', err);
  }
};

const displayRouteMarkers = () => {
  if (!map) return;
  
  routeMarkers.forEach(marker => marker.remove());
  routeMarkers = [];
  
  // Use filteredRoutes so markers reflect current filter (mes signalements)
  filteredRoutes.value.forEach(route => {
    if (!map || !route.latitude || !route.longitude) return;
    
    const statusConfig = {
      NOUVEAU: { 
        color: '#ef4444', 
        icon: 'alert-circle',
        label: 'NOUVEAU',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      },
      EN_COURS: { 
        color: '#f59e0b', 
        icon: 'construct',
        label: 'EN COURS',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      },
      TERMINE: { 
        color: '#10b981', 
        icon: 'checkmark-circle',
        label: 'TERMINÉ',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      }
    };
    
    const config = statusConfig[route.point_statut] || statusConfig.NOUVEAU;
    
    const marker = L.marker([route.latitude, route.longitude], {
      icon: L.divIcon({
        className: 'route-marker',
        html: `
          <div class="marker-container">
            <div class="marker-pin" style="background: ${config.gradient};">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                ${getIconPath(config.icon)}
              </svg>
            </div>
            <div class="marker-pulse" style="border-color: ${config.color};"></div>
          </div>
        `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })
    }).addTo(map);
    
    const statusBadge = `<span class="status-badge" style="background: ${config.gradient};">${config.label}</span>`;
    
    const popupContent = `
      <div class="route-popup">
        <div class="popup-header" style="background: ${config.gradient};">
          <h3>${route.probleme?.nom || 'Signalement'}</h3>
        </div>
        <div class="popup-body">
          <div class="popup-status">${statusBadge}</div>
          ${route.description ? `
            <div class="popup-section">
              <div class="section-label">Description</div>
              <div class="section-value">${route.description}</div>
            </div>
          ` : ''}
          ${route.entreprise ? `
            <div class="popup-section">
              <div class="section-label">Entreprise</div>
              <div class="section-value">${route.entreprise.nom}</div>
            </div>
          ` : ''}

          ${route.budget ? `
            <div class="popup-metric">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1v22" />
                <path d="M17 5H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H7" />
              </svg>
              <div>
                <div class="metric-label">Budget estimé</div>
                <div class="metric-value">${route.budget.toLocaleString('fr-FR')} Ar</div>
              </div>
            </div>
          ` : ''}

          ${route.surface_m2 ? `
            <div class="popup-metric">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              <div>
                <div class="metric-label">Superficie</div>
                <div class="metric-value">${route.surface_m2} m²</div>
              </div>
            </div>
          ` : ''}

          <div class="popup-metric">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <div>
              <div class="metric-label">Date de détection</div>
              <div class="metric-value">${route.date_detection instanceof Date ? route.date_detection.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</div>
            </div>
          </div>

          ${route.date_debut ? `
            <div class="popup-metric">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 7V3h8v4" />
                <rect x="3" y="5" width="18" height="16" rx="2" />
              </svg>
              <div>
                <div class="metric-label">Début des travaux</div>
                <div class="metric-value">${route.date_debut instanceof Date ? route.date_debut.toLocaleDateString('fr-FR') : 'N/A'}</div>
              </div>
            </div>
          ` : ''}

          ${route.date_fin ? `
            <div class="popup-metric">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 17v4h8v-4" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              <div>
                <div class="metric-label">Fin des travaux</div>
                <div class="metric-value">${route.date_fin instanceof Date ? route.date_fin.toLocaleDateString('fr-FR') : 'N/A'}</div>
              </div>
            </div>
          ` : ''}

          ${route.avancement_pourcentage ? `
            <div class="popup-section">
              <div class="section-label">Avancement</div>
              <div class="section-value"><div class="popup-progress"><div class="popup-progress-fill" style="width: ${route.avancement_pourcentage}%"></div></div> ${route.avancement_pourcentage}%</div>
            </div>
          ` : ''}
        </div>
        ${isManager.value ? `
          <div class="popup-footer">
            <button class="popup-edit-btn" data-route-id="${route.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Modifier
            </button>
          </div>
        ` : ''}
      </div>
    `;
    
    marker.bindPopup(popupContent, {
      maxWidth: 320,
      className: 'custom-popup'
    });
    
    // Ajouter un event listener pour le bouton d'édition
    marker.on('popupopen', () => {
      const editBtn = document.querySelector(`[data-route-id="${route.id}"]`);
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          openEditModal(route);
        });
      }
    });
    
    routeMarkers.push(marker);
  });
};

// Watch filteredRoutes so map markers update when the filter toggles
watch(filteredRoutes, (newVal, oldVal) => {
  displayRouteMarkers();
});

const getIconPath = (iconName: string): string => {
  const icons: Record<string, string> = {
    'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    'construct': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    'checkmark-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
  };
  return icons[iconName] || icons['alert-circle'];
};

const openRegisterModal = () => {
  showRegisterModal.value = true;
};

const closeRegisterModal = () => {
  showRegisterModal.value = false;
};

const toggleMyReports = () => {
  showOnlyMyReports.value = !showOnlyMyReports.value;
};

const selectRoute = (route: Route) => {
  if (viewMode.value === 'list' && route.latitude && route.longitude) {
    viewMode.value = 'map';
    setTimeout(() => {
      if (map) {
        map.setView([route.latitude, route.longitude], 17);
        routeMarkers.forEach(marker => {
          const markerLatLng = marker.getLatLng();
          if (markerLatLng.lat === route.latitude && markerLatLng.lng === route.longitude) {
            marker.openPopup();
          }
        });
      }
    }, 100);
  }
};

const openEditModal = (route: Route) => {
  selectedRoute.value = route;
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedRoute.value = null;
};

const onEditSuccess = async () => {
  showEditModal.value = false;
  selectedRoute.value = null;
  await loadRoutes();
};

const formatDate = (date: Date | undefined): string => {
  if (!date || !(date instanceof Date)) return 'N/A';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getStatusConfig = (statut: string) => {
  const configs: any = {
    NOUVEAU: { 
      color: '#ef4444', 
      icon: 'alert-circle',
      label: 'NOUVEAU',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    },
    EN_COURS: { 
      color: '#f59e0b', 
      icon: 'construct',
      label: 'EN COURS',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    TERMINE: { 
      color: '#10b981', 
      icon: 'checkmark-circle',
      label: 'TERMINÉ',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }
  };
  return configs[statut] || configs.NOUVEAU;
};

const getIconPathForStatus = (statut: string): string => {
  const paths: Record<string, string> = {
    NOUVEAU: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6v-4m0-4h.01',
    EN_COURS: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    TERMINE: 'M22 11.08V12a10 10 0 1 1-5.93-9.14m0 0L22 4 12 14.01 9 11.01'
  };
  return paths[statut] || paths.NOUVEAU;
};

const handleLogout = async () => {
  await authService.logout();
  router.replace('/');
};
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}

/* Header Styles */
ion-toolbar {
  --background: #0f172a;
  --color: #ffffff;
  --border-width: 0;
}

.filter-toolbar {
  --background: #0f172a;
  --min-height: 50px;
  padding-bottom: 8px;
}

ion-title {
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.02em;
}

/* Toolbar Actions Wrapper - intégré au header */
.toolbar-actions-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  width: 100%;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px;
  border-radius: 12px;
}

.toggle-btn,
.filter-btn {
  --border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
  font-size: 12px;
  font-weight: 600;
  height: 32px;
  margin: 0;
  text-transform: none;
  letter-spacing: -0.01em;
}

.toggle-btn[fill="solid"] {
  --background: white;
  --color: #0f172a;
}

.toggle-btn[fill="outline"] {
  --border-color: transparent;
  --color: #94a3b8;
}

/* Bouton Filtre (Mes signalements) */
.filter-btn {
  background: transparent;
}

.filter-btn[fill="solid"] {
  --background: white;
  --color: #0f172a;
  --box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.filter-btn[fill="outline"] {
  --border-color: rgba(255, 255, 255, 0.3);
  --color: white;
}

/* FAB */
ion-fab-button {
  --background: #0f172a;
  --color: #ffffff;
  --box-shadow: 0 8px 16px rgba(15, 23, 42, 0.3);
}

ion-fab-button:hover {
  --background: #1e293b;
}

/* Status Bar - Ajusté */
.status-bar {
  position: absolute;
  top: 16px; /* Remonté car il n'est plus gêné par les filtres */
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 90%;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.status-loading .status-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.status-success .status-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.status-error .status-icon,
.status-default .status-icon {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
}

.status-icon ion-icon {
  font-size: 18px;
  color: white;
}

.rotating {
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-label {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.status-coords {
  font-size: 11px;
  color: #64748b;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.loading-card {
  background: white;
  padding: 32px 40px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-card ion-spinner {
  width: 48px;
  height: 48px;
}

.loading-text {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.loading-subtext {
  font-size: 13px;
  color: #64748b;
}

.stats-panel {
  position: absolute;
  bottom: 24px;
  left: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 140px;
  transition: all 0.2s;
}

.stat-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon ion-icon {
  font-size: 20px;
  color: white;
}

.stat-new {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.stat-progress {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-done {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.list-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #f8fafc;
  padding: 16px; /* Réduit car le header prend maintenant l'espace naturellement */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-icon ion-icon {
  font-size: 40px;
  color: #94a3b8;
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.empty-text {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  max-width: 320px;
  line-height: 1.5;
}

.routes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.route-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  cursor: pointer;
}

.route-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.route-card-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.route-card-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.route-card-title-section {
  flex: 1;
  min-width: 0;
}

.route-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-card-date {
  font-size: 12px;
  opacity: 0.9;
  font-weight: 500;
}

.route-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-card-field {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.field-value {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  text-align: right;
  word-break: break-word;
}

.field-value.coords {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #64748b;
}

.status-badge-inline {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.route-card-footer {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.edit-btn {
  --border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
  --border-color: #0f172a;
  --color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: -0.01em;
}

:deep(.user-location-marker) {
  background: transparent;
  border: none;
}

:deep(.pulse-ring) {
  width: 24px;
  height: 24px;
  border: 3px solid #3b82f6;
  border-radius: 50%;
  position: absolute;
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

:deep(.user-dot) {
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border: 3px solid white;
  border-radius: 50%;
  position: absolute;
  top: 6px;
  left: 6px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

:deep(.route-marker) {
  background: transparent;
  border: none;
}

:deep(.marker-container) {
  position: relative;
  width: 32px;
  height: 32px;
}

:deep(.marker-pin) {
  width: 32px;
  height: 32px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: all 0.3s;
  position: relative;
  z-index: 2;
}

:deep(.marker-pin svg) {
  transform: rotate(45deg);
}

:deep(.marker-pin:hover) {
  transform: rotate(-45deg) scale(1.15);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

:deep(.marker-pulse) {
  width: 32px;
  height: 32px;
  border: 2px solid;
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 0;
  animation: marker-pulse 2s ease-out infinite;
  z-index: 1;
}

@keyframes marker-pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

:deep(.custom-popup .leaflet-popup-content-wrapper) {
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

:deep(.custom-popup .leaflet-popup-tip) {
  display: none;
}

:deep(.custom-popup .leaflet-popup-content) {
  margin: 0;
  width: auto !important;
}

:deep(.route-popup) {
  min-width: 280px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

:deep(.popup-header) {
  padding: 16px;
  color: white;
}

:deep(.popup-header h3) {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

:deep(.popup-body) {
  padding: 16px;
}

:deep(.popup-status) {
  margin-bottom: 16px;
}

:deep(.status-badge) {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(.popup-section) {
  margin-bottom: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #0f172a;
}

:deep(.section-label) {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

:deep(.section-value) {
  font-size: 13px;
  color: #0f172a;
  line-height: 1.5;
}

:deep(.popup-metric) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #e2e8f0;
}

:deep(.popup-metric:first-of-type) {
  border-top: none;
  padding-top: 0;
}

:deep(.popup-metric svg) {
  color: #64748b;
  flex-shrink: 0;
}

:deep(.metric-label) {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 2px;
}

:deep(.metric-value) {
  font-size: 13px;
}

:deep(.popup-progress) {
  width: 100%;
  background: #f1f5f9;
  border-radius: 8px;
  height: 8px;
  margin-top: 6px;
  overflow: hidden;
}

:deep(.popup-progress-fill) {
  height: 100%;
  background: linear-gradient(90deg, #0f172a 0%, #2563eb 100%);
  border-radius: 8px;
}

:deep(.popup-metric .metric-value) {
  font-weight: 700;
}

:deep(.location-popup) {
  padding: 12px;
  min-width: 200px;
}

:deep(.popup-title) {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 6px;
}

:deep(.popup-coords) {
  font-size: 12px;
  color: #64748b;
  font-family: 'Courier New', monospace;
}

:deep(.popup-footer) {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

:deep(.popup-edit-btn) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 2px solid #0f172a;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.popup-edit-btn:hover) {
  background: #0f172a;
  color: white;
}

:deep(.popup-edit-btn svg) {
  width: 16px;
  height: 16px;
}

@media (max-width: 640px) {
  .stats-panel {
    left: 8px;
    bottom: 80px;
  }

  .stat-item {
    min-width: 120px;
    padding: 10px 12px;
  }

  .stat-value {
    font-size: 18px;
  }

  /* Mobile-specific adjustments */
  @media (max-width: 640px) {
    .route-card-header { padding: 12px; gap: 8px; }
    .route-card-icon { width: 36px; height: 36px; }
    .route-card-title { font-size: 15px; white-space: normal; }
    .route-card-body { padding: 12px; gap: 8px; }
    .route-card-field { flex-direction: column; align-items: flex-start; gap: 6px; }
    .field-value { text-align: left; }
  }

  @media (max-width: 360px) {
    .stat-item { min-width: 0; padding: 8px 10px; }
    .stat-value { font-size: 16px; }
    .stats-panel { left: 8px; bottom: 120px; }
  }
}
</style>
