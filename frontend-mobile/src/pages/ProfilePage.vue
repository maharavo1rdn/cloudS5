<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="mobile-container">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="avatar-section">
            <div class="avatar">
              <ion-icon :icon="personOutline" class="avatar-icon"></ion-icon>
            </div>
            <h2 class="user-name">Utilisateur</h2>
            <p class="user-role">Administrateur</p>
          </div>
        </div>

        <!-- Profile Info -->
        <div class="section">
          <h3 class="section-title">Informations personnelles</h3>
          
          <ion-card class="info-card">
            <ion-item lines="none">
              <ion-icon :icon="personOutline" slot="start" class="item-icon"></ion-icon>
              <ion-label>
                <p class="label-text">Nom complet</p>
                <h3>Jean Dupont</h3>
              </ion-label>
            </ion-item>
          </ion-card>

          <ion-card class="info-card">
            <ion-item lines="none">
              <ion-icon :icon="mailOutline" slot="start" class="item-icon"></ion-icon>
              <ion-label>
                <p class="label-text">Email</p>
                <h3>jean.dupont@email.com</h3>
              </ion-label>
            </ion-item>
          </ion-card>

          <ion-card class="info-card">
            <ion-item lines="none">
              <ion-icon :icon="callOutline" slot="start" class="item-icon"></ion-icon>
              <ion-label>
                <p class="label-text">Téléphone</p>
                <h3>+261 34 00 000 00</h3>
              </ion-label>
            </ion-item>
          </ion-card>
        </div>

        <!-- Actions -->
        <div class="section">
          <ion-button expand="block" class="action-btn" @click="editProfile">
            <ion-icon :icon="createOutline" slot="start"></ion-icon>
            Modifier le profil
          </ion-button>

          <ion-button expand="block" fill="outline" class="logout-btn" @click="logout">
            <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
            Se déconnecter
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
  IonCard,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  toastController
} from '@ionic/vue';
import {
  personOutline,
  mailOutline,
  callOutline,
  createOutline,
  logOutOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';

const router = useRouter();

const editProfile = () => {
  // TODO: Implémenter l'édition du profil
  console.log('Éditer le profil');
};

const logout = async () => {
  // Simulation de déconnexion
  const toast = await toastController.create({
    message: 'Déconnexion réussie',
    duration: 2000,
    color: 'success',
    position: 'top'
  });
  await toast.present();
  await router.replace('/');
};
</script>

<style scoped>
.mobile-container {
  max-width: 390px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

/* Adaptation petits écrans */
@media (max-width: 375px) {
  .mobile-container {
    padding: 0.75rem;
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
  
  .avatar {
    width: 80px !important;
    height: 80px !important;
  }
  
  .avatar-icon {
    font-size: 2.5rem !important;
  }
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 0 24px 24px;
  padding: 3rem 1rem 2rem;
  padding-top: max(3rem, calc(env(safe-area-inset-top) + 1rem));
  text-align: center;
  margin: -1rem -1rem 2rem -1rem;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.avatar-icon {
  font-size: 3rem;
  color: white;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem 0;
}

.user-role {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1rem 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.85rem;
}

.info-card {
  margin: 0 0 0.75rem 0;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.item-icon {
  color: #667eea;
  font-size: 1.5rem;
}

.label-text {
  font-size: 0.8rem;
  color: #999;
  margin: 0 0 0.25rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.action-btn {
  height: 52px;
  --border-radius: 12px;
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 1rem;
  font-weight: 500;
  text-transform: none;
  margin-bottom: 1rem;
}

.logout-btn {
  height: 52px;
  --border-radius: 12px;
  --border-color: #dc3545;
  --color: #dc3545;
  font-size: 1rem;
  font-weight: 500;
  text-transform: none;
}
</style>