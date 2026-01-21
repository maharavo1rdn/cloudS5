import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import LoginPage from "../pages/LoginPage.vue";
import HomePage from "../pages/HomePage.vue";
import authService from "../services/authService";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Login",
    component: LoginPage,
    meta: { requiresGuest: true },
  },
  {
    path: "/home",
    name: "Home",
    component: HomePage,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

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
