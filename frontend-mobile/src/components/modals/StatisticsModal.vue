<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Tableau de récapitulation</ion-title>
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
          <ion-icon :icon="statsChart"></ion-icon>
        </div>
        <h2 class="header-title">Statistiques globales</h2>
        <p class="header-subtitle">Vue d'ensemble des signalements et indicateurs clés</p>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-card">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <span class="loading-text">Chargement des statistiques</span>
          <span class="loading-subtext">Veuillez patienter...</span>
        </div>
      </div>

      <div v-else class="stats-container">
        <!-- Cartes de statistiques principales -->
        <div class="stats-grid">
          <div class="stat-card primary-card">
            <div class="stat-icon">
              <ion-icon :icon="location"></ion-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Nombre de points</div>
              <div class="stat-value">{{ stats.totalPoints }}</div>
            </div>
          </div>

          <div class="stat-card success-card">
            <div class="stat-icon">
              <ion-icon :icon="resize"></ion-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Surface totale</div>
              <div class="stat-value">{{ formatNumber(stats.totalSurface) }} m²</div>
            </div>
          </div>

          <div class="stat-card warning-card">
            <div class="stat-icon">
              <ion-icon :icon="cash"></ion-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Budget total</div>
              <div class="stat-value">{{ formatNumber(stats.totalBudget) }} Ar</div>
            </div>
          </div>

          <div class="stat-card info-card">
            <div class="stat-icon">
              <ion-icon :icon="trendingUp"></ion-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Avancement moyen</div>
              <div class="stat-value">{{ stats.averageProgress }}%</div>
            </div>
          </div>
        </div>

        <!-- Barre de progression globale -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Progression globale</span>
            <span class="progress-percentage">{{ stats.averageProgress }}%</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${stats.averageProgress}%` }"
            ></div>
          </div>
        </div>

        <!-- Répartition par statut -->
        <div class="status-breakdown">
          <h3 class="section-title">Répartition par statut</h3>
          <div class="status-list">
            <div class="status-item">
              <div class="status-info">
                <span class="status-badge nouveau">NOUVEAU</span>
                <span class="status-label">Nouveaux signalements</span>
              </div>
              <span class="status-count">{{ stats.byStatus.NOUVEAU || 0 }}</span>
            </div>
            <div class="status-item">
              <div class="status-info">
                <span class="status-badge en_cours">EN COURS</span>
                <span class="status-label">En cours de traitement</span>
              </div>
              <span class="status-count">{{ stats.byStatus.EN_COURS || 0 }}</span>
            </div>
            <div class="status-item">
              <div class="status-info">
                <span class="status-badge termine">TERMINÉ</span>
                <span class="status-label">Travaux terminés</span>
              </div>
              <span class="status-count">{{ stats.byStatus.TERMINE || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Informations détaillées -->
        <div class="details-section">
          <h3 class="section-title">Informations détaillées</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <ion-icon :icon="business" class="detail-icon"></ion-icon>
              <div class="detail-content">
                <span class="detail-label">Entreprises impliquées</span>
                <span class="detail-value">{{ stats.totalEnterprises }}</span>
              </div>
            </div>
            <div class="detail-item">
              <ion-icon :icon="construct" class="detail-icon"></ion-icon>
              <div class="detail-content">
                <span class="detail-label">Points avec budget</span>
                <span class="detail-value">{{ stats.pointsWithBudget }}</span>
              </div>
            </div>
            <div class="detail-item">
              <ion-icon :icon="calendar" class="detail-icon"></ion-icon>
              <div class="detail-content">
                <span class="detail-label">Points planifiés</span>
                <span class="detail-value">{{ stats.pointsWithDates }}</span>
              </div>
            </div>
            <div class="detail-item">
              <ion-icon :icon="checkmarkCircle" class="detail-icon"></ion-icon>
              <div class="detail-content">
                <span class="detail-label">Taux de complétion</span>
                <span class="detail-value">{{ stats.completionRate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
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
  statsChart,
  location,
  resize,
  cash,
  trendingUp,
  business,
  construct,
  calendar,
  checkmarkCircle,
} from 'ionicons/icons';
import type { Point } from '../../types/route.types';

interface Props {
  isOpen: boolean;
  routes: Point[];
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

const loading = ref(false);

interface Statistics {
  totalPoints: number;
  totalSurface: number;
  totalBudget: number;
  averageProgress: number;
  byStatus: Record<string, number>;
  totalEnterprises: number;
  pointsWithBudget: number;
  pointsWithDates: number;
  completionRate: number;
}

const stats = computed<Statistics>(() => {
  const routes = props.routes || [];
  
  // Calculs de base
  const totalPoints = routes.length;
  const totalSurface = routes.reduce((sum, r) => sum + (r.surface_m2 || 0), 0);
  const totalBudget = routes.reduce((sum, r) => sum + (r.budget || 0), 0);
  
  // Avancement moyen (seulement les points avec avancement défini)
  const routesWithProgress = routes.filter(r => r.avancement_pourcentage != null);
  const totalProgress = routesWithProgress.reduce((sum, r) => sum + (r.avancement_pourcentage || 0), 0);
  const averageProgress = routesWithProgress.length > 0 
    ? Math.round(totalProgress / routesWithProgress.length) 
    : 0;
  
  // Répartition par statut
  const byStatus: Record<string, number> = {};
  routes.forEach(r => {
    const status = r.point_statut || 'NOUVEAU';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  
  // Entreprises uniques
  const uniqueEnterprises = new Set(
    routes
      .filter(r => r.entreprise_id)
      .map(r => r.entreprise_id)
  );
  const totalEnterprises = uniqueEnterprises.size;
  
  // Points avec budget
  const pointsWithBudget = routes.filter(r => r.budget && r.budget > 0).length;
  
  // Points avec dates planifiées
  const pointsWithDates = routes.filter(r => r.date_debut || r.date_fin).length;
  
  // Taux de complétion (points TERMINE / total)
  const completedPoints = byStatus['TERMINE'] || 0;
  const completionRate = totalPoints > 0 
    ? Math.round((completedPoints / totalPoints) * 100) 
    : 0;
  
  return {
    totalPoints,
    totalSurface,
    totalBudget,
    averageProgress,
    byStatus,
    totalEnterprises,
    pointsWithBudget,
    pointsWithDates,
    completionRate,
  };
});

const formatNumber = (num: number): string => {
  return num.toLocaleString('fr-FR');
};

const closeModal = () => {
  emit('close');
};
</script>

<style scoped lang="scss">
.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.header-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);

  ion-icon {
    font-size: 40px;
    color: #2563eb;
  }
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.header-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}

.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.loading-text {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.loading-subtext {
  font-size: 13px;
  color: #64748b;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.98);
  }
}

.primary-card {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);

  .stat-icon ion-icon {
    color: #2563eb;
  }

  .stat-value {
    color: #1e40af;
  }
}

.success-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);

  .stat-icon ion-icon {
    color: #16a34a;
  }

  .stat-value {
    color: #15803d;
  }
}

.warning-card {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);

  .stat-icon ion-icon {
    color: #d97706;
  }

  .stat-value {
    color: #b45309;
  }
}

.info-card {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);

  .stat-icon ion-icon {
    color: #7c3aed;
  }

  .stat-value {
    color: #6d28d9;
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;

  ion-icon {
    font-size: 24px;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.progress-section {
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.progress-percentage {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.progress-bar {
  height: 12px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0f172a 0%, #2563eb 100%);
  border-radius: 999px;
  transition: width 0.6s ease;
}

.status-breakdown,
.details-section {
  padding: 20px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px 0;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: background 0.2s ease;

  &:active {
    background: #f1f5f9;
  }
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.nouveau {
    background: #dbeafe;
    color: #1e40af;
  }

  &.en_cours {
    background: #fef3c7;
    color: #b45309;
  }

  &.termine {
    background: #dcfce7;
    color: #15803d;
  }
}

.status-label {
  font-size: 14px;
  color: #475569;
}

.status-count {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.detail-grid {
  display: grid;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: background 0.2s ease;

  &:active {
    background: #f1f5f9;
  }
}

.detail-icon {
  font-size: 24px;
  color: #2563eb;
  flex-shrink: 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.detail-value {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 640px) {
  .stats-container { gap: 16px; }

  .modal-header { margin-bottom: 20px; padding: 12px 8px; }
  .header-icon { width: 64px; height: 64px; }
  .header-icon ion-icon { font-size: 28px; }
  .header-title { font-size: 20px; }
  .header-subtitle { font-size: 13px; }

  .stats-grid { grid-template-columns: 1fr; gap: 12px; }
  .stat-card { padding: 14px; border-radius: 12px; }
  .stat-value { font-size: 20px; }
  .stat-label { font-size: 11px; }

  .progress-section { padding: 12px; }
  .progress-bar { height: 10px; }

  .detail-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .detail-item { padding: 12px; }
  .section-title { font-size: 14px; margin-bottom: 12px; }
}

@media (max-width: 360px) {
  .header-icon { width: 56px; height: 56px; }
  .stat-value { font-size: 18px; }
  .detail-grid { grid-template-columns: 1fr; }
  .detail-value { font-size: 16px; }
}
</style>
