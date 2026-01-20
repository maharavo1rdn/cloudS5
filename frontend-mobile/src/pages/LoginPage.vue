<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="mobile-container">
        <!-- Logo / Brand -->
        <div class="brand-section">
          <div class="logo-circle">
            <ion-icon :icon="lockClosedOutline" class="logo-icon"></ion-icon>
          </div>
          <h1 class="brand-title">CloudS5</h1>
          <p class="brand-subtitle">Gestion professionnelle</p>
        </div>

        <!-- Form Section -->
        <div class="form-section">
          <div class="input-group">
            <ion-item lines="none" class="modern-input">
              <ion-icon :icon="mailOutline" slot="start" class="input-icon"></ion-icon>
              <ion-input 
                v-model="email"
                type="email"
                placeholder="Adresse email"
                autocomplete="email"
              ></ion-input>
            </ion-item>
          </div>

          <div class="input-group">
            <ion-item lines="none" class="modern-input">
              <ion-icon :icon="lockClosedOutline" slot="start" class="input-icon"></ion-icon>
              <ion-input 
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mot de passe"
                autocomplete="current-password"
              ></ion-input>
              <ion-button 
                fill="clear" 
                slot="end"
                @click="showPassword = !showPassword"
                class="toggle-password"
              >
                <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
              </ion-button>
            </ion-item>
          </div>

          <ion-button 
            expand="block" 
            class="login-button"
            @click="simulateLogin"
            :disabled="loading"
          >
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Se connecter</span>
          </ion-button>

          <ion-button 
            expand="block" 
            fill="clear"
            class="forgot-button"
            size="small"
          >
            Mot de passe oublié ?
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { 
  IonPage, 
  IonContent, 
  IonItem, 
  IonInput, 
  IonButton, 
  IonIcon, 
  IonSpinner,
  toastController 
} from '@ionic/vue';
import { 
  lockClosedOutline, 
  mailOutline, 
  eyeOutline, 
  eyeOffOutline 
} from 'ionicons/icons';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

const router = useRouter();

const simulateLogin = async () => {
  // Validation très basique (optionnel)
  if (!email.value || !password.value) {
    const toast = await toastController.create({
      message: 'Veuillez remplir les champs',
      duration: 2200,
      color: 'warning',
      position: 'top'
    });
    await toast.present();
    return;
  }

  loading.value = true;

  // Simulation de délai réseau/auth
  setTimeout(async () => {
    loading.value = false;

    // Redirection vers l'accueil (adapte le chemin selon ton router)
    // Options courantes :
    // → '/home'            si page simple
    // → '/tabs/home'       si tabs en bas
    // → '/app' ou '/'      selon ton setup
    await router.replace('/tabs/home');   // ← redirection vers AccueilPage.vue avec tabs

    // Option : toast de bienvenue
    const toast = await toastController.create({
      message: 'Connexion simulée avec succès !',
      duration: 1800,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }, 1200);
};
</script>

<style scoped>
.login-content {
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.mobile-container {
  max-width: 390px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  padding-top: max(2rem, env(safe-area-inset-top));
  padding-bottom: max(2rem, env(safe-area-inset-bottom));
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Adaptation petits écrans (iPhone SE, etc.) */
@media (max-height: 667px) {
  .mobile-container {
    padding: 1.5rem 1.25rem;
    padding-top: max(1.5rem, env(safe-area-inset-top));
  }
  
  .brand-section {
    margin-bottom: 2rem !important;
  }
  
  .logo-circle {
    width: 70px !important;
    height: 70px !important;
  }
  
  .brand-title {
    font-size: 1.75rem !important;
  }
}

/* Adaptation grands écrans (iPhone 14 Pro Max, etc.) */
@media (min-height: 844px) {
  .mobile-container {
    padding: 3rem 1.5rem;
    padding-top: max(3rem, env(safe-area-inset-top));
  }
}

.brand-section {
  text-align: center;
  margin-bottom: 3rem;
}

.logo-circle {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.logo-icon {
  font-size: 2.5rem;
  color: white;
}

.brand-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.5px;
}

.brand-subtitle {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.form-section {
  background: white;
  border-radius: 24px;
  padding: 2rem 1.5rem;
  padding-bottom: calc(2rem + env(safe-area-inset-bottom));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.input-group {
  margin-bottom: 1rem;
}

.modern-input {
  --background: #f5f7fa;
  --border-radius: 12px;
  --padding-start: 0;
  --padding-end: 0;
  --inner-padding-end: 12px;
  margin: 0;
  border-radius: 12px;
}

.input-icon {
  color: #667eea;
  font-size: 1.3rem;
  margin: 0 12px;
}

.toggle-password {
  --color: #667eea;
  margin: 0;
}

.login-button {
  margin-top: 1.5rem;
  height: 52px;
  font-size: 1rem;
  font-weight: 600;
  --border-radius: 12px;
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  text-transform: none;
  letter-spacing: 0.5px;
}

.forgot-button {
  margin-top: 0.5rem;
  --color: #667eea;
  font-size: 0.9rem;
}

/* Optimisation mobile stricte */
@media (min-width: 768px) {
  .mobile-container {
    max-width: 420px;
  }
}
</style>