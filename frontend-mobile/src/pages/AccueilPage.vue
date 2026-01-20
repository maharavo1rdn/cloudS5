<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="mobile-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="greeting">
            <h1>Bonjour 👋</h1>
            <p>Bienvenue sur CloudS5</p>
          </div>
          <ion-button fill="clear" class="notification-btn">
            <ion-icon :icon="notificationsOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <ion-card class="stat-card">
            <ion-card-content>
              <ion-icon :icon="documentTextOutline" class="stat-icon"></ion-icon>
              <div class="stat-value">24</div>
              <div class="stat-label">Documents</div>
            </ion-card-content>
          </ion-card>

          <ion-card class="stat-card">
            <ion-card-content>
              <ion-icon :icon="folderOutline" class="stat-icon"></ion-icon>
              <div class="stat-value">8</div>
              <div class="stat-label">Projets</div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Quick Actions -->
        <div class="section">
          <h2 class="section-title">Actions rapides</h2>
          <div class="action-grid">
            <ion-button class="action-button" @click="goToSomeFeature">
              <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
              Nouveau
            </ion-button>
            <ion-button class="action-button" fill="outline">
              <ion-icon :icon="searchOutline" slot="start"></ion-icon>
              Rechercher
            </ion-button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="section">
          <h2 class="section-title">Activité récente</h2>
          <ion-card class="activity-card">
            <ion-item lines="none">
              <ion-icon :icon="timeOutline" slot="start" class="activity-icon"></ion-icon>
              <ion-label>
                <h3>Dernier accès</h3>
                <p>Il y a 2 heures</p>
              </ion-label>
            </ion-item>
          </ion-card>
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
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel
} from '@ionic/vue';
import { 
  notificationsOutline,
  documentTextOutline,
  folderOutline,
  addCircleOutline,
  searchOutline,
  timeOutline
} from 'ionicons/icons';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const currentYear = computed(() => new Date().getFullYear());

const goToSomeFeature = () => {
  router.push('/tabs/profile'); // Redirection vers le profil
};
</script>

<style scoped>
.mobile-container {
  max-width: 390px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
  padding-top: max(1rem, env(safe-area-inset-top));
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

/* Adaptation petits écrans */
@media (max-width: 375px) {
  .mobile-container {
    padding: 0.75rem;
    padding-top: max(0.75rem, env(safe-area-inset-top));
  }
  
  .header-section {
    padding: 0.75rem 0.5rem !important;
  }
  
  .greeting h1 {
    font-size: 1.5rem !important;
  }
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0.5rem;
  margin-bottom: 1.5rem;
}

.greeting h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.greeting p {
  font-size: 0.9rem;
  color: #666;
  margin: 0.25rem 0 0 0;
}

.notification-btn {
  --color: #667eea;
  font-size: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  margin: 0;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
}

.stat-card ion-card-content {
  padding: 1.5rem 1rem;
}

.stat-icon {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0.5rem 0 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1rem 0.5rem;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.action-button {
  height: 52px;
  --border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  text-transform: none;
}

.activity-card {
  margin: 0;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.activity-icon {
  color: #667eea;
  font-size: 1.5rem;
}

.activity-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.activity-card p {
  font-size: 0.85rem;
  color: #666;
  margin: 0.25rem 0 0;
}
</style>