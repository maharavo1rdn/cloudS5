<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Photos ({{ images.length }})</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal" fill="clear">
            <ion-icon :icon="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="images.length === 0" class="empty-state">
        <ion-icon :icon="imagesOutline" class="empty-icon"></ion-icon>
        <p class="empty-text">Aucune photo disponible</p>
      </div>

      <div v-else class="gallery-container">
        <!-- Image principale -->
        <div class="main-image-container">
          <img 
            :src="images[currentIndex].image_url || images[currentIndex].firebase_url" 
            :alt="`Photo ${currentIndex + 1}`"
            class="main-image"
          />
          
          <!-- Navigation -->
          <div v-if="images.length > 1" class="navigation-buttons">
            <ion-button 
              fill="clear" 
              @click="previousImage"
              class="nav-btn nav-prev"
              :disabled="currentIndex === 0"
            >
              <ion-icon :icon="chevronBack" slot="icon-only"></ion-icon>
            </ion-button>
            
            <div class="image-counter">
              {{ currentIndex + 1 }} / {{ images.length }}
            </div>
            
            <ion-button 
              fill="clear" 
              @click="nextImage"
              class="nav-btn nav-next"
              :disabled="currentIndex === images.length - 1"
            >
              <ion-icon :icon="chevronForward" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
        </div>

        <!-- Thumbnails -->
        <div v-if="images.length > 1" class="thumbnails-container">
          <div 
            v-for="(image, index) in images" 
            :key="index"
            class="thumbnail"
            :class="{ active: index === currentIndex }"
            @click="currentIndex = index"
          >
            <img 
              :src="image.image_url || image.firebase_url" 
              :alt="`Miniature ${index + 1}`"
            />
          </div>
        </div>

        <!-- Info -->
        <div class="image-info">
          <p class="image-date">
            <ion-icon :icon="calendarOutline"></ion-icon>
            Ajoutée le {{ formatDate(images[currentIndex].created_at) }}
          </p>
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

const closeModal = () => {
  emit('close');
};

const nextImage = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++;
  }
};

const previousImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};
</script>

<style scoped>
ion-toolbar {
  --background: #0f172a;
  --color: #ffffff;
}

ion-content {
  --background: #1e293b;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
}

.gallery-container {
  max-width: 900px;
  margin: 0 auto;
}

.main-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #0f172a;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.navigation-buttons {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  pointer-events: none;
}

.nav-btn {
  --background: rgba(15, 23, 42, 0.8);
  --color: white;
  --border-radius: 50%;
  width: 48px;
  height: 48px;
  pointer-events: auto;
}

.nav-btn:hover:not(:disabled) {
  --background: rgba(15, 23, 42, 0.95);
}

.nav-btn:disabled {
  --opacity: 0.3;
}

.nav-btn ion-icon {
  font-size: 28px;
}

.image-counter {
  background: rgba(15, 23, 42, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
}

.thumbnails-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0;
  margin-bottom: 16px;
}

.thumbnail {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.thumbnail:hover {
  opacity: 0.9;
  transform: scale(1.05);
}

.thumbnail.active {
  border-color: #3b82f6;
  opacity: 1;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-info {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
}

.image-date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
  font-size: 14px;
  margin: 0;
}

.image-date ion-icon {
  font-size: 18px;
}

@media (max-width: 640px) {
  .main-image-container {
    aspect-ratio: 3 / 4;
    margin-bottom: 16px;
  }

  .nav-btn {
    width: 40px;
    height: 40px;
  }

  .nav-btn ion-icon {
    font-size: 24px;
  }

  .image-counter {
    font-size: 12px;
    padding: 6px 12px;
  }

  .thumbnail {
    width: 60px;
    height: 60px;
  }
}
</style>
