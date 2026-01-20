<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Carte des routes</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout">
            <ion-icon :icon="logOut"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="map" ref="mapContainer" class="map-container"></div>
      
      <!-- Floating Action Button pour ajouter un signalement -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="openReportModal">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
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
} from '@ionic/vue';
import { logOut, add } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import authService from '../services/authService';

const router = useRouter();
const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let userMarker: L.Marker | null = null;

onMounted(async () => {
  // Vérifier l'authentification
  const isAuth = await authService.isAuthenticated();
  if (!isAuth) {
    router.replace('/');
    return;
  }

  // Initialiser la carte
  initMap();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

const initMap = () => {
  if (!mapContainer.value) return;

  // Créer la carte centrée sur Antananarivo
  map = L.map(mapContainer.value).setView([-18.8792, 47.5079], 13);

  // Ajouter la couche OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  // Géolocalisation de l'utilisateur
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (map) {
          // Centrer la carte sur la position de l'utilisateur
          map.setView([latitude, longitude], 15);

          // Ajouter un marqueur pour l'utilisateur
          userMarker = L.marker([latitude, longitude], {
            icon: L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
          }).addTo(map);

          userMarker.bindPopup('Vous êtes ici').openPopup();
        }
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
      }
    );
  }
};

const openReportModal = () => {
  // TODO: Ouvrir un modal pour signaler un problème routier
  console.log('Ouvrir le formulaire de signalement');
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

ion-toolbar {
  --background: #000000;
  --color: #ffffff;
}

ion-fab-button {
  --background: #000000;
  --color: #ffffff;
}
</style>
