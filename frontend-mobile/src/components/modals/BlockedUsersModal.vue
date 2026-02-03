<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal" class="blocked-users-modal">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title mode="ios">Sécurité</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal" class="close-button">
            <ion-icon :icon="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="content-container">

        <!-- En-tête de section -->
        <div class="page-header">
          <div class="header-badge">
            <ion-icon :icon="lockClosed"></ion-icon>
          </div>
          <h1>Utilisateurs bloqués</h1>
          <p>Gérez les comptes temporairement suspendus suite à des échecs d'authentification.</p>
        </div>

        <!-- État de chargement -->
        <div v-if="loading" class="loading-container">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <span>Actualisation...</span>
        </div>

        <!-- Contenu principal -->
        <div v-else>
          <!-- État vide (Tout va bien) -->
          <div v-if="blocked.length === 0" class="empty-state">
            <div class="empty-illustration">
              <ion-icon :icon="shieldCheckmark"></ion-icon>
            </div>
            <h3>Aucune menace détectée</h3>
            <p>Tous les utilisateurs ont un accès normal à la plateforme.</p>
          </div>

          <!-- Liste des bloqués -->
          <div v-else class="users-list">
            <div class="list-summary">
              {{ blocked.length }} utilisateur{{ blocked.length > 1 ? 's' : '' }} bloqué{{ blocked.length > 1 ? 's' : ''
              }}
            </div>

            <div v-for="user in blocked" :key="user.id" class="user-card">
              <!-- Partie Supérieure : Identité -->
              <div class="card-header">
                <div class="user-avatar-placeholder">
                  {{ (user.username || user.email).charAt(0).toUpperCase() }}
                </div>
                <div class="user-identity">
                  <div class="email-text">{{ user.email }}</div>
                  <div class="status-indicator">
                    <span class="dot"></span>
                    Accès suspendu
                  </div>
                </div>
              </div>

              <!-- Partie Centrale : Métadonnées -->
              <div class="card-stats">
                <div class="stat-item">
                  <span class="stat-label">Tentatives</span>
                  <span class="stat-value text-danger">
                    {{ user.LoginAttempt?.attempts || 0 }} échecs
                  </span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-label">Déblocage auto</span>
                  <span class="stat-value">
                    {{ formatDate(user.LoginAttempt?.blocked_until) }}
                  </span>
                </div>
              </div>

              <!-- Partie Inférieure : Action -->
              <div class="card-actions">
                <ion-button expand="block" fill="outline" class="action-btn" @click="unblock(user)">
                  <ion-icon :icon="lockOpen" slot="start"></ion-icon>
                  Réactiver l'accès maintenant
                </ion-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerte Erreur -->
        <div v-if="error" class="error-toast">
          <ion-icon :icon="alertCircle"></ion-icon>
          <span>{{ error }}</span>
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
  lockClosed,
  lockOpen,
  shieldCheckmark,
  alertCircle,
} from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface BlockedUser {
  id: number;
  email: string;
  username: string;
  isBlocked: boolean;
  LoginAttempt?: {
    attempts: number;
    blocked_until: string | null;
  };
}

interface Props { isOpen: boolean }
const props = defineProps<Props>();
const emit = defineEmits(['close']);

const blocked = ref<BlockedUser[]>([]);
const loading = ref(false);
const error = ref('');

const loadBlocked = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { value: token } = await Preferences.get({ key: 'auth_token' });
    if (!token) throw new Error('Non authentifié');

    console.log('🔑 Token:', token.substring(0, 20) + '...');
    console.log('📡 Calling:', `${API_BASE_URL}/users/blocked`);

    const response = await fetch(`${API_BASE_URL}/users/blocked`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      console.error('❌ Error response:', errorData);
      throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Data received:', data);
    blocked.value = data;
  } catch (err) {
    console.error('💥 Exception:', err);
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des données.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadBlocked();
});

const formatDate = (d: Date | string | null | undefined) => {
  if (!d) return '--';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (!(date instanceof Date) || isNaN(date.getTime())) return '--';
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const unblock = async (user: BlockedUser) => {
  try {
    const { value: token } = await Preferences.get({ key: 'auth_token' });
    if (!token) throw new Error('Non authentifié');

    // Débloquer l'utilisateur
    const response = await fetch(`${API_BASE_URL}/users/${user.id}/unblock`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Erreur lors du déblocage');

    // Réinitialiser les tentatives si nécessaire
    if (user.LoginAttempt) {
      await fetch(`${API_BASE_URL}/auth/reset-attempts/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }

    await loadBlocked(); // Rafraîchir la liste
  } catch (err) {
    console.error(err);
    error.value = 'Échec du déblocage.';
  }
};

const closeModal = () => emit('close');
</script>

<style scoped>
/* --- Structure Globale --- */
ion-toolbar {
  --background: #ffffff;
  --border-width: 0;
  padding-top: 8px;
}

ion-title {
  font-weight: 700;
  color: #1e293b;
}

ion-content {
  --background: #f8fafc;
}

.content-container {
  padding: 16px;
  max-width: 600px;
  /* Centré sur tablette/desktop */
  margin: 0 auto;
}

/* --- Bouton Fermer --- */
.close-button {
  --color: #64748b;
  --background: #f1f5f9;
  --border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-right: 8px;
}

/* --- En-tête de page --- */
.page-header {
  text-align: center;
  margin-bottom: 32px;
  padding-top: 16px;
}

.header-badge {
  width: 56px;
  height: 56px;
  background: #fee2e2;
  color: #ef4444;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.page-header h1 {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.page-header p {
  color: #64748b;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

/* --- Liste des utilisateurs --- */
.list-summary {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  margin-left: 4px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* --- Carte Utilisateur (Le cœur du design) --- */
.user-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease;
}

/* Header de la carte : Avatar + Info */
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.user-avatar-placeholder {
  width: 48px;
  height: 48px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.user-identity {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.email-text {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #ef4444;
  font-weight: 500;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: #ef4444;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* Stats (Tentatives / Date) */
.card-stats {
  display: flex;
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}

.stat-divider {
  width: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.text-danger {
  color: #ef4444;
}

/* Actions */
.action-btn {
  --color: #10b981;
  --border-color: #10b981;
  --border-width: 1.5px;
  --border-radius: 12px;
  --background-hover: #ecfdf5;
  font-weight: 600;
  margin: 0;
  height: 44px;
}

/* --- État Vide --- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-illustration {
  width: 96px;
  height: 96px;
  background: #ecfdf5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-illustration ion-icon {
  font-size: 48px;
  color: #10b981;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}

/* --- Chargement --- */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #64748b;
  gap: 16px;
}

/* --- Erreur --- */
.error-toast {
  background: #fef2f2;
  color: #b91c1c;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  font-size: 14px;
  border: 1px solid #fecaca;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}
</style>