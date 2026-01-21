<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Utilisateurs bloqués</ion-title>
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
          <ion-icon :icon="lockClosed"></ion-icon>
        </div>
        <h2 class="header-title">Gestion des blocages</h2>
        <p class="header-subtitle">Utilisateurs temporairement bloqués suite à des tentatives de connexion</p>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-card">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <span class="loading-text">Chargement des utilisateurs bloqués</span>
          <span class="loading-subtext">Veuillez patienter...</span>
        </div>
      </div>

      <div v-else>
        <div v-if="blocked.length === 0" class="empty-state">
          <div class="empty-icon">
            <ion-icon :icon="checkmarkCircle"></ion-icon>
          </div>
          <h3 class="empty-title">Aucun utilisateur bloqué</h3>
          <p class="empty-text">
            Tous les utilisateurs peuvent actuellement se connecter
          </p>
        </div>

        <div v-else class="blocked-list">
          <div class="list-header">
            <div class="header-item">Utilisateur</div>
            <div class="header-item">Informations</div>
            <div class="header-item">Actions</div>
          </div>
          
          <div v-for="user in blocked" :key="user.email" class="blocked-card">
            <div class="user-info">
              <div class="user-avatar">
                <ion-icon :icon="person"></ion-icon>
              </div>
              <div class="user-details">
                <div class="user-email">{{ user.email }}</div>
                <div class="user-status">
                  <span class="status-badge">Bloqué</span>
                </div>
              </div>
            </div>
            
            <div class="block-info">
              <div class="info-row">
                <ion-icon :icon="shield"></ion-icon>
                <div class="info-content">
                  <span class="info-label">Tentatives échouées</span>
                  <span class="info-value">{{ user.attempts }}</span>
                </div>
              </div>
              <div class="info-row">
                <ion-icon :icon="time"></ion-icon>
                <div class="info-content">
                  <span class="info-label">Bloqué jusqu'à</span>
                  <span class="info-value">{{ formatDate(user.blocked_until) }}</span>
                </div>
              </div>
            </div>
            
            <div class="actions">
              <ion-button 
                size="small" 
                fill="outline" 
                @click="unblock(user.email)"
                class="unblock-btn"
              >
                <ion-icon :icon="lockOpen" slot="start"></ion-icon>
                Débloquer
              </ion-button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="error" class="alert alert-error">
        <ion-icon :icon="alertCircle"></ion-icon>
        <div class="alert-content">
          <span class="alert-title">Erreur</span>
          <span class="alert-message">{{ error }}</span>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSpinner,
  IonIcon,
} from '@ionic/vue';
import {
  close,
  checkmarkCircle,
  lockClosed,
  lockOpen,
  person,
  shield,
  time,
  alertCircle,
} from 'ionicons/icons';
import loginAttemptService from '../../services/loginAttemptService';

interface Props { isOpen: boolean }
const props = defineProps<Props>();
const emit = defineEmits(['close','success']);

const blocked = ref<Array<{ email: string; attempts: number; blocked_until: Date }>>([]);
const loading = ref(false);
const error = ref('');

const loadBlocked = async () => {
  loading.value = true;
  error.value = '';
  try {
    blocked.value = await loginAttemptService.getBlockedAttempts();
  } catch (err) {
    console.error(err);
    error.value = 'Impossible de charger la liste des utilisateurs bloqués.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadBlocked();
});

const formatDate = (d: Date) => {
  if (!(d instanceof Date)) return 'Date invalide';
  return d.toLocaleString('fr-FR', { 
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const unblock = async (email: string) => {
  try {
    await loginAttemptService.resetAttempt(email);
    await loadBlocked();
  } catch (err) {
    console.error(err);
    error.value = 'Impossible de débloquer cet utilisateur.';
  }
};

const closeModal = () => {
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.loading-card ion-spinner {
  width: 48px;
  height: 48px;
}

.loading-text {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.loading-subtext {
  font-size: 13px;
  color: #64748b;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-icon ion-icon {
  font-size: 40px;
  color: #16a34a;
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.empty-text {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  max-width: 320px;
  line-height: 1.5;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 3fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
}

.header-item {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.blocked-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.blocked-card {
  display: grid;
  grid-template-columns: 2fr 3fr 1fr;
  gap: 16px;
  align-items: center;
  background: white;
  border: 2px solid #fee2e2;
  border-radius: 16px;
  padding: 20px 24px;
  transition: all 0.2s ease;
}

.blocked-card:hover {
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.1);
  transform: translateY(-2px);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar ion-icon {
  font-size: 24px;
  color: #dc2626;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-email {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.block-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-row ion-icon {
  font-size: 20px;
  color: #64748b;
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.unblock-btn {
  --border-radius: 8px;
  --padding-start: 16px;
  --padding-end: 16px;
  --border-color: #10b981;
  --color: #10b981;
  font-size: 13px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: -0.01em;
  transition: all 0.2s;
}

.unblock-btn:hover {
  --background: #10b981;
  --color: white;
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  margin-top: 20px;
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

@media (max-width: 768px) {
  .list-header {
    display: none;
  }
  
  .blocked-card {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .user-info {
    justify-content: center;
    text-align: center;
  }
  
  .block-info {
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 0;
  }
  
  .actions {
    justify-content: center;
  }
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