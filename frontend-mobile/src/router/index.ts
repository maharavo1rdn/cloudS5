<<<<<<< HEAD
import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import LoginPage from "../pages/LoginPage.vue";
import HomePage from "../pages/HomePage.vue";
import authService from "../services/authService";
=======
// src/router/index.ts
import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

// Pages (ajuste les chemins selon ton arborescence réelle)
import LoginPage from '@/pages/LoginPage.vue';           // ou '../pages/LoginPage.vue'
import Tabs from '@/pages/Tabs.vue';

// Lazy loading pour les autres pages (recommandé)
const HomePage    = () => import('@/pages/AccueilPage.vue');
const ProfilePage = () => import('@/pages/ProfilePage.vue');
const SettingsPage = () => import('@/pages/SettingsPage.vue');
>>>>>>> ando/mobile/1

const routes: Array<RouteRecordRaw> = [
  // Page de login → point d'entrée
  {
    path: '/',
    name: 'Login',
    component: LoginPage,
    meta: { requiresGuest: true },
  },
  {
    path: "/home",
    name: "Home",
    component: HomePage,
    meta: { requiresAuth: true },
  },

  // Layout avec tabs (après login)
  {
    path: '/tabs',
    component: Tabs,
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        name: 'Home',
        component: HomePage,
      },
      {
        path: 'profile',
        name: 'Profile',
        component: ProfilePage,
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsPage,
      },
    ],
    // meta: { requiresAuth: true }   ← à activer plus tard avec guard
  },

  // Catch-all : redirige vers login si route inconnue
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

<<<<<<< HEAD
// Navigation guards
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = await authService.isAuthenticated();

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Rediriger vers login si authentification requise
    next('/');
  } else if (to.meta.requiresGuest && isAuthenticated) {
    // Rediriger vers home si déjà connecté
    next('/home');
  } else {
    next();
  }
});

export default router;
=======
// Guard simple (optionnel pour l'instant – à décommenter quand tu auras l'auth réelle)
// router.beforeEach((to, from, next) => {
//   const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'; // ou utilise Pinia / ton store

//   if (to.meta.requiresAuth && !isLoggedIn) {
//     next('/');
//   } else if (to.path === '/' && isLoggedIn) {
//     next('/home');
//   } else {
//     next();
//   }
// });

export default router;
>>>>>>> ando/mobile/1
