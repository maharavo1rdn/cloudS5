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

                <div class="title-section">
                    <div class="icon-blob">
                        <ion-icon :icon="settingsSharp"></ion-icon>
                    </div>
                    <h1>Paramètres</h1>
                    <p>Configuration globale</p>
                </div>

                <div v-if="loading" class="loading-box">
                    <ion-spinner name="crescent"></ion-spinner>
                </div>

                <div v-else class="form-container">

                    <!-- FINANCE (Avec formateur de prix) -->
                    <div class="form-group">
                        <label class="group-label">FINANCE</label>

                        <div class="input-field highlight big-field">
                            <div class="field-icon">
                                <ion-icon :icon="cashOutline"></ion-icon>
                            </div>
                            <div class="input-content">
                                <label>Prix de référence (m²)</label>
                                <!-- Type tel pour clavier numérique, mais accepte les espaces -->
                                <ion-input v-model="displayPrice" @ionInput="onPriceInput" type="tel"
                                    inputmode="numeric" placeholder="0" class="clean-input price-input"></ion-input>
                            </div>
                            <span class="suffix-badge">Ar</span>
                        </div>
                    </div>

                    <!-- SÉCURITÉ (Avec boutons +/- personnalisés) -->
                    <div class="form-group">
                        <label class="group-label">SÉCURITÉ</label>

                        <!-- Tentatives -->
                        <div class="control-row">
                            <div class="control-info">
                                <span class="control-title">Tentatives Max</span>
                                <span class="control-desc">Avant blocage du compte</span>
                            </div>
                            <div class="stepper">
                                <button @click="decrement('max_login_attempts')" class="step-btn">-</button>
                                <div class="step-value">{{ settingsForm.max_login_attempts }}</div>
                                <button @click="increment('max_login_attempts')" class="step-btn">+</button>
                            </div>
                        </div>

                        <div class="divider"></div>

                        <!-- Blocage -->
                        <div class="control-row">
                            <div class="control-info">
                                <span class="control-title">Durée Blocage</span>
                                <span class="control-desc">Temps d'attente (minutes)</span>
                            </div>
                            <div class="stepper">
                                <button @click="decrement('block_duration_minutes', 5)" class="step-btn">-</button>
                                <div class="step-value">{{ settingsForm.block_duration_minutes }}</div>
                                <button @click="increment('block_duration_minutes', 5)" class="step-btn">+</button>
                            </div>
                        </div>

                        <div class="divider"></div>

                        <!-- Session -->
                        <div class="control-row">
                            <div class="control-info">
                                <span class="control-title">Session</span>
                                <span class="control-desc">Expiration (heures)</span>
                            </div>
                            <div class="stepper">
                                <button @click="decrement('session_lifetime_hours')" class="step-btn">-</button>
                                <div class="step-value">{{ settingsForm.session_lifetime_hours }}</div>
                                <button @click="increment('session_lifetime_hours')" class="step-btn">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="footer-section">
                    <ion-button expand="block" class="action-btn" @click="saveSettings" :disabled="saving || loading">
                        <span v-if="!saving">Enregistrer les modifications</span>
                        <ion-spinner v-else name="crescent"></ion-spinner>
                    </ion-button>
                </div>

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
    close, settingsSharp, cashOutline
} from 'ionicons/icons';
import settingsService from '../../services/settingsService';

interface Props { isOpen: boolean; }
const props = defineProps<Props>();
const emit = defineEmits(['close']);

const loading = ref(false);
const saving = ref(false);
const displayPrice = ref(''); // Variable tampon pour l'affichage (ex: "50 000")

const settingsForm = ref({
    prix_par_m2: 0,
    max_login_attempts: 3,
    block_duration_minutes: 15,
    session_lifetime_hours: 24,
});

// Formater un nombre (10000 -> "10 000")
const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// Nettoyer une chaine ("10 000" -> 10000)
const cleanNumber = (str: string | number) => {
    return Number(String(str).replace(/\s/g, ''));
};

watch(() => props.isOpen, async (open) => {
    if (open) await loadSettings();
});

const loadSettings = async () => {
    loading.value = true;
    try {
        const [prixM2, maxAttempts, blockDuration, sessionLifetime] = await Promise.all([
            settingsService.getSetting('prix_par_m2', 0),
            settingsService.getSetting('max_login_attempts', 3),
            settingsService.getSetting('block_duration_minutes', 15),
            settingsService.getSetting('session_lifetime_hours', 24),
        ]);

        settingsForm.value = {
            prix_par_m2: Number(prixM2),
            max_login_attempts: Number(maxAttempts),
            block_duration_minutes: Number(blockDuration),
            session_lifetime_hours: Number(sessionLifetime),
        };

        // Initialiser l'affichage formaté
        displayPrice.value = formatNumber(settingsForm.value.prix_par_m2);

    } catch (err) { console.error(err); }
    finally { loading.value = false; }
};

// Gérer la saisie du prix (formatage en temps réel)
const onPriceInput = (event: CustomEvent) => {
    const rawValue = event.detail.value;
    if (!rawValue) return;

    // 1. On garde seulement les chiffres
    const numericValue = cleanNumber(rawValue);

    // 2. On met à jour la vraie valeur pour la BDD
    settingsForm.value.prix_par_m2 = numericValue;

    displayPrice.value = formatNumber(numericValue);
};

// Fonctions pour les boutons +/-
const increment = (field: keyof typeof settingsForm.value, step = 1) => {
    settingsForm.value[field] += step;
};

const decrement = (field: keyof typeof settingsForm.value, step = 1) => {
    if (settingsForm.value[field] - step > 0) {
        settingsForm.value[field] -= step;
    }
};

const saveSettings = async () => {
    saving.value = true;
    try {
        // On s'assure que le prix est bien propre avant envoi
        const finalPrice = cleanNumber(displayPrice.value);

        await Promise.all([
            settingsService.updateSetting('prix_par_m2', finalPrice, 'number'),
            settingsService.updateSetting('max_login_attempts', settingsForm.value.max_login_attempts, 'number'),
            settingsService.updateSetting('block_duration_minutes', settingsForm.value.block_duration_minutes, 'number'),
            settingsService.updateSetting('session_lifetime_hours', settingsForm.value.session_lifetime_hours, 'number'),
        ]);
        emit('close');
    } catch (err) { console.error(err); }
    finally { saving.value = false; }
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

/* --- TITLE --- */
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
    font-size: 36px;
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
.group-label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.1em;
    margin-bottom: 16px;
    padding-left: 4px;
}

/* --- CHAMP PRIX (Style Highlight) --- */
.input-field.highlight {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 20px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.2s;
}

.input-field.highlight:focus-within {
    border-color: #3b82f6;
    background: #fff;
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.1);
}

.field-icon {
    width: 44px;
    height: 44px;
    background: #dbeafe;
    color: #2563eb;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.input-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.input-content label {
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 2px;
}

/* Correction Curseur + Style Input */
.clean-input {
    --padding-start: 0;
    --padding-end: 0;
    --background: transparent;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    --color: #0f172a;
    /* Force la couleur du texte */
    caret-color: #3b82f6;
    /* Force la couleur du curseur (Bleu) */
}

.suffix-badge {
    font-size: 14px;
    font-weight: 700;
    color: #64748b;
    background: #e2e8f0;
    padding: 4px 8px;
    border-radius: 6px;
}

/* --- STEPPERS (Remplacement des chevrons) --- */
.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
}

.control-title {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
}

.control-desc {
    display: block;
    font-size: 13px;
    color: #64748b;
}

.stepper {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 14px;
}

.step-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: #ffffff;
    color: #0f172a;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: active 0.1s;
}

.step-btn:active {
    transform: scale(0.95);
    background: #e2e8f0;
}

.step-value {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    min-width: 24px;
    text-align: center;
}

.divider {
    height: 1px;
    background: #f1f5f9;
    margin: 8px 0;
}

.footer-section {
    margin-top: 40px;
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