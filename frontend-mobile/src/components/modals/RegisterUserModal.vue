<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Inscrire un utilisateur</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">
            <ion-icon :icon="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="handleRegister" class="register-form">
        <!-- Email Input -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="mail" class="label-icon"></ion-icon>
            Adresse email
          </label>
          <div class="input-container">
            <ion-input
              v-model="form.email"
              type="email"
              required
              :disabled="loading"
              placeholder="exemple@email.com"
              class="custom-input"
              autocomplete="email"
            ></ion-input>
          </div>
        </div>

        <!-- Password Input -->
        <div class="input-wrapper">
          <label class="input-label">
            <ion-icon :icon="lockClosed" class="label-icon"></ion-icon>
            Mot de passe
          </label>
          <div class="input-container">
            <ion-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              :disabled="loading"
              placeholder="••••••••"
              class="custom-input"
              autocomplete="new-password"
            ></ion-input>
            <button
              type="button"
              @click="togglePassword"
              class="password-toggle"
              :disabled="loading"
            >
              <ion-icon :icon="showPassword ? eyeOff : eye"></ion-icon>
            </button>
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

        <!-- Offline Warning -->
        <div v-if="!isOnline" class="offline-message">
          <ion-icon :icon="cloudOffline" class="offline-icon"></ion-icon>
          <span class="offline-text">Mode hors ligne - L'inscription sera synchronisée plus tard</span>
        </div>

        <!-- Submit Button -->
        <ion-button
          type="submit"
          expand="block"
          :disabled="loading || !isFormValid"
          class="submit-button"
        >
          <ion-spinner v-if="loading" name="crescent" class="button-spinner"></ion-spinner>
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
import { alertCircle, checkmarkCircle, close, mail, lockClosed, eye, eyeOff, cloudOffline } from 'ionicons/icons';
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

const isFormValid = computed(() => {
  return form.value.email.trim() !== '' && form.value.password.trim().length >= 6;
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
    // Vérifier la connectivité avant l'inscription
    isOnline.value = await authService.checkFirestoreConnectivity();

    if (!isOnline.value) {
      throw new Error('Connexion internet requise pour créer un compte. Veuillez vérifier votre connexion et réessayer.');
    }

    // Inscrire l'utilisateur
    await authService.register(form.value.email, form.value.password);

    success.value = 'Compte créé avec succès !';
    setTimeout(() => {
      closeModal();
    }, 2000);
  } catch (err) {
    console.error('Register error:', err);
    error.value = err instanceof Error ? err.message : 'Erreur lors de la création du compte.';
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  form.value.email = '';
  form.value.password = '';
  error.value = '';
  success.value = '';
  emit('close');
};
</script>

<style scoped>
.register-form {
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
  position: relative;
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

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #666666;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  color: #000000;
}

.password-toggle ion-icon {
  font-size: 20px;
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

/* Offline Message */
.offline-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  margin-bottom: 20px;
}

.offline-icon {
  font-size: 20px;
  color: #856404;
  flex-shrink: 0;
}

.offline-text {
  font-size: 0.9rem;
  color: #856404;
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
