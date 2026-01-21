<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal" :breakpoints="[0, 0.6, 0.9, 1]" :initial-breakpoint="initialBreakpoint">
    <ion-header>
      <ion-toolbar>
        <ion-title>Nouveau signalement</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal" fill="clear">
            <ion-icon :icon="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding modal-scroll" :scroll-y="true">
      <div class="modal-header">
        <div class="header-icon">
          <ion-icon :icon="warning"></ion-icon>
        </div>
        <h2 class="header-title">Signaler un problème</h2>
        <p class="header-subtitle">Renseignez les détails du problème rencontré</p>
      </div>

      <form @submit.prevent="handleSubmit" class="report-form">
        <!-- Titre -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="documentText" class="label-icon"></ion-icon>
            <span>Titre du signalement</span>
          </label>
          <div class="input-container" :class="{ focused: nomFocused }">
            <ion-input
              v-model="form.nom"
              type="text"
              required
              :disabled="loading"
              placeholder="Ex: Nid de poule route principale"
              @ionFocus="nomFocused = true"
              @ionBlur="nomFocused = false"
            ></ion-input>
          </div>
        </div>

        <!-- Type de problème -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="alert" class="label-icon"></ion-icon>
            <span>Type de problème</span>
          </label>
          <div class="select-container" :class="{ focused: problemeFocused }">
            <ion-select
              v-model="form.probleme_id"
              interface="popover"
              :placeholder="getProblemePlaceholder()"
              :disabled="loading"
              @ionFocus="problemeFocused = true"
              @ionBlur="problemeFocused = false"
            >
              <!-- Options des problèmes -->
              <ion-select-option
                v-for="probleme in problemes"
                :key="probleme.id"
                :value="probleme.id"
              >
                {{ probleme.nom }}
              </ion-select-option>
            </ion-select>
          </div>
        </div>

        <!-- Statut -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="flagOutline" class="label-icon"></ion-icon>
            <span>Statut</span>
          </label>
          <div class="select-container" :class="{ focused: statutFocused }">
            <ion-select
              v-model="form.statut"
              interface="popover"
              :placeholder="getStatutPlaceholder()"
              :disabled="loading"
              @ionFocus="statutFocused = true"
              @ionBlur="statutFocused = false"
            >
              <!-- Options des statuts -->
              <ion-select-option value="NOUVEAU">Nouveau</ion-select-option>
              <ion-select-option value="EN_COURS">En cours</ion-select-option>
              <ion-select-option value="TERMINE">Terminé</ion-select-option>
              <ion-select-option value="ANNULE">Annulé</ion-select-option>
              <ion-select-option value="EN_ATTENTE">En attente</ion-select-option>
            </ion-select>
          </div>
        </div>

        <!-- Description -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="reader" class="label-icon"></ion-icon>
            <span>Description</span>
          </label>
          <div class="textarea-container" :class="{ focused: descriptionFocused }">
            <ion-textarea
              v-model="form.description"
              :disabled="loading"
              placeholder="Décrivez le problème en détail..."
              :rows="4"
              @ionFocus="descriptionFocused = true"
              @ionBlur="descriptionFocused = false"
            ></ion-textarea>
          </div>
        </div>

        <!-- Surface -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="resizeOutline" class="label-icon"></ion-icon>
            <span>Surface estimée (m²)</span>
          </label>
          <div class="input-container" :class="{ focused: surfaceFocused }">
            <ion-input
              v-model.number="form.surface_m2"
              type="number"
              step="0.01"
              :disabled="loading"
              placeholder="0.00"
              @ionFocus="surfaceFocused = true"
              @ionBlur="surfaceFocused = false"
            ></ion-input>
          </div>
        </div>

        <!-- Localisation -->
        <div class="location-info">
          <div class="location-header">
            <ion-icon :icon="locationOutline" class="location-icon"></ion-icon>
            <div class="location-details">
              <div class="location-label">Position du signalement</div>
              <div class="location-coords" v-if="currentLocation">
                {{ currentLocation.lat.toFixed(6) }}, {{ currentLocation.lng.toFixed(6) }}
              </div>
            </div>
          </div>
          <div class="location-hint">
            Les coordonnées ont été capturées automatiquement
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-error">
          <ion-icon :icon="alertCircle"></ion-icon>
          <div class="alert-content">
            <span class="alert-title">Erreur</span>
            <span class="alert-message">{{ error }}</span>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="success" class="alert alert-success">
          <ion-icon :icon="checkmarkCircle"></ion-icon>
          <div class="alert-content">
            <span class="alert-title">Succès</span>
            <span class="alert-message">{{ success }}</span>
          </div>
        </div>

        <!-- Submit Button -->
        <ion-button
          type="submit"
          expand="block"
          :disabled="loading || !isFormValid"
          class="submit-button"
        >
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          <span v-else>Créer le signalement</span>
        </ion-button>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
  documentText,
  alert,
  reader,
  resizeOutline,
  locationOutline,
  alertCircle,
  checkmarkCircle,
  warning,
  flagOutline,
} from 'ionicons/icons';
import routeService from '../../services/routeService';
import authService from '../../services/authService';
import { Probleme, RouteStatut } from '../../types/route.types';

interface Props {
  isOpen: boolean;
  currentLocation?: { lat: number; lng: number } | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'success']);

const form = ref<{
  nom: string;
  description: string;
  probleme_id: string;
  statut: RouteStatut;
  surface_m2: number | undefined;
}>({
  nom: '',
  description: '',
  probleme_id: '',
  statut: 'NOUVEAU',
  surface_m2: undefined,
});

const problemes = ref<Probleme[]>([]);
const loading = ref(false);
const error = ref('');
const success = ref('');
const nomFocused = ref(false);
const problemeFocused = ref(false);
const statutFocused = ref(false);
const descriptionFocused = ref(false);
const surfaceFocused = ref(false);

// Responsive initial breakpoint for the modal (full screen on small devices)
const initialBreakpoint = ref<number>(0.9);
const updateBreakpoint = () => {
  initialBreakpoint.value = window.innerWidth <= 640 ? 1 : 0.9;
};

onMounted(async () => {
  await loadProblemes();
  updateBreakpoint();
  window.addEventListener('resize', updateBreakpoint);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateBreakpoint);
});

// Définir les statuts disponibles
const statutsDisponibles = [
  { value: 'NOUVEAU', label: 'Nouveau' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
  { value: 'EN_ATTENTE', label: 'En attente' },
];

const isFormValid = computed(() => {
  return (
    form.value.nom.trim() !== '' &&
    form.value.probleme_id !== '' &&
    props.currentLocation !== null
  );
});

// Fonction pour obtenir le placeholder du problème
const getProblemePlaceholder = () => {
  if (!form.value.probleme_id) {
    return 'Sélectionnez un type de problème';
  }
  const probleme = problemes.value.find(p => p.id === form.value.probleme_id);
  return probleme ? probleme.nom : 'Sélectionnez un type de problème';
};

// Fonction pour obtenir le placeholder du statut
const getStatutPlaceholder = () => {
  if (!form.value.statut) {
    return 'Sélectionnez un statut';
  }
  const statut = statutsDisponibles.find(s => s.value === form.value.statut);
  return statut ? statut.label : 'Sélectionnez un statut';
};

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
        statut: form.value.statut,
        latitude: props.currentLocation.lat,
        longitude: props.currentLocation.lng,
        surface_m2: form.value.surface_m2,
      },
      userData.localId
    );

    success.value = 'Signalement créé avec succès';

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
    statut: 'NOUVEAU',
    surface_m2: undefined,
  };
  error.value = '';
  success.value = '';
  nomFocused.value = false;
  problemeFocused.value = false;
  statutFocused.value = false;
  descriptionFocused.value = false;
  surfaceFocused.value = false;
  emit('close');
};
</script>

<style scoped>
ion-toolbar {
  --background: #0f172a;
  --color: #ffffff;
  --border-width: 0;
  --padding-top: 12px;
  --padding-bottom: 12px;
}

ion-title {
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.02em;
}

ion-content {
  --background: #f8fafc;
}

.modal-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 16px 0;
}

.header-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.2);
}

.header-icon ion-icon {
  font-size: 32px;
  color: white;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.header-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.report-form {
  max-width: 360px; /* Narrower for mobile screens */
  margin: 0 auto;
  padding: 0 8px;
}

.input-wrapper {
  margin-bottom: 10px; /* Reduced spacing for compact mobile layout */
}

.input-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.input-label ion-icon {
  font-size: 18px;
  color: #64748b;
}

.input-container,
.select-container,
.textarea-container {
  position: relative;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.input-container.focused,
.select-container.focused,
.textarea-container.focused {
  border-color: #0f172a;
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.1);
}

.input-container ion-input,
.select-container ion-select,
.textarea-container ion-textarea {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --placeholder-color: #94a3b8;
  --color: #0f172a;
  font-size: 15px;
  font-weight: 500;
}

.select-container ion-select::part(placeholder) {
  color: #94a3b8;
}

.select-container ion-select::part(text) {
  color: #0f172a;
}

.textarea-container ion-textarea {
  --padding-top: 16px;
  --padding-bottom: 16px;
  min-height: 100px;
}

.location-info {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
}

.location-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.location-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.location-details {
  flex: 1;
}

.location-label {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.location-coords {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  font-family: 'Courier New', monospace;
  letter-spacing: -0.01em;
}

.location-hint {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
  padding-left: 48px;
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  margin-bottom: 20px;
  border: 1px solid;
}

.alert ion-icon {
  font-size: 22px;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.alert-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.alert-message {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.alert-error {
  background: #fef2f2;
  border-color: #fecaca;
}

.alert-error ion-icon {
  color: #dc2626;
}

.alert-error .alert-title {
  color: #991b1b;
}

.alert-error .alert-message {
  color: #b91c1c;
}

.alert-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.alert-success ion-icon {
  color: #16a34a;
}

.alert-success .alert-title {
  color: #14532d;
}

.alert-success .alert-message {
  color: #15803d;
}

.submit-button {
  --background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  --background-hover: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  --color: #ffffff;
  --border-radius: 16px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  --box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  font-size: 15px;
  font-weight: 700;
  text-transform: none;
  letter-spacing: -0.01em;
  margin-top: 8px;
  transition: all 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  --box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);
  transform: translateY(-1px);
}

.submit-button::part(native) {
  transition: all 0.2s ease;
}

.submit-button:disabled {
  --background: #e2e8f0;
  --color: #94a3b8;
  opacity: 1;
  --box-shadow: none;
}

.submit-button ion-spinner {
  width: 20px;
  height: 20px;
}

@media (max-width: 640px) {
  .modal-header {
    padding: 12px 0;
    margin-bottom: 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
  }

  .header-icon ion-icon {
    font-size: 24px;
  }

  .header-title {
    font-size: 18px;
  }

  .header-subtitle {
    font-size: 12px;
  }
}

/* Scroll behaviour for tall forms so users can scroll inside the modal instead of dragging */
.modal-scroll {
  max-height: calc(100vh - 72px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 28px; /* space for floating button */
}

/* Keep forms narrower for a tighter, more professional layout */
@media (min-width: 640px) {
  .report-form { max-width: 520px; }
}

</style>