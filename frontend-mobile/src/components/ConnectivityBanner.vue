<template>
  <div v-if="!isOnline" class="offline-banner">
    <ion-icon :icon="cloudOffline" class="offline-icon"></ion-icon>
    <span class="offline-text">Mode hors ligne - Certaines fonctionnalités peuvent être limitées</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { IonIcon } from '@ionic/vue';
import { cloudOffline } from 'ionicons/icons';
import authService from '../services/authService';

const isOnline = ref(true);
let connectivityCheckInterval: number | null = null;

onMounted(async () => {
  // Vérifier la connectivité initiale
  await checkConnectivity();

  // Vérifier périodiquement la connectivité
  connectivityCheckInterval = window.setInterval(async () => {
    await checkConnectivity();
  }, 30000); // Toutes les 30 secondes
});

onUnmounted(() => {
  if (connectivityCheckInterval) {
    clearInterval(connectivityCheckInterval);
  }
});

const checkConnectivity = async () => {
  try {
    isOnline.value = await authService.checkFirestoreConnectivity();
  } catch (error) {
    isOnline.value = false;
  }
};
</script>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #ff9800;
  color: white;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.offline-icon {
  font-size: 20px;
}

.offline-text {
  font-size: 14px;
  font-weight: 500;
}
</style>
