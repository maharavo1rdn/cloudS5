<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal" class="gallery-modal">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title mode="ios">Photos ({{ images.length }})</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal" class="close-button">
            <ion-icon :icon="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="content-wrapper">

        <!-- État vide -->
        <div v-if="images.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <ion-icon :icon="imagesOutline"></ion-icon>
          </div>
          <h3>Aucune photo</h3>
          <p>Il n'y a pas encore d'images à afficher.</p>
        </div>

        <div v-else class="gallery-layout">
          <!-- Zone Image Principale -->
          <div class="main-stage">

            <!-- Transition pour le changement d'image -->
            <transition name="fade" mode="out-in">
              <div :key="currentIndex" class="image-wrapper">
                <img :src="images[currentIndex].image_url || images[currentIndex].firebase_url"
                  :alt="`Photo ${currentIndex + 1}`" class="main-image" />
              </div>
            </transition>

            <!-- Contrôles flottants (Glassmorphism) -->
            <div v-if="images.length > 1" class="floating-controls">
              <ion-button class="nav-fab prev" @click.stop="previousImage" :disabled="currentIndex === 0">
                <ion-icon :icon="chevronBack"></ion-icon>
              </ion-button>

              <span class="image-badge">
                {{ currentIndex + 1 }} / {{ images.length }}
              </span>

              <ion-button class="nav-fab next" @click.stop="nextImage" :disabled="currentIndex === images.length - 1">
                <ion-icon :icon="chevronForward"></ion-icon>
              </ion-button>
            </div>
          </div>

          <!-- Zone Basse : Infos + Miniatures -->
          <div class="bottom-panel">
            <div class="meta-info">
              <p class="date-badge">
                <ion-icon :icon="calendarOutline"></ion-icon>
                {{ formatDate(images[currentIndex].created_at) }}
              </p>
            </div>

            <!-- Bandeau Miniatures -->
            <div v-if="images.length > 1" class="thumbnails-strip">
              <div v-for="(image, index) in images" :key="index" class="thumb-item"
                :class="{ 'is-active': index === currentIndex }" @click="currentIndex = index">
                <img :src="image.image_url || image.firebase_url" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
} from '@ionic/vue';
import {
  close,
  imagesOutline,
  chevronBack,
  chevronForward,
  calendarOutline,
} from 'ionicons/icons';
import { PointImage } from '../../types/route.types';

interface Props {
  isOpen: boolean;
  images: PointImage[];
  initialIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0,
});

const emit = defineEmits(['close']);
const currentIndex = ref(0);

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    currentIndex.value = props.initialIndex;
  }
});

const closeModal = () => emit('close');

const nextImage = () => {
  if (currentIndex.value < props.images.length - 1) currentIndex.value++;
};

const previousImage = () => {
  if (currentIndex.value > 0) currentIndex.value--;
};

const formatDate = (date: Date | string) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
</script>

<style scoped>
/* --- Configuration Globale --- */
ion-toolbar {
  --background: #ffffff;
  --border-width: 0;
  --color: #111827;
  padding-top: 8px;
}

ion-title {
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.02em;
}

ion-content {
  --background: #f8fafc;
  /* Gris très clair pour le fond */
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gallery-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

/* --- Bouton Fermer --- */
.close-button {
  --color: #374151;
  --background: #f3f4f6;
  --border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-right: 8px;
}

/* --- Zone Image Principale --- */
.main-stage {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  /* Cadre gris pour délimiter l'image */
  margin: 16px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  /* Bordure subtile */
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  /* Espace pour que l'image "respire" */
}

.main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  /* Ombre portée douce sur l'image elle-même */
  filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1));
}

/* --- Contrôles Flottants (Glassmorphism) --- */
.floating-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  padding: 6px 8px;
  border-radius: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
  z-index: 10;
}

.nav-fab {
  --padding-start: 0;
  --padding-end: 0;
  --background: transparent;
  --color: #111827;
  --background-hover: rgba(0, 0, 0, 0.05);
  width: 40px;
  height: 40px;
  margin: 0;
  --border-radius: 50%;
}

.nav-fab:disabled {
  opacity: 0.3;
}

.image-badge {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  min-width: 50px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* --- Panneau du bas --- */
.bottom-panel {
  background: #ffffff;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.03);
}

.meta-info {
  padding: 16px 20px 8px;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #f3f4f6;
  color: #4b5563;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  margin: 0;
}

/* --- Miniatures --- */
.thumbnails-strip {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 12px 20px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  /* Cache la scrollbar mais garde le scroll */
  scrollbar-width: none;
}

.thumbnails-strip::-webkit-scrollbar {
  display: none;
}

.thumb-item {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  scroll-snap-align: start;
  border: 2px solid transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.6;
  position: relative;
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-item.is-active {
  opacity: 1;
  border-color: #3b82f6;
  /* Bleu primaire */
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

/* --- État Vide --- */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  padding: 32px;
  text-align: center;
}

.empty-icon-wrapper {
  background: #e2e8f0;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-state ion-icon {
  font-size: 40px;
  color: #94a3b8;
}

.empty-state h3 {
  color: #1e293b;
  font-weight: 700;
  margin: 0 0 8px;
}

/* --- Animations Vue --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>