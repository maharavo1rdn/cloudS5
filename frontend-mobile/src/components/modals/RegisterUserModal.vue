<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Nouvel utilisateur</ion-title>
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
          <ion-icon :icon="personAdd"></ion-icon>
        </div>
        <h2 class="header-title">Créer un compte</h2>
        <p class="header-subtitle">Renseignez les informations du nouvel utilisateur</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="mail"></ion-icon>
            <span>Adresse email</span>
          </label>
          <div class="input-container" :class="{ focused: emailFocused }">
            <ion-input
              v-model="form.email"
              type="email"
              required
              :disabled="loading"
              placeholder="utilisateur@exemple.com"
              @ionFocus="emailFocused = true"
              @ionBlur="emailFocused = false"
            ></ion-input>
          </div>
        </div>

        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="lockClosed"></ion-icon>
            <span>Mot de passe</span>
          </label>
          <div class="input-container" :class="{ focused: passwordFocused }">
            <ion-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              :disabled="loading"
              placeholder="Minimum 6 caractères"
              @ionFocus="passwordFocused = true"
              @ionBlur="passwordFocused = false"
            ></ion-input>
            <button
              type="button"
              @click="togglePassword"
              class="password-toggle"
              :disabled="loading"
              tabindex="-1"
            >
              <ion-icon :icon="showPassword ? eyeOff : eye"></ion-icon>
            </button>
          </div>
          <div class="password-strength">
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                :class="passwordStrengthClass"
                :style="{ width: passwordStrength + '%' }"
              ></div>
            </div>
            <span class="strength-text">{{ passwordStrengthText }}</span>
          </div>
        </div>

        <div v-if="error" class="alert alert-error">
          <ion-icon :icon="alertCircle"></ion-icon>
          <div class="alert-content">
            <span class="alert-title">Erreur</span>
            <span class="alert-message">{{ error }}</span>
          </div>
        </div>

        <div v-if="success" class="alert alert-success">
          <ion-icon :icon="checkmarkCircle"></ion-icon>
          <div class="alert-content">
            <span class="alert-title">Succès</span>
            <span class="alert-message">{{ success }}</span>
          </div>
        </div>

        <div v-if="!isOnline" class="alert alert-warning">
          <ion-icon :icon="cloudOffline"></ion-icon>
          <div class="alert-content">
            <span class="alert-title">Hors ligne</span>
            <span class="alert-message">Connexion internet requise pour créer un compte</span>
          </div>
        </div>

        <ion-button
          type="submit"
          expand="block"
          :disabled="loading || !isFormValid"
          class="submit-button"
        >
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          <span v-else>Créer le compte</span>
        </ion-button>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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
  IonIcon,
} from '@ionic/vue';
import { 
  alertCircle, 
  checkmarkCircle, 
  close, 
  mail, 
  lockClosed, 
  eye, 
  eyeOff, 
  cloudOffline,
  personAdd
} from 'ionicons/icons';
import authService from '../../services/authService';

interface Props {
  isOpen: boolean;
}

defineProps<Props>();
const emit = defineEmits(['close']);

const form = ref({
  email: '',
  password: '',
});

const loading = ref(false);
const error = ref('');
const success = ref('');
const showPassword = ref(false);
const isOnline = ref(true);
const emailFocused = ref(false);
const passwordFocused = ref(false);

const isFormValid = computed(() => {
  return form.value.email.trim() !== '' && form.value.password.trim().length >= 6;
});

const passwordStrength = computed(() => {
  const password = form.value.password;
  if (password.length === 0) return 0;
  if (password.length < 6) return 25;
  if (password.length < 8) return 50;
  if (password.length < 10) return 75;
  return 100;
});

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value;
  if (strength <= 25) return 'weak';
  if (strength <= 50) return 'fair';
  if (strength <= 75) return 'good';
  return 'strong';
});

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value;
  if (strength === 0) return '';
  if (strength <= 25) return 'Faible';
  if (strength <= 50) return 'Moyen';
  if (strength <= 75) return 'Bon';
  return 'Fort';
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleRegister = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    isOnline.value = await authService.checkFirestoreConnectivity();

    if (!isOnline.value) {
      throw new Error('Connexion internet requise pour créer un compte. Veuillez vérifier votre connexion et réessayer.');
    }

    await authService.register(form.value.email, form.value.password);

    success.value = 'Compte créé avec succès';
    setTimeout(() => {
      closeModal();
    }, 2000);
  } catch (err) {
    console.error('Register error:', err);
    error.value = err instanceof Error ? err.message : 'Erreur lors de la création du compte';
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  form.value.email = '';
  form.value.password = '';
  error.value = '';
  success.value = '';
  emailFocused.value = false;
  passwordFocused.value = false;
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

.register-form {
  max-width: 480px;
  margin: 0 auto;
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
  overflow: hidden;
}

.input-container.focused {
  border-color: #0f172a;
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.1);
}

.input-container ion-input {
  --padding-start: 16px;
  --padding-end: 48px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --placeholder-color: #94a3b8;
  --color: #0f172a;
  font-size: 15px;
  font-weight: 500;
}

.password-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.password-toggle:hover:not(:disabled) {
  color: #0f172a;
  background: #f1f5f9;
}

.password-toggle ion-icon {
  font-size: 20px;
}

.password-strength {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.strength-fill.fair {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.strength-fill.good {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}

.strength-fill.strong {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.strength-text {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  min-width: 60px;
  text-align: right;
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

.alert-warning {
  background: #fffbeb;
  border-color: #fde68a;
}

.alert-warning ion-icon {
  color: #d97706;
}

.alert-warning .alert-title {
  color: #78350f;
}

.alert-warning .alert-message {
  color: #92400e;
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
}
</style>