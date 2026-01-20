<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Réinitialiser les tentatives</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal" fill="clear">
            <ion-icon :icon="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="modal-header">
        <div class="header-icon">
          <ion-icon :icon="refreshCircle"></ion-icon>
        </div>
        <h2 class="header-title">Réinitialiser les tentatives</h2>
        <p class="header-subtitle">Débloquer un utilisateur en réinitialisant ses tentatives de connexion</p>
      </div>

      <form @submit.prevent="handleReset" class="reset-form">
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="mail" class="label-icon"></ion-icon>
            <span>Adresse email de l'utilisateur</span>
          </label>
          <div class="input-container" :class="{ focused: emailFocused }">
            <ion-input 
              v-model="email" 
              type="email" 
              placeholder="utilisateur@example.com" 
              required
              :disabled="loading"
              @ionFocus="emailFocused = true"
              @ionBlur="emailFocused = false"
            ></ion-input>
          </div>
          <div class="input-hint">
            <ion-icon :icon="informationCircle"></ion-icon>
            <span>Entrez l'adresse email exacte de l'utilisateur à débloquer</span>
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
          :disabled="loading || !email"
          class="submit-button"
        >
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          <span v-else>Réinitialiser les tentatives</span>
        </ion-button>
      </form>

      <div class="info-card">
        <div class="info-header">
          <ion-icon :icon="shieldCheckmark"></ion-icon>
          <span>À propos du déblocage</span>
        </div>
        <div class="info-content">
          <p>Cette action réinitialise le compteur de tentatives de connexion échouées et permet à l'utilisateur de se reconnecter immédiatement.</p>
          <ul class="info-list">
            <li>• Le compteur de tentatives est remis à zéro</li>
            <li>• L'utilisateur peut se reconnecter immédiatement</li>
            <li>• L'historique de sécurité est conservé</li>
          </ul>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonContent, 
  IonInput, 
  IonSpinner, 
  IonIcon 
} from '@ionic/vue';
import { 
  close, 
  alertCircle, 
  checkmarkCircle, 
  refreshCircle,
  mail,
  informationCircle,
  shieldCheckmark
} from 'ionicons/icons';
import loginAttemptService from '../../services/loginAttemptService';

interface Props { isOpen: boolean }
const props = defineProps<Props>();
const emit = defineEmits(['close', 'success']);

const email = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');
const emailFocused = ref(false);

const handleReset = async () => {
  if (!email.value) return;
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    await loginAttemptService.resetAttempt(email.value);
    success.value = `Tentatives réinitialisées avec succès pour ${email.value}. L'utilisateur peut maintenant se reconnecter.`;

    setTimeout(() => {
      emit('success');
      closeModal();
    }, 1500);
  } catch (err) {
    console.error(err);
    error.value = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation des tentatives.';
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  email.value = '';
  error.value = '';
  success.value = '';
  emailFocused.value = false;
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

.reset-form {
  max-width: 480px;
  margin: 0 auto 32px;
}

.input-wrapper {
  margin-bottom: 24px;
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

.input-container {
  position: relative;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.input-container.focused {
  border-color: #0f172a;
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.1);
}

.input-container ion-input {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --placeholder-color: #94a3b8;
  --color: #0f172a;
  font-size: 15px;
  font-weight: 500;
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  border-left: 3px solid #3b82f6;
}

.input-hint ion-icon {
  font-size: 18px;
  color: #3b82f6;
  flex-shrink: 0;
}

.input-hint span {
  font-size: 12px;
  color: #1e40af;
  font-weight: 500;
  line-height: 1.4;
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

.info-card {
  max-width: 480px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.info-header ion-icon {
  font-size: 24px;
  color: #3b82f6;
}

.info-header span {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-content p {
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-list li {
  font-size: 13px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-list li:before {
  content: "•";
  color: #3b82f6;
  font-weight: bold;
  font-size: 16px;
}

@media (max-width: 640px) {
  .modal-header {
    padding: 16px 0;
    margin-bottom: 24px;
  }

  .header-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 12px;
  }

  .header-icon ion-icon {
    font-size: 28px;
  }

  .header-title {
    font-size: 20px;
  }

  .header-subtitle {
    font-size: 13px;
  }

  .info-card {
    padding: 16px;
  }
}
</style>