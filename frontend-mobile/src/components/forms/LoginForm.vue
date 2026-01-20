<template>
  <div class="login-form-container">
    <div class="form-header">
      <h2 class="form-title">Connexion</h2>
      <p class="form-description">Accédez à votre espace de suivi</p>
    </div>

    <form @submit.prevent="handleLogin" class="login-form">
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
            autocomplete="current-password"
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

      <!-- Remember me & Forgot password -->
      <div class="form-options">
        <label class="checkbox-label">
          <input type="checkbox" v-model="rememberMe" class="checkbox-input" />
          <span class="checkbox-text">Se souvenir de moi</span>
        </label>
        <a href="#" class="forgot-link">Mot de passe oublié ?</a>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <ion-icon :icon="alertCircle" class="error-icon"></ion-icon>
        <span class="error-text">{{ error }}</span>
      </div>

      <!-- Submit Button -->
      <ion-button
        type="submit"
        expand="block"
        :disabled="loading || !isFormValid"
        class="submit-button"
      >
        <ion-spinner v-if="loading" name="crescent" class="button-spinner"></ion-spinner>
        <span v-else>Se connecter</span>
      </ion-button>

      <!-- Divider -->
      <div class="divider">
        <span class="divider-text">ou</span>
      </div>

      <!-- Register Link -->
      <div class="register-section">
        <p class="register-text">
          Vous n'avez pas de compte ?
          <a href="#" class="register-link">Créer un compte</a>
        </p>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { IonInput, IonButton, IonSpinner, IonIcon } from '@ionic/vue';
import { mail, lockClosed, eye, eyeOff, alertCircle } from 'ionicons/icons';
import { LoginCredentials } from '../../types';
import authService from '../../services/authService';

const router = useRouter();

const form = ref<LoginCredentials>({
  email: 'user@gmail.com',
  password: 'password123'
});

const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);

const isFormValid = computed(() => {
  return form.value.email.trim() !== '' && form.value.password.trim() !== '';
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  error.value = '';

  try {
    await authService.login(form.value.email, form.value.password);
    console.log('Connexion réussie');
    
    // Rediriger vers la page d'accueil
    router.replace('/home');
  } catch (err) {
    console.error('Login error:', err);
    error.value = err instanceof Error ? err.message : 'Identifiants incorrects. Veuillez réessayer.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-form-container {
  width: 100%;
}

.form-header {
  margin-bottom: 32px;
}

.form-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #000000;
  margin: 0 0 8px 0;
  letter-spacing: -0.3px;
}

.form-description {
  font-size: 0.95rem;
  color: #666666;
  margin: 0;
  font-weight: 400;
}

.login-form {
  width: 100%;
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

/* Form Options */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #000000;
}

.checkbox-text {
  font-size: 0.9rem;
  color: #666666;
  font-weight: 500;
}

.forgot-link {
  font-size: 0.9rem;
  color: #000000;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.3s ease;
}

.forgot-link:hover {
  opacity: 0.7;
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
  margin-bottom: 24px;
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

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: 32px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e0e0;
}

.divider-text {
  position: relative;
  display: inline-block;
  padding: 0 16px;
  background: #ffffff;
  color: #9e9e9e;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Register Section */
.register-section {
  text-align: center;
}

.register-text {
  font-size: 0.95rem;
  color: #666666;
  margin: 0;
}

.register-link {
  color: #000000;
  text-decoration: none;
  font-weight: 700;
  transition: opacity 0.3s ease;
}

.register-link:hover {
  opacity: 0.7;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 480px) {
  .form-title {
    font-size: 1.5rem;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .forgot-link {
    align-self: flex-end;
  }
}
</style>