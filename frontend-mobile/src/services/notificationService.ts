import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Notification {
  id: string;
  userId: string;
  routeId: string;
  routeName: string;
  type: 'status_change' | 'new_comment' | 'update';
  title: string;
  body: string;
  oldStatus?: string;
  newStatus?: string;
  createdAt: Date;
  read: boolean;
}

class NotificationService {
  private notifications: Notification[] = [];
  private lastCheckDate: Date | null = null;
  private unsubscribePoints: (() => void) | null = null;
  private unsubscribeNotifications: (() => void) | null = null;
  private isPermissionGranted = false;
  private currentUserId: string | null = null;
  private pointsStatusCache = new Map<string, string>(); // Cache des statuts pour détecter les changements
  private isFirstSnapshot = true; // Pour distinguer le premier chargement des vrais ajouts
  private processedChanges = new Set<string>(); // Changements déjà traités (avec timestamp)
  private isInitialized = false; // Éviter les doubles initialisations

  /**
   * Initialise le service de notifications
   * Demande la permission, synchronise Firestore et cache local
   */
  async initialize(userId: string) {
    // Éviter les doubles initialisations
    if (this.isInitialized && this.currentUserId === userId) {
      console.log('⚠️ Service déjà initialisé pour cet utilisateur, skip');
      return;
    }

    // Nettoyer l'ancienne session si différent user
    if (this.currentUserId && this.currentUserId !== userId) {
      this.cleanup();
    }

    console.log('🔔 Initialisation du service de notifications pour user:', userId);
    this.currentUserId = userId;
    this.isInitialized = true;
    
    // NOTE: La permission sera demandée lors du premier clic utilisateur
    // pour respecter les règles du navigateur
    
    // Charger la dernière date de consultation
    await this.loadLastCheckDate();
    
    // Synchroniser avec Firestore (source de vérité)
    await this.syncWithFirestore(userId);
    
    // Écouter les nouvelles notifications Firestore en temps réel
    this.listenToFirestoreNotifications(userId);
    
    // Écouter les changements de statut pour créer de nouvelles notifications
    this.listenToPointsChanges(userId);
  }

  /**
   * Demande la permission pour les notifications système
   * Doit être appelée depuis un gestionnaire d'événement utilisateur
   */
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.requestPermissions();
      this.isPermissionGranted = permission.display === 'granted';
      
      if (this.isPermissionGranted) {
        console.log('✅ Permission notifications système accordée');
      } else {
        console.warn('⚠️ Permission notifications système refusée');
      }
      
      return this.isPermissionGranted;
    } catch (error) {
      console.error('❌ Erreur demande permission:', error);
      return false;
    }
  }

  /**
   * Charge la dernière date de vérification depuis les préférences
   */
  private async loadLastCheckDate() {
    try {
      const { value } = await Preferences.get({ key: 'last_notification_check' });
      if (value) {
        this.lastCheckDate = new Date(value);
        console.log('📅 Dernière vérification:', this.lastCheckDate);
      } else {
        // Première connexion, utiliser maintenant
        this.lastCheckDate = new Date();
        await this.saveLastCheckDate();
      }
    } catch (error) {
      console.error('❌ Erreur chargement dernière date:', error);
      this.lastCheckDate = new Date();
    }
  }

  /**
   * Sauvegarde la date de vérification actuelle
   */
  private async saveLastCheckDate() {
    try {
      await Preferences.set({
        key: 'last_notification_check',
        value: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erreur sauvegarde date:', error);
    }
  }

  /**
   * Charge les notifications stockées localement (cache)
   */
  private async loadStoredNotifications() {
    try {
      const { value } = await Preferences.get({ key: 'notifications' });
      if (value) {
        const stored = JSON.parse(value);
        this.notifications = stored.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
        console.log('📥 Notifications chargées du cache:', this.notifications.length);
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
      this.notifications = [];
    }
  }

  /**
   * Sauvegarde les notifications localement (cache)
   */
  private async saveNotifications() {
    try {
      await Preferences.set({
        key: 'notifications',
        value: JSON.stringify(this.notifications)
      });
    } catch (error) {
      console.error('❌ Erreur sauvegarde notifications:', error);
    }
  }

  /**
   * Synchronise avec Firestore (charge les notifications existantes)
   */
  private async syncWithFirestore(userId: string) {
    try {
      console.log('🔄 Synchronisation avec Firestore...');
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const firestoreNotifications: Notification[] = [];
      
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        firestoreNotifications.push({
          id: docSnapshot.id,
          userId: data.userId,
          routeId: data.routeId,
          routeName: data.routeName,
          type: data.type,
          title: data.title,
          body: data.body,
          oldStatus: data.oldStatus,
          newStatus: data.newStatus,
          createdAt: data.createdAt?.toDate() || new Date(),
          read: data.read || false
        });
      });
      
      // Charger le cache local
      await this.loadStoredNotifications();
      
      // Merger: Firestore est la source de vérité
      this.notifications = firestoreNotifications;
      
      // Sauvegarder en cache local
      await this.saveNotifications();
      
      console.log(`✅ Synchronisation terminée: ${this.notifications.length} notifications`);
    } catch (error) {
      console.error('❌ Erreur synchronisation Firestore:', error);
      // Fallback sur cache local
      await this.loadStoredNotifications();
    }
  }

  /**
   * Écoute les nouvelles notifications Firestore en temps réel
   */
  private listenToFirestoreNotifications(userId: string) {
    if (this.unsubscribeNotifications) {
      this.unsubscribeNotifications();
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    this.unsubscribeNotifications = onSnapshot(q, 
      (snapshot) => {
        console.log('🔔 Snapshot notifications reçu:', snapshot.docs.length, 'docs');
        
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          const notification: Notification = {
            id: change.doc.id,
            userId: data.userId,
            routeId: data.routeId,
            routeName: data.routeName,
            type: data.type,
            title: data.title,
            body: data.body,
            oldStatus: data.oldStatus,
            newStatus: data.newStatus,
            createdAt: data.createdAt?.toDate() || new Date(),
            read: data.read || false
          };

          console.log('🔄 Change détecté:', change.type, notification.id);

          if (change.type === 'added') {
            // Vérifier si pas déjà dans le cache
            const exists = this.notifications.some(n => n.id === notification.id);
            if (!exists) {
              this.notifications.unshift(notification);
              this.saveNotifications();
              // Envoyer notification push native
              this.sendSystemNotification(notification);
              console.log('📥 Nouvelle notification ajoutée:', notification.title);
            } else {
              console.log('⏭️ Notification déjà existante (skip):', notification.id);
            }
          } else if (change.type === 'modified') {
            const index = this.notifications.findIndex(n => n.id === notification.id);
            if (index !== -1) {
              this.notifications[index] = notification;
              this.saveNotifications();
              console.log('✏️ Notification modifiée:', notification.id);
            }
          } else if (change.type === 'removed') {
            this.notifications = this.notifications.filter(n => n.id !== notification.id);
            this.saveNotifications();
            console.log('🗑️ Notification supprimée:', notification.id);
          }
        });
      },
      (error) => {
        console.error('❌ Erreur listener notifications:', error);
      }
    );
    
    console.log('👂 Listener notifications activé pour user:', userId);
  }

  /**
   * Écoute les changements de statut des points pour créer de nouvelles notifications
   */
  private listenToPointsChanges(userId: string) {
    if (this.unsubscribePoints) {
      this.unsubscribePoints();
    }

    const pointsRef = collection(db, 'points');
    const q = query(pointsRef, where('created_by', '==', userId));

    this.unsubscribePoints = onSnapshot(q, (snapshot) => {
      // Au PREMIER snapshot, initialiser le cache avec tous les points existants
      if (this.isFirstSnapshot) {
        console.log('🔄 Premier snapshot - Initialisation du cache avec les points existants');
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          this.pointsStatusCache.set(doc.id, data.point_statut);
          console.log(`💾 Cache initialisé: ${doc.id} → ${data.point_statut}`);
        });
        this.isFirstSnapshot = false;
        return; // Ne pas traiter les changements au premier snapshot
      }

      // Après le premier snapshot, traiter uniquement les vrais changements
      snapshot.docChanges().forEach((change) => {
        const pointId = change.doc.id;
        const newData = change.doc.data();
        const newStatus = newData.point_statut;
        
        if (change.type === 'added') {
          // Vrai nouveau point créé (après le premier snapshot)
          this.pointsStatusCache.set(pointId, newStatus);
          console.log(`➕ Nouveau point ajouté: ${pointId} → ${newStatus}`);
        } else if (change.type === 'modified') {
          const oldStatus = this.pointsStatusCache.get(pointId);
          
          console.log(`🔄 Point ${pointId} modifié - Ancien: ${oldStatus}, Nouveau: ${newStatus}`);
          
          // Vérifier si le statut a RÉELLEMENT changé
          if (oldStatus && oldStatus !== newStatus) {
            console.log(`✨ CHANGEMENT DE STATUT détecté pour ${pointId}: ${oldStatus} → ${newStatus}`);
            this.createNotificationForStatusChange(pointId, newData, oldStatus, newStatus, userId);
            // Mettre à jour le cache
            this.pointsStatusCache.set(pointId, newStatus);
          } else if (!oldStatus) {
            console.log(`⚠️ Pas de statut en cache pour ${pointId}, initialisation`);
            this.pointsStatusCache.set(pointId, newStatus);
          } else {
            console.log(`⏭️ Statut inchangé pour ${pointId}: ${newStatus}`);
          }
        } else if (change.type === 'removed') {
          // Point supprimé, retirer du cache
          this.pointsStatusCache.delete(pointId);
          console.log(`🗑️ Point supprimé du cache: ${pointId}`);
        }
      });
    });
    
    console.log('👂 Listener points activé pour user:', userId);
  }

  /**
   * Crée une notification pour un changement de statut dans Firestore
   * PROTECTION TRIPLE contre les doublons
   */
  private async createNotificationForStatusChange(
    pointId: string, 
    pointData: any, 
    oldStatus: string, 
    newStatus: string, 
    userId: string
  ) {
    // Clé unique pour ce changement spécifique (avec timestamp pour le même changement répété)
    const changeKey = `${pointId}_${oldStatus}_${newStatus}`;
    
    // VERROU 1: Vérifier si ce changement a déjà été traité récemment
    if (this.processedChanges.has(changeKey)) {
      console.log(`🔒 Changement déjà traité: ${changeKey}, skip`);
      return;
    }

    // Marquer immédiatement comme traité (AVANT toute opération async)
    this.processedChanges.add(changeKey);
    console.log(`🔐 Verrou acquis pour: ${changeKey}`);

    const statusMap: { [key: string]: string } = {
      'NOUVEAU': 'Nouveau',
      'A_FAIRE': 'À faire',
      'EN_COURS': 'En cours',
      'TERMINE': 'Terminé',
      'ANNULE': 'Annulé'
    };

    const oldLabel = statusMap[oldStatus] || oldStatus;
    const newLabel = statusMap[newStatus] || newStatus;
    const pointName = pointData.nom || 'Signalement';

    console.log(`📝 Tentative création notification: ${pointName}: ${oldLabel} → ${newLabel}`);

    // VERROU 2: Vérifier dans le cache local
    const existsInCache = this.notifications.some(n => 
      n.routeId === pointId && 
      n.newStatus === newStatus &&
      n.oldStatus === oldStatus
    );

    if (existsInCache) {
      console.log('⏭️ Notification déjà dans le cache local');
      return; // Le verrou reste pour éviter les retentatives
    }

    try {
      // VERROU 3: Vérifier dans Firestore
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('routeId', '==', pointId),
        where('oldStatus', '==', oldStatus),
        where('newStatus', '==', newStatus),
        limit(1)
      );
      
      const existingSnapshot = await getDocs(q);
      
      if (!existingSnapshot.empty) {
        console.log('⏭️ Notification déjà dans Firestore');
        return;
      }

      // Créer la notification dans Firestore
      const notificationData = {
        userId,
        routeId: pointId,
        routeName: pointName,
        type: 'status_change' as const,
        title: '🔄 Changement de statut',
        body: `"${pointName}" : ${oldLabel} → ${newLabel}`,
        oldStatus: oldStatus,
        newStatus: newStatus,
        createdAt: Timestamp.now(),
        read: false
      };

      const docRef = await addDoc(notificationsRef, notificationData);
      console.log('✅ Notification créée avec ID:', docRef.id);
      
    } catch (error) {
      console.error('❌ Erreur création notification:', error);
      // En cas d'erreur, libérer le verrou pour permettre une nouvelle tentative
      this.processedChanges.delete(changeKey);
    }
    // Note: On ne libère PAS le verrou en cas de succès pour éviter les doublons
  }

  /**
   * Envoie une notification système (push notification)
   */
  private async sendSystemNotification(notification: Notification) {
    if (!this.isPermissionGranted) {
      console.warn('⚠️ Pas de permission pour notifications système');
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title,
            body: notification.body,
            id: parseInt(notification.id.substring(0, 8), 16) || Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 1000) }, // 1 seconde de délai
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: {
              routeId: notification.routeId,
              type: notification.type,
              notificationId: notification.id
            }
          }
        ]
      });

      console.log('📱 Notification système envoyée:', notification.title);
    } catch (error) {
      console.error('❌ Erreur envoi notification système:', error);
    }
  }

  /**
   * Vérifie si la permission est accordée
   */
  hasPermission(): boolean {
    return this.isPermissionGranted;
  }

  /**
   * Récupère toutes les notifications
   */
  async getNotifications(): Promise<Notification[]> {
    return this.notifications;
  }

  /**
   * Récupère le nombre de notifications non lues
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Marque une notification comme lue (Firestore + cache local)
   */
  async markAsRead(notificationId: string) {
    try {
      // Mettre à jour dans Firestore
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });

      // Mettre à jour le cache local
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        await this.saveNotifications();
      }

      console.log('✅ Notification marquée comme lue:', notificationId);
    } catch (error) {
      console.error('❌ Erreur markAsRead:', error);
      // Fallback: au moins mettre à jour localement
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        await this.saveNotifications();
      }
    }
  }

  /**
   * Marque toutes les notifications comme lues (Firestore + cache local)
   */
  async markAllAsRead() {
    try {
      if (!this.currentUserId) return;

      // Mettre à jour toutes les notifications non lues dans Firestore
      const unreadNotifications = this.notifications.filter(n => !n.read);
      
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });

      await Promise.all(updatePromises);

      // Mettre à jour le cache local
      this.notifications.forEach(n => n.read = true);
      await this.saveNotifications();

      console.log(`✅ ${unreadNotifications.length} notifications marquées comme lues`);
    } catch (error) {
      console.error('❌ Erreur markAllAsRead:', error);
      // Fallback: au moins mettre à jour localement
      this.notifications.forEach(n => n.read = true);
      await this.saveNotifications();
    }
  }

  /**
   * Supprime une notification (Firestore + cache local)
   */
  async deleteNotification(notificationId: string) {
    try {
      // Supprimer de Firestore
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);

      // Supprimer du cache local
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      await this.saveNotifications();

      console.log('✅ Notification supprimée:', notificationId);
    } catch (error) {
      console.error('❌ Erreur deleteNotification:', error);
      // Fallback: au moins supprimer localement
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      await this.saveNotifications();
    }
  }

  /**
   * Supprime toutes les notifications (Firestore + cache local)
   * Charge TOUTES les notifications de Firestore pour les supprimer (pas seulement les 50 en cache)
   */
  async clearAll() {
    try {
      if (!this.currentUserId) {
        console.error('❌ Pas de userId pour clearAll');
        return;
      }

      console.log('🗑️ Suppression de TOUTES les notifications de Firestore...');

      // Requête pour charger TOUTES les notifications (sans limite)
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef, 
        where('userId', '==', this.currentUserId)
      );

      const snapshot = await getDocs(q);
      
      console.log(`📊 ${snapshot.size} notifications trouvées dans Firestore`);

      // Supprimer toutes les notifications de Firestore
      const deletePromises = snapshot.docs.map(docSnapshot => {
        return deleteDoc(doc(db, 'notifications', docSnapshot.id));
      });

      await Promise.all(deletePromises);

      // Vider le cache local
      this.notifications = [];
      await this.saveNotifications();

      console.log(`✅ ${snapshot.size} notifications supprimées de Firestore et du cache`);
    } catch (error) {
      console.error('❌ Erreur clearAll:', error);
      // Fallback: au moins vider localement
      this.notifications = [];
      await this.saveNotifications();
    }
  }

  /**
   * Met à jour la date de dernière consultation (à appeler lors de la consultation)
   */
  async updateLastCheckDate() {
    this.lastCheckDate = new Date();
    await this.saveLastCheckDate();
  }

  /**
   * Vérifie les changements depuis la dernière connexion
   * À appeler manuellement pour forcer une vérification
   */
  async checkForChanges(userId: string) {
    console.log('🔍 Vérification des changements depuis:', this.lastCheckDate);
    
    try {
      const pointsRef = collection(db, 'points');
      const q = query(pointsRef, where('created_by', '==', userId));
      const snapshot = await getDocs(q);

      let newNotifications = 0;

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const pointId = docSnapshot.id;
        const currentStatus = data.point_statut;
        
        // Vérifier si on a le statut en cache
        const cachedStatus = this.pointsStatusCache.get(pointId);
        
        // Si changement détecté
        if (cachedStatus && cachedStatus !== currentStatus) {
          console.log(`🔍 Changement détecté dans checkForChanges: ${pointId}`);
          // Le listener temps réel devrait le capturer
          newNotifications++;
        }
      });

      console.log(`✅ Vérification terminée: ${newNotifications} nouvelles notifications`);
      return newNotifications;
    } catch (error) {
      console.error('❌ Erreur vérification changements:', error);
      return 0;
    }
  }

  /**
   * Nettoie le service (à appeler lors du logout)
   */
  cleanup() {
    if (this.unsubscribePoints) {
      this.unsubscribePoints();
      this.unsubscribePoints = null;
    }
    if (this.unsubscribeNotifications) {
      this.unsubscribeNotifications();
      this.unsubscribeNotifications = null;
    }
    this.pointsStatusCache.clear();
    this.processedChanges.clear();
    this.isFirstSnapshot = true;
    this.isInitialized = false;
    this.currentUserId = null;
    console.log('🧹 Service notifications nettoyé');
  }
}

export const notificationService = new NotificationService();
