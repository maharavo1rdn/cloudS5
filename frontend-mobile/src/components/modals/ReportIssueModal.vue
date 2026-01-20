<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Signaler un problème</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">
            <ion-icon :icon="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="handleSubmit" class="report-form">
        <!-- Titre -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="text" class="label-icon"></ion-icon>
            Titre du signalement
          </label>
          <div class="input-container">
            <ion-input
              v-model="form.nom"
              type="text"
              required
              :disabled="loading"
              placeholder="Ex: Nid de poule avenue principale"
              class="custom-input"
            ></ion-input>
          </div>
        </div>

        <!-- Type de problème -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="alert" class="label-icon"></ion-icon>
            Type de problème
          </label>
          <ion-select
            v-model="form.probleme_id"
            interface="action-sheet"
            placeholder="Sélectionnez un type"
            :disabled="loading"
            class="custom-select"
          >
            <ion-select-option
              v-for="probleme in problemes"
              :key="probleme.id"
              :value="probleme.id"
            >
              {{ probleme.nom }}
            </ion-select-option>
          </ion-select>
        </div>

        <!-- Description -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="document" class="label-icon"></ion-icon>
            Description
          </label>
          <ion-textarea
            v-model="form.description"
            :disabled="loading"
            placeholder="Décrivez le problème..."
            :rows="4"
            class="custom-textarea"
          ></ion-textarea>
        </div>

        <!-- Surface -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="resize" class="label-icon"></ion-icon>
            Surface estimée (m²)
          </label>
          <div class="input-container">
            <ion-input
              v-model.number="form.surface_m2"
              type="number"
              :disabled="loading"
              placeholder="0"
              class="custom-input"
            ></ion-input>
          </div>
        </div>

        <!-- Localisation -->
        <div class="location-info">
          <ion-icon :icon="location" class="location-icon"></ion-icon>
          <div>
            <div class="location-label">Localisation</div>
            <div class="location-coords">
              {{ currentLocation?.lat.toFixed(6) }}, {{ currentLocation?.lng.toFixed(6) }}
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <ion-icon :icon="alertCircle" class="error-icon"></ion-icon>
          <span class="error-text">{{ error }}</span>
        </div>

        <!-- Success Message -->
        <div v-if="success" class="success-message">
          <ion-icon :icon="checkmarkCircle" class="success-icon"></ion-icon>
          <span class="success-text">{{ success }}</span>
        </div>

        <!-- Submit Button -->
        <ion-button
          type="submit"
          expand="block"
          :disabled="loading || !isFormValid"
          class="submit-button"
        >
          <ion-spinner v-if="loading" name="crescent" class="button-spinner"></ion-spinner>
          <span v-else>Signaler</span>
        </ion-button>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonIcon,
} from '@ionic/vue';
import {
  close,
  text,
  alert,
  document,
  resize,
  location,
  alertCircle,
  checkmarkCircle,
} from 'ionicons/icons';
import routeService from '../../services/routeService';
import authService from '../../services/authService';
import { Probleme } from '../../types/route.types';

interface Props {
  isOpen: boolean;
  currentLocation?: { lat: number; lng: number } | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'success']);

const form = ref({
  nom: '',
  description: '',
  probleme_id: '',
  surface_m2: undefined as number | undefined,
});

const problemes = ref<Probleme[]>([]);
const loading = ref(false);
const error = ref('');
const success = ref('');

const isFormValid = computed(() => {
  return (
    form.value.nom.trim() !== '' &&
    form.value.probleme_id !== '' &&
    props.currentLocation !== null
  );
});

onMounted(async () => {
  await loadProblemes();
});

const loadProblemes = async () => {
  try {
    problemes.value = await routeService.getProblemes();
    
    // Si aucun problème n'existe, initialiser les problèmes par défaut
    if (problemes.value.length === 0) {
      await routeService.initializeDefaultProblemes();
      problemes.value = await routeService.getProblemes();
    }
  } catch (err) {
    console.error('Erreur lors du chargement des problèmes:', err);
  }
};

const handleSubmit = async () => {
  if (!isFormValid.value || !props.currentLocation) return;

  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    const userData = await authService.getUserData();
    if (!userData || !userData.localId) {
      throw new Error('Utilisateur non authentifié');
    }

    await routeService.createRoute(
      {
        nom: form.value.nom,
        description: form.value.description,
        probleme_id: form.value.probleme_id,
        latitude: props.currentLocation.lat,
        longitude: props.currentLocation.lng,
        surface_m2: form.value.surface_m2,
      },
      userData.localId
    );

    success.value = 'Signalement créé avec succès !';

    // Réinitialiser le formulaire après 1.5 secondes
    setTimeout(() => {
      emit('success');
      closeModal();
    }, 1500);
  } catch (err) {
    console.error('Erreur lors de la création du signalement:', err);
    error.value =
      err instanceof Error ? err.message : 'Erreur lors de la création du signalement.';
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  form.value = {
    nom: '',
    description: '',
    probleme_id: '',
    surface_m2: undefined,
  };
  error.value = '';
  success.value = '';
  emit('close');
};
</script>

<style scoped>
.report-form {
  width: 100%;
}

ion-toolbar {
  --background: #000000;
  --color: #ffffff;
}

/* Input Styles */
.input-wrapper {
  margin-bottom: 24px;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8px;
}

.label-icon {
  font-size: 18px;
  color: #666666;
}

.input-container {
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.input-container:focus-within {
  border-color: #000000;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05);
}

.custom-input {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --placeholder-color: #9e9e9e;
  --color: #000000;
  font-size: 1rem;
  font-weight: 500;
}

.custom-select {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --placeholder-color: #9e9e9e;
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
}

.custom-textarea {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --placeholder-color: #9e9e9e;
  --color: #000000;
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
}

/* Location Info */
.location-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 12px;
  margin-bottom: 24px;
}

.location-icon {
  font-size: 24px;
  color: #000000;
}

.location-label {
  font-size: 0.85rem;
  color: #666666;
  font-weight: 600;
  margin-bottom: 4px;
}

.location-coords {
  font-size: 0.9rem;
  color: #000000;
  font-family: monospace;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff5f5;
  border: 1px solid #ffebee;
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-icon {
  font-size: 20px;
  color: #d32f2f;
  flex-shrink: 0;
}

.error-text {
  font-size: 0.9rem;
  color: #d32f2f;
  font-weight: 500;
}

/* Success Message */
.success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f1f8f4;
  border: 1px solid #c8e6c9;
  border-radius: 8px;
  margin-bottom: 20px;
}

.success-icon {
  font-size: 20px;
  color: #2e7d32;
  flex-shrink: 0;
}

.success-text {
  font-size: 0.9rem;
  color: #2e7d32;
  font-weight: 500;
}

/* Submit Button */
.submit-button {
  --background: #000000;
  --background-hover: #1a1a1a;
  --background-activated: #2a2a2a;
  --color: #ffffff;
  --border-radius: 12px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 1rem;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
}

.submit-button:hover:not(:disabled) {
  --box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.submit-button:disabled {
  --background: #e0e0e0;
  --color: #9e9e9e;
  opacity: 1;
}

.button-spinner {
  width: 20px;
  height: 20px;
}
</style>
