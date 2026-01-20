<template>
  <ion-tabs>
    <ion-router-outlet></ion-router-outlet>
    <ion-tab-bar slot="bottom">
      <ion-tab-button tab="home" href="/tabs/home">
        <ion-icon :icon="home" />
        <ion-label>Accueil</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="profile" href="/tabs/profile">
        <ion-icon :icon="person" />
        <ion-label>Profil</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="settings" href="/tabs/settings">
        <ion-icon :icon="settings" />
        <ion-label>Paramètres</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
  </ion-tabs>
</template>

<script setup>
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet
} from '@ionic/vue';
import { home, person, settings } from 'ionicons/icons';
</script>