<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Réinitialiser tentatives</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal" fill="clear">
            <ion-icon :icon="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="handleReset" class="reset-form">
        <div class="input-wrapper">
          <label class="input-label">Email de l'utilisateur</label>
          <div class="input-container">
            <ion-input v-model="email" type="email" placeholder="utilisateur@example.com" required></ion-input>
          </div>
        </div>

        <div v-if="error" class="alert alert-error">
          <ion-icon :icon="alertCircle"></ion-icon>
          <div class="alert-content">{{ error }}</div>
        </div>

        <div v-if="success" class="alert alert-success">
          <ion-icon :icon="checkmarkCircle"></ion-icon>
          <div class="alert-content">{{ success }}</div>
        </div>

        <ion-button type="submit" expand="block" :disabled="loading">
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          <span v-else>Réinitialiser</span>
        </ion-button>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonInput, IonSpinner, IonIcon } from '@ionic/vue';
import { close, alertCircle, checkmarkCircle } from 'ionicons/icons';
import loginAttemptService from '../../services/loginAttemptService';

interface Props { isOpen: boolean }
const props = defineProps<Props>();
const emit = defineEmits(['close', 'success']);

const email = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

const handleReset = async () => {
  if (!email.value) return;
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    await loginAttemptService.resetAttempt(email.value);
    success.value = `Tentatives réinitialisées pour ${email.value}`;
    setTimeout(() => {
      emit('success');
      closeModal();
    }, 1200);
  } catch (err) {
    console.error(err);
    error.value = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation';
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  email.value = '';
  error.value = '';
  success.value = '';
  emit('close');
};
</script>

<style scoped>
.reset-form { max-width: 420px; margin: 0 auto; }
.input-wrapper { margin-bottom: 16px; }
.input-label { font-weight: 700; margin-bottom: 8px; display: block; }
.input-container { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; }
.alert { padding: 12px; border-radius: 8px; margin-bottom: 12px; }
.alert-error { background: #fff5f5; border: 1px solid #fecaca; color: #b91c1c; }
.alert-success { background: #f0fff4; border: 1px solid #bbf7d0; color: #14532d; }
</style>