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
                        <ion-icon :icon="pencilSharp"></ion-icon>
                    </div>
                    <h1>Modifier le profil</h1>
                    <p>Mise à jour des informations compte</p>
                </div>

                <form @submit.prevent="handleSubmit" class="form-container">

                    <!-- Groupe Identité -->
                    <div class="form-group">
                        <label class="group-label">IDENTITÉ</label>

                        <!-- Username -->
                        <div class="input-field">
                            <div class="field-icon">
                                <ion-icon :icon="personOutline"></ion-icon>
                            </div>
                            <div class="input-wrapper">
                                <label>Nom d'utilisateur</label>
                                <ion-input v-model="form.username" type="text" placeholder="Ex: Jean Dupont"
                                    class="clean-input" required></ion-input>
                            </div>
                        </div>

                        <!-- Email -->
                        <div class="input-field mt-2">
                            <div class="field-icon">
                                <ion-icon :icon="mailOutline"></ion-icon>
                            </div>
                            <div class="input-wrapper">
                                <label>Adresse Email</label>
                                <ion-input v-model="form.email" type="email" placeholder="contact@email.com"
                                    class="clean-input" required></ion-input>
                            </div>
                        </div>
                    </div>

                    <!-- Groupe Rôle (Sélecteur visuel) -->
                    <div class="form-group">
                        <label class="group-label">RÔLE & PERMISSIONS</label>

                        <div class="role-selector">
                            <!-- Option Utilisateur -->
                            <div class="role-card" :class="{ active: form.role === 'utilisateur' }"
                                @click="form.role = 'utilisateur'">
                                <div class="check-circle">
                                    <ion-icon :icon="checkmark"></ion-icon>
                                </div>
                                <ion-icon :icon="person" class="role-icon"></ion-icon>
                                <span class="role-name">Utilisateur</span>
                            </div>

                            <!-- Option Manager -->
                            <div class="role-card" :class="{ active: form.role === 'manager' }"
                                @click="form.role = 'manager'">
                                <div class="check-circle">
                                    <ion-icon :icon="checkmark"></ion-icon>
                                </div>
                                <ion-icon :icon="shieldCheckmark" class="role-icon"></ion-icon>
                                <span class="role-name">Manager</span>
                            </div>
                        </div>
                    </div>

                    <!-- Feedback -->
                    <div v-if="error" class="feedback-msg error">
                        <ion-icon :icon="alertCircle"></ion-icon> {{ error }}
                    </div>
                    <div v-if="success" class="feedback-msg success">
                        <ion-icon :icon="checkmarkCircle"></ion-icon> {{ success }}
                    </div>

                    <!-- Actions -->
                    <div class="footer-actions">
                        <ion-button type="submit" expand="block" class="action-btn" :disabled="saving">
                            <span v-if="!saving">Sauvegarder</span>
                            <ion-spinner v-else name="crescent"></ion-spinner>
                        </ion-button>
                    </div>

                </form>

            </div>
        </ion-content>
    </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
    IonModal, IonHeader, IonToolbar, IonButtons, IonButton,
    IonContent, IonInput, IonSpinner, IonIcon
} from '@ionic/vue';
import {
    close, pencilSharp, personOutline, mailOutline,
    person, shieldCheckmark, checkmark,
    alertCircle, checkmarkCircle
} from 'ionicons/icons';
import userService from '../../services/userService';

interface User {
    id: string;
    username: string;
    email: string;
    role?: string;
    role_id?: number;
}

interface Props {
    isOpen: boolean;
    user: User | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'success']);

const form = ref({
    username: '',
    email: '',
    role: 'utilisateur',
});

const saving = ref(false);
const error = ref('');
const success = ref('');

// Init form
watch(() => props.user, (newUser) => {
    if (newUser) {
        form.value = {
            username: newUser.username || '',
            email: newUser.email || '',
            role: newUser.role_id === 1 ? 'manager' : 'utilisateur',
        };
    }
}, { immediate: true });

const handleSubmit = async () => {
    if (!props.user) return;
    saving.value = true;
    error.value = '';
    success.value = '';

    try {
        // Simulation d'appel API (remplacer par votre vrai service)
        await userService.updateUser(props.user.id, {
            username: form.value.username,
            email: form.value.email,
            role: form.value.role,
        });

        success.value = 'Profil mis à jour !';
        setTimeout(() => {
            emit('success');
            closeModal();
        }, 1000);
    } catch (err) {
        console.error(err);
        error.value = 'Erreur lors de la mise à jour.';
    } finally {
        saving.value = false;
    }
};

const closeModal = () => {
    error.value = '';
    success.value = '';
    emit('close');
};
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
    margin-bottom: 32px;
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

/* --- FORM --- */
.form-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.group-label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
    padding-left: 4px;
}

/* Input Fields */
.input-field {
    background: #f8fafc;
    border-radius: 20px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    border: 2px solid transparent;
    transition: all 0.2s;
}

.input-field:focus-within {
    background: #ffffff;
    border-color: #0f172a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
}

.mt-2 {
    margin-top: 12px;
}

.field-icon {
    font-size: 24px;
    color: #64748b;
    width: 24px;
    display: flex;
    justify-content: center;
}

.input-field:focus-within .field-icon {
    color: #0f172a;
}

.input-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.input-wrapper label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 2px;
}

.clean-input {
    --padding-start: 0;
    --padding-end: 0;
    --background: transparent;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    --placeholder-color: #cbd5e1;
}

/* --- ROLE SELECTOR (Cards) --- */
.role-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.role-card {
    background: #f8fafc;
    border: 2px solid #f1f5f9;
    border-radius: 20px;
    padding: 20px;
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    transition: all 0.2s;
}

.role-icon {
    font-size: 32px;
    color: #94a3b8;
    transition: color 0.2s;
}

.role-name {
    font-size: 14px;
    font-weight: 700;
    color: #64748b;
}

.check-circle {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Active State */
.role-card.active {
    background: #eff6ff;
    border-color: #3b82f6;
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.1);
}

.role-card.active .role-icon {
    color: #3b82f6;
}

.role-card.active .role-name {
    color: #1e3a8a;
}

.role-card.active .check-circle {
    background: #3b82f6;
    opacity: 1;
    transform: scale(1);
}

/* --- FEEDBACK --- */
.feedback-msg {
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

.feedback-msg.success {
    background: #f0fdf4;
    color: #16a34a;
}

/* --- ACTIONS --- */
.footer-actions {
    margin-top: 24px;
}

.action-btn {
    --background: #0f172a;
    --color: #ffffff;
    --border-radius: 20px;
    font-weight: 700;
    font-size: 16px;
    height: 56px;
    --box-shadow: 0 10px 20px rgba(15, 23, 42, 0.15);
}
</style>