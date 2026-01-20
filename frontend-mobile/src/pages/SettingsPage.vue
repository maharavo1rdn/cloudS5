<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="mobile-container">
        <!-- Header -->
        <div class="settings-header">
          <h1>Paramètres</h1>
          <p>Personnalisez votre expérience</p>
        </div>

        <!-- Preferences Section -->
        <div class="section">
          <h3 class="section-title">Préférences</h3>
          
          <ion-card class="settings-card">
            <ion-item lines="none">
              <ion-icon :icon="notificationsOutline" slot="start" class="item-icon"></ion-icon>
              <ion-label>
                <h3>Notifications</h3>
                <p>Recevoir les alertes</p>
              </ion-label>
              <ion-toggle slot="end" color="primary"></ion-toggle>
            </ion-item>
          </ion-card>

          <ion-card class="settings-card">
            <ion-item lines="none">
              <ion-icon :icon="moonOutline" slot="start" class="item-icon"></ion-icon>
              <ion-label>
                <h3>Mode sombre</h3>
                <p>Thème d'affichage</p>
              </ion-label>
              <ion-toggle slot="end" color="primary"></ion-toggle>
            </ion-item>
          </ion-card>

          <ion-card class="settings-card">
            <ion-item lines="none" button>
              <ion-icon :icon="languageOutline" slot="start" class="item-icon"></ion-icon>
              <ion-label>
                <h3>Langue</h3>
                <p>Français</p>
              </ion-label>
              <ion-icon :icon="chevronForwardOutline" slot="end" class="chevron-icon"></ion-icon>
            </ion-item>
          </ion-card>
        </div>

        <!-- App Info Section -->
        <div class="section">
          <h3 class="section-title">Application</h3>
          
          <ion-card class="info-card">
            <ion-card-content>
              <div class="info-row">
                <span class="info-label">Version</span>
                <span class="info-value">1.0.0</span>
              </div>
              <div class="info-row">
                <span class="info-label">Build</span>
                <span class="info-value">2026.01.20</span>
              </div>
              <div class="info-row">
                <span class="info-label">Plateforme</span>
                <span class="info-value">Mobile</span>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Support Section -->
        <div class="section">
          <ion-button expand="block" fill="outline" class="support-btn">
            <ion-icon :icon="helpCircleOutline" slot="start"></ion-icon>
            Centre d'aide
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
  IonCardContent,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonIcon
} from '@ionic/vue';
import {
  notificationsOutline,
  moonOutline,
  languageOutline,
  chevronForwardOutline,
  helpCircleOutline
} from 'ionicons/icons';
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
  
  .settings-header {
    padding: 1.5rem 0.5rem 1rem !important;
  }
  
  .settings-header h1 {
    font-size: 1.75rem !important;
  }
}

.settings-header {
  padding: 2rem 0.5rem 1.5rem;
}

.settings-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.settings-header p {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1rem 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-card {
  margin: 0 0 0.75rem 0;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.item-icon {
  color: #667eea;
  font-size: 1.5rem;
}

.settings-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.settings-card p {
  font-size: 0.85rem;
  color: #999;
  margin: 0.25rem 0 0;
}

.chevron-icon {
  color: #ccc;
  font-size: 1.2rem;
}

.info-card {
  margin: 0;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.95rem;
  color: #666;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
}

.support-btn {
  height: 52px;
  --border-radius: 12px;
  --border-color: #667eea;
  --color: #667eea;
  font-size: 1rem;
  font-weight: 500;
  text-transform: none;
}
</style>