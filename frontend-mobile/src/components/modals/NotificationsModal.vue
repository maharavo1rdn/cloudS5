<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal" class="notifications-modal">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title mode="ios">Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button 
            @click="markAllAsRead" 
            v-if="unreadCount > 0" 
            class="mark-read-btn"
          >
            <span class="btn-text">Tout lire</span>
            <ion-icon :icon="checkmarkDone" slot="end"></ion-icon>
          </ion-button>
          <ion-button @click="closeModal" class="close-button">
            <ion-icon :icon="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="content-wrapper">
        
        <!-- En-tête de section -->
        <div class="section-header" v-if="notifications.length > 0">
          <div class="header-left">
            <span class="count-badge">{{ notifications.length }}</span>
            <span class="header-label">Récents</span>
          </div>
          <div class="header-right" v-if="unreadCount > 0">
            <span class="unread-badge">{{ unreadCount }} non lu(s)</span>
          </div>
        </div>

        <!-- État vide -->
        <div v-if="notifications.length === 0" class="empty-state">
          <div class="empty-illustration">
            <ion-icon :icon="notificationsIcon"></ion-icon>
            <div class="pulse-ring"></div>
          </div>
          <h3>C'est calme par ici</h3>
          <p>Vous n'avez aucune nouvelle notification pour le moment.</p>
        </div>

        <!-- Liste des notifications -->
        <div v-else class="notifications-list">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 'is-unread': !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <!-- Colonne Gauche : Icône -->
            <div class="item-left">
              <div class="status-icon-wrapper" :class="getStatusClass(notification.newStatus)">
                <ion-icon :icon="getStatusIcon(notification.newStatus)"></ion-icon>
              </div>
            </div>

            <!-- Colonne Centrale : Contenu -->
            <div class="item-body">
              <div class="body-top">
                <h3 class="notif-title">{{ notification.title }}</h3>
                <span class="time-stamp">{{ formatTime(notification.createdAt) }}</span>
              </div>
              
              <p class="notif-message">{{ notification.body }}</p>
              
              <div class="notif-footer">
                <div class="route-badge">
                  <ion-icon :icon="navigate"></ion-icon>
                  {{ notification.routeName }}
                </div>
              </div>
            </div>

            <!-- Colonne Droite : Indicateur + Action -->
            <div class="item-right">
              <div v-if="!notification.read" class="blue-dot"></div>
              
              <button 
                class="delete-action"
                @click.stop="deleteNotification(notification.id)"
              >
                <ion-icon :icon="trashOutline"></ion-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer Action Globale -->
        <div class="footer-actions" v-if="notifications.length > 0">
          <button class="clear-all-btn" @click="confirmClearAll">
            Vider l'historique
          </button>
        </div>

      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  alertController
} from '@ionic/vue';
import {
  close,
  notifications as notificationsIcon,
  checkmarkDone,
  trashOutline,
  checkmarkCircle,
  construct,
  closeCircle,
  alertCircle,
  navigate,
  time
} from 'ionicons/icons';
import { notificationService, Notification } from '../../services/notificationService';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const notifications = ref<Notification[]>([]);

const unreadCount = computed(() => {
  return notifications.value.filter((n: Notification) => !n.read).length;
});

watch(() => props.isOpen, async (newValue) => {
  if (newValue) await loadNotifications();
});

const loadNotifications = async () => {
  notifications.value = await notificationService.getNotifications();
};

const closeModal = () => emit('close');

const handleNotificationClick = async (notification: Notification) => {
  if (!notification.read) {
    await notificationService.markAsRead(notification.id);
    await loadNotifications();
  }
};

const markAllAsRead = async () => {
  await notificationService.markAllAsRead();
  await loadNotifications();
};

const deleteNotification = async (id: string) => {
  // Optionnel : ajouter une animation de suppression ici avant de recharger
  await notificationService.deleteNotification(id);
  await loadNotifications();
};

const confirmClearAll = async () => {
  const alert = await alertController.create({
    header: 'Tout effacer ?',
    message: 'Cette action est irréversible.',
    cssClass: 'custom-alert',
    buttons: [
      { text: 'Annuler', role: 'cancel', cssClass: 'alert-cancel' },
      {
        text: 'Effacer',
        role: 'destructive',
        cssClass: 'alert-destructive',
        handler: async () => {
          await notificationService.clearAll();
          await loadNotifications();
        }
      }
    ]
  });
  await alert.present();
};

const getStatusClass = (status?: string) => {
  switch (status) {
    case 'TERMINE': return 'success';
    case 'EN_COURS': return 'warning';
    case 'ANNULE': return 'danger';
    default: return 'info';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'TERMINE': return checkmarkCircle;
    case 'EN_COURS': return construct;
    case 'ANNULE': return closeCircle;
    default: return alertCircle;
  }
};

const formatTime = (date: Date | string) => {
  const now = new Date();
  const notifDate = new Date(date);
  const diff = now.getTime() - notifDate.getTime();
  
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
  
  return notifDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};
</script>

<style scoped>
/* --- Configuration Globale --- */
ion-toolbar {
  --background: #ffffff;
  --border-width: 0;
  padding-top: 8px;
}

ion-title {
  font-weight: 700;
  font-size: 18px;
  color: #1e293b;
}

ion-content {
  --background: #f8fafc;
}

.content-wrapper {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 40px;
}

/* --- Boutons Header --- */
.close-button {
  --color: #64748b;
  --background: #f1f5f9;
  --border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-left: 8px;
}

.mark-read-btn {
  --color: #3b82f6;
  font-weight: 600;
  font-size: 14px;
}

.btn-text {
  margin-right: 4px;
}

/* --- Section Header --- */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background: #1e293b;
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

.header-label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.unread-badge {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 600;
  background: #eff6ff;
  padding: 4px 10px;
  border-radius: 8px;
}

/* --- Liste Notifications --- */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  background: #ffffff;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(226, 232, 240, 0.6);
  position: relative;
  transition: transform 0.2s, background-color 0.2s;
  cursor: pointer;
}

.notification-item:active {
  transform: scale(0.99);
  background-color: #fafafa;
}

/* Indicateur Non Lu (Fond légèrement teinté optionnel, ici on reste blanc mais on garde le point bleu) */
.notification-item.is-unread {
  background: #ffffff;
  border-color: #e2e8f0;
}

/* Gauche : Icône */
.item-left {
  margin-right: 16px;
}

.status-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.status-icon-wrapper.success { background: #dcfce7; color: #16a34a; }
.status-icon-wrapper.warning { background: #fef3c7; color: #d97706; }
.status-icon-wrapper.danger { background: #fee2e2; color: #dc2626; }
.status-icon-wrapper.info { background: #eff6ff; color: #2563eb; }

/* Centre : Body */
.item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; /* Pour l'ellipsis */
}

.body-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2px;
}

.notif-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.notification-item.is-unread .notif-title {
  font-weight: 700;
  color: #000000;
}

.time-stamp {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  margin-left: 8px;
}

.notif-message {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-footer {
  margin-top: 8px;
}

.route-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: #475569;
  font-weight: 500;
}

.route-badge ion-icon {
  font-size: 14px;
  color: #64748b;
}

/* Droite : Actions */
.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  margin-left: 12px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.blue-dot {
  width: 10px;
  height: 10px;
  background: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #eff6ff;
}

.delete-action {
  background: transparent;
  border: none;
  padding: 8px;
  margin-right: -8px;
  margin-bottom: -4px;
  color: #cbd5e1;
  border-radius: 50%;
  transition: color 0.2s;
}

.delete-action:active {
  background: #f1f5f9;
  color: #ef4444;
}

/* --- Empty State --- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-illustration {
  position: relative;
  width: 80px;
  height: 80px;
  background: #eff6ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: #3b82f6;
  font-size: 40px;
}

.pulse-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 2px solid #3b82f6;
  opacity: 0;
  animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.5); opacity: 0; }
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.empty-state p {
  color: #64748b;
  font-size: 14px;
  max-width: 250px;
  margin: 0;
}

/* --- Footer --- */
.footer-actions {
  margin-top: 32px;
  text-align: center;
}

.clear-all-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: all 0.2s;
  padding: 8px 16px;
}

.clear-all-btn:active {
  color: #ef4444;
}
</style>