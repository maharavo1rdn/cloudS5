<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="login-wrapper">
        <!-- Header avec logo -->
        <div class="header-section">
          <div class="logo-container">
            <ion-icon :icon="construct" class="logo-icon"></ion-icon>
          </div>
          <h1 class="app-title">CloudS5</h1>
          <p class="app-subtitle">Suivi des routes en travaux</p>
        </div>

        <!-- Formulaire de connexion -->
        <div class="form-section">
          <LoginForm />
        </div>

        <!-- Footer -->
        <div class="footer-section">
          <p class="footer-text">© 2026 CloudS5. Tous droits réservés.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import { construct } from 'ionicons/icons';
import LoginForm from '../components/forms/LoginForm.vue';
</script>

<style scoped>
.login-content {
  --background: #ffffff;
}

.login-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 24px;
  max-width: 440px;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInDown 0.6s ease-out;
}

.logo-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: #000000;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: transform 0.3s ease;
}

.logo-container:hover {
  transform: scale(1.05);
}

.logo-icon {
  font-size: 40px;
  color: #ffffff;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #000000;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 1rem;
  color: #666666;
  font-weight: 400;
  margin: 0;
}

/* Form Section */
.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

/* Footer Section */
.footer-section {
  text-align: center;
  margin-top: 40px;
  animation: fadeIn 0.6s ease-out 0.4s both;
}

.footer-text {
  font-size: 0.85rem;
  color: #9e9e9e;
  margin: 0;
}

/* Animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 480px) {
  .login-wrapper {
    padding: 32px 20px;
  }

  .app-title {
    font-size: 2rem;
  }

  .logo-container {
    width: 70px;
    height: 70px;
  }

  .logo-icon {
    font-size: 35px;
  }
}

@media (max-height: 700px) {
  .login-wrapper {
    justify-content: flex-start;
    padding: 24px 20px;
  }

  .header-section {
    margin-bottom: 24px;
  }

  .form-section {
    flex: 0;
  }
}
</style>