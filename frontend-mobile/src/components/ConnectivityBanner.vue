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
import { Network } from '@capacitor/network';

const isOnline = ref(true);

onMounted(async () => {
  // Vérifier la connectivité initiale
  const status = await Network.getStatus();
  isOnline.value = status.connected;

  // Écouter les changements de connectivité réseau
  Network.addListener('networkStatusChange', (status) => {
    isOnline.value = status.connected;
  });
});

onUnmounted(() => {
  // Nettoyer les listeners
  Network.removeAllListeners();
});
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
