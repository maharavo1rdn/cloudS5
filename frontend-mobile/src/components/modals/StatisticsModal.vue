<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal" class="stats-modal">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title mode="ios">Tableau de bord</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal" class="close-button">
            <ion-icon :icon="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="content-container">

        <!-- En-tête avec Date -->
        <div class="page-header">
          <h1>Vue d'ensemble</h1>
          <p class="subtitle">Données mises à jour aujourd'hui</p>
        </div>

        <div v-if="loading" class="loading-container">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
        </div>

        <div v-else class="dashboard-grid">

          <!-- Carte Principale: Progression -->
          <div class="card main-card">
            <div class="card-header">
              <span class="card-label">Avancement Global</span>
              <ion-icon :icon="trendingUp" class="trend-icon"></ion-icon>
            </div>
            <div class="main-metric">
              {{ stats.averageProgress }}<span class="percent">%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${stats.averageProgress}%` }"></div>
            </div>
            <p class="card-footer-text">Moyenne sur {{ stats.totalPoints }} points de contrôle</p>
          </div>

          <!-- Grille de KPIs (Key Performance Indicators) -->
          <div class="kpi-grid">
            <!-- Surface -->
            <div class="kpi-card">
              <div class="icon-box blue">
                <ion-icon :icon="resize"></ion-icon>
              </div>
              <div class="kpi-content">
                <span class="kpi-label">Surface</span>
                <span class="kpi-value">{{ formatNumber(stats.totalSurface) }} <small>m²</small></span>
              </div>
            </div>

            <!-- Budget -->
            <div class="kpi-card">
              <div class="icon-box green">
                <ion-icon :icon="cash"></ion-icon>
              </div>
              <div class="kpi-content">
                <span class="kpi-label">Budget</span>
                <span class="kpi-value">{{ formatCurrency(stats.totalBudget) }}</span>
              </div>
            </div>
          </div>

          <!-- Section Statuts -->
          <div class="section-title">Répartition des travaux</div>
          <div class="card list-card">

            <div class="status-row">
              <div class="status-indicator warning">
                <ion-icon :icon="alertCircle"></ion-icon>
              </div>
              <div class="status-details">
                <span class="status-name">Nouveaux signalements</span>
                <div class="mini-bar-bg">
                  <div class="mini-bar-fill warning" :style="{ width: getPercentage(stats.byStatus.NOUVEAU) + '%' }">
                  </div>
                </div>
              </div>
              <div class="status-count">{{ stats.byStatus.NOUVEAU || 0 }}</div>
            </div>

            <div class="divider"></div>

            <div class="status-row">
              <div class="status-indicator info">
                <ion-icon :icon="time"></ion-icon>
              </div>
              <div class="status-details">
                <span class="status-name">En cours de traitement</span>
                <div class="mini-bar-bg">
                  <div class="mini-bar-fill info" :style="{ width: getPercentage(stats.byStatus.EN_COURS) + '%' }">
                  </div>
                </div>
              </div>
              <div class="status-count">{{ stats.byStatus.EN_COURS || 0 }}</div>
            </div>

            <div class="divider"></div>

            <div class="status-row">
              <div class="status-indicator success">
                <ion-icon :icon="checkmarkCircle"></ion-icon>
              </div>
              <div class="status-details">
                <span class="status-name">Terminés</span>
                <div class="mini-bar-bg">
                  <div class="mini-bar-fill success" :style="{ width: getPercentage(stats.byStatus.TERMINE) + '%' }">
                  </div>
                </div>
              </div>
              <div class="status-count">{{ stats.byStatus.TERMINE || 0 }}</div>
            </div>
          </div>

          <!-- Section Détails (Grid 2x2) -->
          <div class="section-title">Métriques opérationnelles</div>
          <div class="details-grid">
            <div class="detail-tile">
              <span class="tile-value">{{ stats.totalEnterprises }}</span>
              <span class="tile-label">Entreprises</span>
            </div>
            <div class="detail-tile">
              <span class="tile-value">{{ stats.pointsWithBudget }}</span>
              <span class="tile-label">Points budgetés</span>
            </div>
            <div class="detail-tile">
              <span class="tile-value">{{ stats.pointsWithDates }}</span>
              <span class="tile-label">Planifiés</span>
            </div>
            <div class="detail-tile highlight">
              <span class="tile-value">{{ stats.completionRate }}%</span>
              <span class="tile-label">Taux complétion</span>
            </div>
          </div>

        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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
  resize,
  cash,
  trendingUp,
  checkmarkCircle,
  time,
  alertCircle
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
  const totalPoints = routes.length;
  const totalSurface = routes.reduce((sum, r) => sum + (r.surface_m2 || 0), 0);
  const totalBudget = routes.reduce((sum, r) => sum + (r.budget || 0), 0);

  const routesWithProgress = routes.filter(r => r.avancement_pourcentage != null);
  const totalProgress = routesWithProgress.reduce((sum, r) => sum + (r.avancement_pourcentage || 0), 0);
  const averageProgress = routesWithProgress.length > 0
    ? Math.round(totalProgress / routesWithProgress.length)
    : 0;

  const byStatus: Record<string, number> = {};
  routes.forEach(r => {
    const status = r.point_statut || 'NOUVEAU';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });

  const uniqueEnterprises = new Set(routes.filter(r => r.entreprise_id).map(r => r.entreprise_id));
  const completedPoints = byStatus['TERMINE'] || 0;

  return {
    totalPoints,
    totalSurface,
    totalBudget,
    averageProgress,
    byStatus,
    totalEnterprises: uniqueEnterprises.size,
    pointsWithBudget: routes.filter(r => r.budget && r.budget > 0).length,
    pointsWithDates: routes.filter(r => r.date_debut || r.date_fin).length,
    completionRate: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
  };
});

const formatNumber = (num: number) => num.toLocaleString('fr-FR');

// Format compact pour le budget (ex: 1.2M Ar)
const formatCurrency = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M Ar';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'k Ar';
  }
  return num.toString() + ' Ar';
};

const getPercentage = (count: number = 0) => {
  if (stats.value.totalPoints === 0) return 0;
  return (count / stats.value.totalPoints) * 100;
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
  font-size: 17px;
}

ion-content {
  --background: #f8fafc;
}

.content-container {
  padding: 16px 20px 40px;
  max-width: 600px;
  margin: 0 auto;
}

.close-button {
  --color: #64748b;
  --background: #f1f5f9;
  --border-radius: 50%;
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

/* --- Header --- */
.page-header {
  margin-bottom: 24px;
  margin-top: 8px;
}

.page-header h1 {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

/* --- Layout Grid --- */
.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* --- Cards Common --- */
.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

/* --- Main Card (Progress) --- */
.main-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.trend-icon {
  color: #3b82f6;
  font-size: 20px;
}

.main-metric {
  font-size: 42px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 16px;
  font-variant-numeric: tabular-nums;
}

.main-metric .percent {
  font-size: 24px;
  color: #94a3b8;
  font-weight: 600;
  margin-left: 4px;
}

.progress-track {
  height: 12px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 6px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-footer-text {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* --- KPI Grid (Budget/Surface) --- */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.kpi-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  border: 1px solid #f1f5f9;
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.icon-box.blue {
  background: #eff6ff;
  color: #3b82f6;
}

.icon-box.green {
  background: #f0fdf4;
  color: #22c55e;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.kpi-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value small {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}

/* --- List Card (Status) --- */
.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 8px 0 0 4px;
}

.list-card {
  padding: 0;
  overflow: hidden;
}

.status-row {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  gap: 16px;
}

.status-indicator {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.status-indicator.warning {
  background: #fff7ed;
  color: #f97316;
}

.status-indicator.info {
  background: #eff6ff;
  color: #3b82f6;
}

.status-indicator.success {
  background: #f0fdf4;
  color: #22c55e;
}

.status-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-name {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.mini-bar-bg {
  height: 6px;
  width: 100%;
  background: #f1f5f9;
  border-radius: 3px;
}

.mini-bar-fill {
  height: 100%;
  border-radius: 3px;
}

.mini-bar-fill.warning {
  background: #fb923c;
}

.mini-bar-fill.info {
  background: #60a5fa;
}

.mini-bar-fill.success {
  background: #4ade80;
}

.status-count {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  min-width: 24px;
  text-align: right;
}

.divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0 20px;
}

/* --- Details Grid --- */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-tile {
  background: #ffffff;
  padding: 16px;
  border-radius: 16px;
  text-align: center;
  border: 1px solid #f1f5f9;
}

.detail-tile.highlight {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.tile-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.tile-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

/* --- Loading --- */
.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px;
}

@media (max-width: 380px) {
  .main-metric {
    font-size: 36px;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>