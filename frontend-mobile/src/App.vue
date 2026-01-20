<template>
  <div class="phone-frame">
    <ion-app>
      <ion-router-outlet />
    </ion-app>
  </div>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
</script>

<style>
/* Cadre de téléphone centré sur l'écran */
.phone-frame {
  width: 390px;
  height: 844px;
  max-height: 100vh;
  margin: 0 auto;
  background: #000;
  border-radius: 40px;
  padding: 12px;
  box-shadow: 
    0 0 0 3px #1a1a1a,
    0 0 0 6px #333,
    0 25px 50px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.phone-frame ion-app {
  border-radius: 30px;
  overflow: hidden;
}

/* Encoche du téléphone */
.phone-frame::before {
  content: '';
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 30px;
  background: #000;
  border-radius: 0 0 20px 20px;
  z-index: 9999;
}

/* Sur mobile réel, pas de cadre */
@media (max-width: 500px) {
  .phone-frame {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
  }
  
  .phone-frame ion-app {
    border-radius: 0;
  }
  
  .phone-frame::before {
    display: none;
  }
}

/* Fond de la page derrière le téléphone */
body {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
