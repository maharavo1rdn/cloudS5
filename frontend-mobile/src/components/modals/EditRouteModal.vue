<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal" :breakpoints="[0, 0.6, 0.9, 1]" :initial-breakpoint="0.95" :swipeToClose="false">
    <ion-header>
      <ion-toolbar>
        <ion-title>Modifier le signalement</ion-title>
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
          <ion-icon :icon="pencil"></ion-icon>
        </div>
        <h2 class="header-title">Modification du signalement</h2>
        <p class="header-subtitle">Mettez à jour les informations du signalement</p>
      </div>

      <form @submit.prevent="handleSubmit" class="edit-form">
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
              interface="alert"
              :placeholder="getProblemePlaceholder()"
              :disabled="loading"
              @ionFocus="problemeFocused = true"
              @ionBlur="problemeFocused = false"
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
        </div>

        <!-- Statut -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="flagOutline" class="label-icon"></ion-icon>
            <span>Statut</span>
          </label>
          <div class="select-container" :class="{ focused: statutFocused }">
            <ion-select
              v-model="form.point_statut"
              interface="alert"
              :placeholder="getStatutPlaceholder()"
              :disabled="loading"
              @ionFocus="statutFocused = true"
              @ionBlur="statutFocused = false"
            >
              <ion-select-option value="NOUVEAU">Nouveau</ion-select-option>
              <ion-select-option value="EN_COURS">En cours</ion-select-option>
              <ion-select-option value="TERMINE">Terminé</ion-select-option>
            </ion-select>
          </div>
          <div class="status-hint">
            <ion-icon :icon="informationCircle"></ion-icon>
            <span>Modifiez le statut pour suivre l'avancement de la réparation</span>
          </div>
        </div>

        <!-- Entreprise -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="businessOutline" class="label-icon"></ion-icon>
            <span>Entreprise</span>
          </label>
          <div class="select-container" :class="{ focused: entrepriseFocused }">
            <ion-select
              v-model="form.entreprise_id"
              interface="alert"
              :disabled="loading"
              @ionFocus="entrepriseFocused = true"
              @ionBlur="entrepriseFocused = false"
            >
              <ion-select-option :value="''">Aucune</ion-select-option>
              <ion-select-option v-for="e in entreprises" :key="e.id" :value="e.id">{{ e.nom }}</ion-select-option>
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

        <!-- Budget -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="cashOutline" class="label-icon"></ion-icon>
            <span>Budget estimé (Ar)</span>
          </label>
          <div class="input-container" :class="{ focused: budgetFocused }">
            <ion-input
              v-model.number="form.budget"
              type="number"
              step="0.01"
              :disabled="loading"
              placeholder="0.00"
              @ionFocus="budgetFocused = true"
              @ionBlur="budgetFocused = false"
            ></ion-input>
          </div>
        </div>

        <!-- Date début (Manager only) -->
        <div v-if="isManager" class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="calendarOutline" class="label-icon"></ion-icon>
            <span>Date de début des travaux</span>
          </label>
          <div class="input-container" :class="{ focused: dateDebutFocused }">
            <ion-input
              v-model="form.date_debut"
              type="date"
              :disabled="loading"
              @ionFocus="dateDebutFocused = true"
              @ionBlur="dateDebutFocused = false"
            ></ion-input>
          </div>
        </div>

        <!-- Date fin (Manager only) -->
        <div v-if="isManager" class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="calendarOutline" class="label-icon"></ion-icon>
            <span>Date de fin des travaux</span>
          </label>
          <div class="input-container" :class="{ focused: dateFinFocused }">
            <ion-input
              v-model="form.date_fin"
              type="date"
              :disabled="loading"
              @ionFocus="dateFinFocused = true"
              @ionBlur="dateFinFocused = false"
            ></ion-input>
          </div>
        </div>

        <!-- Avancement (Manager only) -->
        <div v-if="isManager" class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="statsChart" class="label-icon"></ion-icon>
            <span>Avancement (%)</span>
          </label>
          <div class="input-container" :class="{ focused: avancementFocused }">
            <ion-input
              v-model.number="form.avancement_pourcentage"
              type="number"
              min="0"
              max="100"
              :disabled="loading"
              placeholder="0"
              @ionFocus="avancementFocused = true"
              @ionBlur="avancementFocused = false"
            ></ion-input>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: form.avancement_pourcentage + '%' }"></div>
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
          <span v-else>Enregistrer les modifications</span>
        </ion-button>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
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
  alertCircle,
  checkmarkCircle,
  pencil,
  flagOutline,
  informationCircle,
  cashOutline,
  calendarOutline,
  statsChart,
  businessOutline,
} from 'ionicons/icons';
import routeService from '../../services/routeService';
import authService from '../../services/authService';
import { Probleme, PointStatut, Route, Entreprise } from '../../types/route.types';

const entreprises = ref<Entreprise[]>([]);

interface Props {
  isOpen: boolean;
  route: Route | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'success']);

const form = ref<{
  nom: string;
  description: string;
  probleme_id: string;
  point_statut: PointStatut;
  surface_m2: number | undefined;
  budget: number | undefined;
  date_debut: string;
  date_fin: string;
  avancement_pourcentage: number;
  entreprise_id?: string;
}>({
  nom: '',
  description: '',
  probleme_id: '',
  point_statut: 'NOUVEAU',
  surface_m2: undefined,
  budget: undefined,
  date_debut: '',
  date_fin: '',
  avancement_pourcentage: 0,
  entreprise_id: undefined,
});

const entrepriseFocused = ref(false);

const problemes = ref<Probleme[]>([]);
const loading = ref(false);
const error = ref('');
const success = ref('');
const isManager = ref(false);
const nomFocused = ref(false);
const problemeFocused = ref(false);
const statutFocused = ref(false);
const descriptionFocused = ref(false);
const surfaceFocused = ref(false);
const budgetFocused = ref(false);
const dateDebutFocused = ref(false);
const dateFinFocused = ref(false);
const avancementFocused = ref(false);

// Définir les statuts avec leurs labels
const statutsDisponibles = [
  { value: 'NOUVEAU', label: 'Nouveau' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
];

const isFormValid = computed(() => {
  return (
    form.value.nom.trim() !== '' &&
    form.value.probleme_id !== ''
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
  if (!form.value.point_statut) {
    return 'Sélectionnez un statut';
  }
  const statut = statutsDisponibles.find(s => s.value === form.value.point_statut);
  return statut ? statut.label : 'Sélectionnez un statut';
};

// Charger les données de la route dans le formulaire quand le modal s'ouvre
watch(() => props.route, (newRoute) => {
  if (newRoute) {
    form.value = {
      nom: newRoute.nom || '',
      description: newRoute.description || '',
      probleme_id: newRoute.probleme_id || '',
      point_statut: newRoute.point_statut || 'NOUVEAU',
      surface_m2: newRoute.surface_m2,
      budget: newRoute.budget,
      date_debut: newRoute.date_debut ? newRoute.date_debut.toISOString().split('T')[0] : '',
      date_fin: newRoute.date_fin ? newRoute.date_fin.toISOString().split('T')[0] : '',
      avancement_pourcentage: newRoute.avancement_pourcentage || 0,
    };
  }
}, { immediate: true });

// Watch pour réagir aux changements des valeurs
watch(() => form.value.probleme_id, () => {
  // Force la mise à jour du placeholder
});

watch(() => form.value.point_statut, () => {
  // Force la mise à jour du placeholder
});

onMounted(async () => {
  await loadProblemes();
  entreprises.value = await routeService.getEntreprises();
  isManager.value = await authService.isManager();
});

// Charger les entreprises et autres valeurs
watch(() => props.route, (newRoute) => {
  if (newRoute) {
    form.value = {
      nom: newRoute.nom || '',
      description: newRoute.description || '',
      probleme_id: newRoute.probleme_id || '',
      point_statut: newRoute.point_statut || 'NOUVEAU',
      surface_m2: newRoute.surface_m2,
      budget: newRoute.budget,
      date_debut: newRoute.date_debut ? newRoute.date_debut.toISOString().split('T')[0] : '',
      date_fin: newRoute.date_fin ? newRoute.date_fin.toISOString().split('T')[0] : '',
      avancement_pourcentage: newRoute.avancement_pourcentage || 0,
      entreprise_id: newRoute.entreprise_id || undefined,
    };
  }
}, { immediate: true });

const loadProblemes = async () => {
  try {
    problemes.value = await routeService.getProblemes();
    
    if (problemes.value.length === 0) {
      await routeService.initializeDefaultProblemes();
      problemes.value = await routeService.getProblemes();
    }
  } catch (err) {
    console.error('Erreur lors du chargement des problèmes:', err);
  }
};

const handleSubmit = async () => {
  if (!isFormValid.value || !props.route) return;

  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    // Validate dates if both provided
    if (form.value.date_debut && form.value.date_fin) {
      const dDeb = new Date(form.value.date_debut);
      const dFin = new Date(form.value.date_fin);
      if (dFin < dDeb) {
        error.value = 'La date de fin doit être postérieure ou égale à la date de début.';
        loading.value = false;
        return;
      }
    }

    await routeService.updateRoute(props.route.id, {
      nom: form.value.nom,
      description: form.value.description,
      probleme_id: form.value.probleme_id,
      point_statut: form.value.point_statut,
      surface_m2: form.value.surface_m2,
      budget: form.value.budget,
      entreprise_id: form.value.entreprise_id || undefined,
      date_debut: form.value.date_debut ? new Date(form.value.date_debut) : undefined,
      date_fin: form.value.date_fin ? new Date(form.value.date_fin) : undefined,
      avancement_pourcentage: form.value.avancement_pourcentage,
    });

    success.value = 'Signalement modifié avec succès';

    setTimeout(() => {
      emit('success');
      closeModal();
    }, 1500);
  } catch (err) {
    console.error('Erreur lors de la modification du signalement:', err);
    error.value =
      err instanceof Error ? err.message : 'Erreur lors de la modification du signalement.';
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  error.value = '';
  success.value = '';
  nomFocused.value = false;
  problemeFocused.value = false;
  statutFocused.value = false;
  descriptionFocused.value = false;
  surfaceFocused.value = false;
  budgetFocused.value = false;
  dateDebutFocused.value = false;
  dateFinFocused.value = false;
  avancementFocused.value = false;
  emit('close');
};

const formatDate = (date: Date | undefined): string => {
  if (!date || !(date instanceof Date)) return 'N/A';
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
  margin-bottom: 32px;
  padding: 24px 0;
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

.edit-form {
  max-width: 640px; /* Wider for mobile/full-width devices */
  width: 100%;
  margin: 0 auto;
  padding: 0 12px;
}

.input-wrapper {
  margin-bottom: 12px; /* Reduced spacing for tighter mobile layout */
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

/* STYLES POUR LES SELECTS - IMPORTANT */
.select-container ion-select::part(placeholder) {
  color: #94a3b8 !important;
  opacity: 1 !important;
}

.select-container ion-select::part(text) {
  color: #0f172a !important;
}

/* Quand une valeur est sélectionnée, le texte doit être noir */
.select-container ion-select:not([value=""])::part(text) {
  color: #0f172a !important;
}

/* Quand le select est vide, montrer le placeholder en gris */
.select-container ion-select[value=""]::part(text) {
  color: #94a3b8 !important;
}

.textarea-container ion-textarea {
  --padding-top: 16px;
  --padding-bottom: 16px;
  min-height: 100px;
}

.status-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  border-left: 3px solid #3b82f6;
}

.status-hint ion-icon {
  font-size: 18px;
  color: #3b82f6;
  flex-shrink: 0;
}

.status-hint span {
  font-size: 12px;
  color: #1e40af;
  font-weight: 500;
  line-height: 1.4;
}

.info-box {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.info-header ion-icon {
  font-size: 20px;
  color: #64748b;
}

.info-header span {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.info-value {
  font-size: 13px;
  color: #0f172a;
  font-weight: 600;
  font-family: 'Courier New', monospace;
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

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  transition: width 0.3s ease;
  border-radius: 4px;
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

/* Wider modal for larger screens but still compact */
@media (min-width: 640px) {
  .edit-form { max-width: 520px; }
}

</style>