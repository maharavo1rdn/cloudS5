<template>
    <ion-modal :is-open="isOpen" @didDismiss="closeModal" class="rounded-modal">
        <ion-header class="ion-no-border">
            <ion-toolbar>
                <ion-buttons slot="end">
                    <ion-button @click="closeModal" class="close-btn-round">
                        <ion-icon :icon="close"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding content-smooth">
            <div class="modal-wrapper">

                <!-- En-tête -->
                <div class="title-section">
                    <div class="icon-blob">
                        <ion-icon :icon="peopleSharp"></ion-icon>
                    </div>
                    <h1>Utilisateurs</h1>
                    <p>Gestion des comptes et accès</p>
                </div>

                <!-- Chargement -->
                <div v-if="loading" class="loading-box">
                    <ion-spinner name="crescent"></ion-spinner>
                </div>

                <!-- Contenu Principal -->
                <div v-else>
                    <!-- Résumé Stats -->
                    <div class="stats-row" v-if="users.length > 0">
                        <div class="stat-pill">
                            <span class="count">{{ users.length }}</span>
                            <span class="label">Total</span>
                        </div>
                        <div class="stat-pill danger" v-if="blockedCount > 0">
                            <span class="count">{{ blockedCount }}</span>
                            <span class="label">Bloqués</span>
                        </div>
                    </div>

                    <!-- Liste Vide -->
                    <div v-if="users.length === 0" class="empty-state">
                        <div class="empty-icon">
                            <ion-icon :icon="personAddOutline"></ion-icon>
                        </div>
                        <h3>Aucun utilisateur</h3>
                        <p>La base de données est vide pour le moment.</p>
                    </div>

                    <!-- Liste Utilisateurs -->
                    <div v-else class="user-list">
                        <div v-for="user in users" :key="user.id" class="user-card"
                            :class="{ 'blocked': user.blocked }">
                            <div class="card-main">
                                <!-- Avatar -->
                                <div class="avatar-circle" :class="getRoleClass(user.role_id)">
                                    {{ getInitials(user.username || user.email) }}
                                </div>

                                <!-- Infos -->
                                <div class="user-info">
                                    <div class="name-row">
                                        <span class="username">{{ user.username || 'Utilisateur sans nom' }}</span>
                                        <span class="role-badge" :class="getRoleClass(user.role_id)">
                                            {{ user.role_id === 1 ? 'ADMIN' : 'USER' }}
                                        </span>
                                    </div>
                                    <span class="email">{{ user.email }}</span>
                                    <div class="meta-row">
                                        <span class="date">Inscrit le {{ formatDate(user.createdAt) }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- État Bloqué + Action -->
                            <div v-if="user.blocked" class="blocked-state">
                                <div class="blocked-info">
                                    <ion-icon :icon="lockClosed" class="lock-icon"></ion-icon>
                                    <span>Accès suspendu</span>
                                </div>
                                <button class="unblock-btn" @click="unblock(user)">
                                    Débloquer
                                </button>
                            </div>

                            <!-- Actions Modifier/Supprimer -->
                            <div class="actions-row">
                                <button class="action-btn edit-btn" @click="editUser(user)">
                                    <ion-icon :icon="pencil"></ion-icon>
                                    Modifier
                                </button>
                                <button class="action-btn delete-btn" @click="confirmDelete(user)">
                                    <ion-icon :icon="trash"></ion-icon>
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Feedback -->
                <div v-if="error" class="feedback-msg error">
                    <ion-icon :icon="alertCircle"></ion-icon> {{ error }}
                </div>

            </div>
        </ion-content>

        <EditUserModal
            :is-open="showEditModal"
            :user="selectedUser"
            @close="showEditModal = false"
            @success="handleEditSuccess"
        />
    </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
    IonModal, IonHeader, IonToolbar, IonButtons, IonButton,
    IonContent, IonSpinner, IonIcon, alertController
} from '@ionic/vue';
import {
    close, peopleSharp, personAddOutline, lockClosed, alertCircle, trash, pencil
} from 'ionicons/icons';
import userService from '../../services/userService';
import EditUserModal from './EditUserModal.vue';

interface User {
    id: string;
    email: string;
    username: string;
    role_id?: number;
    blocked?: boolean;
    createdAt?: Date;
}

interface Props { isOpen: boolean; }
const props = defineProps<Props>();
const emit = defineEmits(['close', 'success']);

const users = ref<User[]>([]);
const loading = ref(false);
const error = ref('');
const showEditModal = ref(false);
const selectedUser = ref<User | null>(null);

const blockedCount = computed(() => users.value.filter(u => u.blocked).length);

watch(() => props.isOpen, (isOpen) => {
    if (isOpen) loadUsers();
});

const loadUsers = async () => {
    loading.value = true;
    error.value = '';
    try {
        users.value = await userService.getAllUsers();
    } catch (err) {
        console.error(err);
        error.value = 'Impossible de charger la liste.';
    } finally {
        loading.value = false;
    }
};

const unblock = async (user: User) => {
    try {
        await userService.unblockUser(user.id);
        await loadUsers(); // Rafraîchir
        emit('success');
    } catch (err) {
        error.value = 'Erreur lors du déblocage.';
    }
};

const editUser = (user: User) => {
    selectedUser.value = user;
    showEditModal.value = true;
};

const handleEditSuccess = async () => {
    showEditModal.value = false;
    await loadUsers();
    emit('success');
};

const confirmDelete = async (user: User) => {
    const alert = await alertController.create({
        header: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer <strong>${user.email}</strong> ? Cette action est irréversible.`,
        buttons: [
            {
                text: 'Annuler',
                role: 'cancel',
            },
            {
                text: 'Supprimer',
                role: 'destructive',
                handler: async () => {
                    try {
                        await userService.deleteUser(user.id);
                        await loadUsers();
                        emit('success');
                    } catch (err) {
                        error.value = 'Erreur lors de la suppression.';
                    }
                },
            },
        ],
    });
    await alert.present();
};

// Helpers
const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
};

const getRoleClass = (roleId?: number) => {
    return roleId === 1 ? 'admin' : 'user';
};

const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: '2-digit'
    });
};

const closeModal = () => emit('close');
</script>

<style scoped>
/* --- MODAL STYLE --- */
ion-modal.rounded-modal {
    --border-radius: 40px;
    --background: #ffffff;
}

ion-toolbar {
    --background: transparent;
    --border-width: 0;
}

.content-smooth {
    --background: #ffffff;
}

.close-btn-round {
    --color: #1e293b;
    --background: #f1f5f9;
    --border-radius: 50%;
    width: 40px;
    height: 40px;
    margin-right: 12px;
}

.modal-wrapper {
    padding: 0 20px 40px;
}

/* --- HEADER --- */
.title-section {
    text-align: center;
    margin-bottom: 24px;
}

.icon-blob {
    width: 72px;
    height: 72px;
    background: #f1f5f9;
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    font-size: 32px;
    color: #0f172a;
}

.title-section h1 {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
}

.title-section p {
    color: #64748b;
    font-size: 16px;
    margin-top: 4px;
}

/* --- STATS PILLS --- */
.stats-row {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
}

.stat-pill {
    background: #f8fafc;
    border-radius: 12px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
}

.stat-pill .count {
    background: #ffffff;
    padding: 2px 8px;
    border-radius: 6px;
    color: #0f172a;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-pill.danger {
    background: #fef2f2;
    color: #ef4444;
}

.stat-pill.danger .count {
    color: #ef4444;
}

/* --- USER LIST --- */
.user-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.user-card {
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    transition: all 0.2s;
}

.user-card.blocked {
    border-color: #fee2e2;
    background: #fffafa;
}

.card-main {
    display: flex;
    align-items: center;
    gap: 16px;
}

/* Avatar */
.avatar-circle {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
}

.avatar-circle.admin {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.avatar-circle.user {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
}

/* Info */
.user-info {
    flex: 1;
    min-width: 0;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
}

.username {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.role-badge {
    font-size: 10px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.role-badge.admin {
    background: #eff6ff;
    color: #2563eb;
}

.role-badge.user {
    background: #f1f5f9;
    color: #64748b;
}

.email {
    display: block;
    font-size: 13px;
    color: #64748b;
    margin-bottom: 4px;
}

.meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.date {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
}

/* --- ACTIONS ROW --- */
.actions-row {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
}

.action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 12px;
    border: 2px solid;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s ease;
    cursor: pointer;
}

.edit-btn {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;
}

.edit-btn:hover {
    background: #dbeafe;
    border-color: #93c5fd;
}

.delete-btn {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
}

.delete-btn:hover {
    background: #fee2e2;
    border-color: #fca5a5;
}

.action-btn ion-icon {
    font-size: 16px;
}

/* --- BLOCKED STATE --- */
.blocked-state {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #fee2e2;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.blocked-info {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ef4444;
    font-size: 13px;
    font-weight: 600;
}

.unblock-btn {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 6px 16px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    transition: all 0.2s;
}

.unblock-btn:active {
    background: #f1f5f9;
    transform: scale(0.95);
}

/* --- FEEDBACK & EMPTY --- */
.feedback-msg {
    margin-top: 16px;
    padding: 12px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
}

.feedback-msg.error {
    background: #fef2f2;
    color: #ef4444;
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
}

.empty-icon {
    font-size: 48px;
    color: #cbd5e1;
    margin-bottom: 16px;
}

.empty-state h3 {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px;
}

.empty-state p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
}

.loading-box {
    display: flex;
    justify-content: center;
    padding: 40px;
}
</style>