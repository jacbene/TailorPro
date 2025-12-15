// sw.js - Service Worker pour TailorPro avec Collections Métier - Version Améliorée
const CACHE_NAME = 'tailorpro-cache-v5';
const DATA_CACHE_NAME = 'tailorpro-data-v3';
const RUNTIME_CACHE = 'tailorpro-runtime-v2';

// Configuration des caches
const CACHE_CONFIG = {
  static: {
    name: CACHE_NAME,
    maxEntries: 100,
    maxAgeSeconds: 24 * 60 * 60 // 24 heures
  },
  data: {
    name: DATA_CACHE_NAME,
    maxEntries: 200,
    maxAgeSeconds: 2 * 60 * 60 // 2 heures pour les données
  },
  runtime: {
    name: RUNTIME_CACHE,
    maxEntries: 50,
    maxAgeSeconds: 60 * 60 // 1 heure
  }
};

// Ressources critiques - Cache lors de l'installation
const CRITICAL_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/responsive.css',
  '/manifest.json',
  
  // === ARCHITECTURE AVEC COLLECTIONS MÉTIER ===
  
  // COUCHE 1: Services de base
  '/js/firebase.js',                    // 1. Services Firebase (fondation)
  
  // COUCHE 2: Collections Métier
  '/js/collections/BaseCollection.js',  // 2. Classe de base des collections
  '/js/collections/ClientCollection.js', // 3. Collection Clients
  '/js/collections/CreationCollection.js', // 4. Collection Créations
  '/js/collections/OrderCollection.js', // 5. Collection Commandes
  
  // COUCHE 3: Authentification
  '/js/auth.js',                        // 6. Gestionnaire d'authentification
  '/js/mfa.js',                         // 7. MFA (dépend de auth)
  
  // COUCHE 4: Interface utilisateur
  '/js/render.js',                      // 8. Rendu (dépend des collections)
  '/js/modals.js',                      // 9. Modales (dépend de render)
  
  // COUCHE 5: Fonctionnalités PWA
  '/js/pwa.js',                         // 10. Fonctionnalités PWA
  
  // COUCHE 6: Application principale
  '/js/app.js',                         // 11. App principale
  
  // COUCHE 7: Initialisateur (DERNIER)
  '/js/init.js',                        // 12. Coordinateur final
  
  // Icônes et assets
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-icon-180x180.png',
  '/icons/android-icon-192x192.png',
  '/icons/favicon.ico'
];

// Patterns pour le cache dynamique
const DYNAMIC_PATTERNS = {
  images: /\.(png|jpg|jpeg|svg|webp|gif)$/,
  data: /\/(clients|creations|orders)\//,
  api: /\/api\//
};

// Domaines autorisés pour le cache
const ALLOWED_ORIGINS = [
  self.location.origin,
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com'
];

// Version du Service Worker
const SW_VERSION = '2.0.0';

console.log(`🚀 Service Worker TailorPro v${SW_VERSION} - Chargement avec Collections Métier`);

// Installation améliorée avec cache progressif
self.addEventListener('install', (event) => {
  console.log('⚙️ Service Worker: Installation avancée avec Collections Métier');
  console.log('📦 Fichiers critiques à cacher:', CRITICAL_URLS.length);
  
  event.waitUntil(
    (async () => {
      try {
        // Ouvrir le cache critique
        const cache = await caches.open(CACHE_CONFIG.static.name);
        
        // Cache progressif avec priorité
        const criticalUrls = CRITICAL_URLS.slice(0, 8); // Fichiers les plus critiques
        const secondaryUrls = CRITICAL_URLS.slice(8); // Fichiers secondaires
        
        // Cache des fichiers critiques d'abord
        console.log('📥 Cache des fichiers critiques...');
        await cacheCriticalResources(cache, criticalUrls);
        
        // Cache des fichiers secondaires ensuite
        console.log('📥 Cache des fichiers secondaires...');
        await cacheSecondaryResources(cache, secondaryUrls);
        
        console.log('✅ Service Worker: Installation terminée avec succès');
        
        // Activer immédiatement
        await self.skipWaiting();
        
        // Notifier l'application
        await notifyClients({ type: 'SW_INSTALLED', version: SW_VERSION });
        
      } catch (error) {
        console.error('❌ Erreur critique lors de l\'installation:', error);
        throw error;
      }
    })()
  );
});

// Cache des ressources critiques avec gestion d'erreurs
async function cacheCriticalResources(cache, urls) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const url of urls) {
    try {
      await cache.add(url);
      results.success++;
      console.log(`✅ ${url}`);
    } catch (error) {
      results.failed++;
      results.errors.push({ url, error: error.message });
      console.warn(`⚠️ Impossible de cacher ${url}:`, error.message);
    }
  }
  
  console.log(`📊 Cache critique: ${results.success} succès, ${results.failed} échecs`);
  return results;
}

// Cache des ressources secondaires (non bloquant)
async function cacheSecondaryResources(cache, urls) {
  const promises = urls.map(async (url) => {
    try {
      await cache.add(url);
      return { status: 'success', url };
    } catch (error) {
      return { status: 'failed', url, error: error.message };
    }
  });
  
  const results = await Promise.allSettled(promises);
  const success = results.filter(r => r.value?.status === 'success').length;
  
  console.log(`📊 Cache secondaire: ${success} succès sur ${urls.length}`);
  return results;
}

// Activation améliorée avec nettoyage intelligent
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker: Activation avancée...');
  
  event.waitUntil(
    (async () => {
      try {
        // Nettoyer les anciens caches
        await cleanOldCaches();
        
        // Initialiser les caches de données
        await initDataCache();
        
        // Prendre le contrôle immédiat
        await self.clients.claim();
        
        console.log('✅ Service Worker activé et prêt');
        
        // Notifier les clients
        await notifyClients({ 
          type: 'SW_ACTIVATED', 
          version: SW_VERSION,
          features: ['collections', 'offline', 'sync']
        });
        
        // Démarrer les tâches de fond
        startBackgroundTasks();
        
      } catch (error) {
        console.error('❌ Erreur lors de l\'activation:', error);
      }
    })()
  );
});

// Nettoyage intelligent des anciens caches
async function cleanOldCaches() {
  const cacheKeys = await caches.keys();
  const currentCaches = Object.values(CACHE_CONFIG).map(config => config.name);
  
  const deletePromises = cacheKeys.map(async (cacheName) => {
    if (!currentCaches.includes(cacheName)) {
      console.log(`🗑️ Nettoyage cache: ${cacheName}`);
      await caches.delete(cacheName);
      
      // Supprimer également les caches de données obsolètes
      if (cacheName.startsWith('tailorpro-data-') && cacheName !== DATA_CACHE_NAME) {
        await caches.delete(cacheName);
      }
    }
  });
  
  await Promise.all(deletePromises);
  console.log('🧹 Nettoyage des caches terminé');
}

// Initialiser le cache de données
async function initDataCache() {
  try {
    const cache = await caches.open(CACHE_CONFIG.data.name);
    console.log('💾 Cache de données initialisé');
    return cache;
  } catch (error) {
    console.error('❌ Erreur initialisation cache données:', error);
  }
}

// Stratégies de cache avancées
const CACHE_STRATEGIES = {
  // Pour les ressources critiques - Cache First
  CRITICAL: async (request) => {
    const cache = await caches.open(CACHE_CONFIG.static.name);
    const cached = await cache.match(request);
    
    if (cached) {
      // Mettre à jour le cache en arrière-plan
      updateCacheInBackground(request, cache);
      return cached;
    }
    
    // Récupérer depuis le réseau
    try {
      const response = await fetch(request);
      if (response.status === 200) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      // Fallback générique pour les pages
      if (request.destination === 'document') {
        return cache.match('/index.html');
      }
      throw error;
    }
  },
  
  // Pour les données - Network First avec fallback
  DATA: async (request) => {
    const cache = await caches.open(CACHE_CONFIG.data.name);
    
    try {
      // Essayer le réseau d'abord
      const response = await fetch(request);
      
      // Mettre en cache si succès
      if (response.status === 200) {
        await cache.put(request, response.clone());
        
        // Notifier de la mise à jour
        notifyClients({
          type: 'DATA_UPDATED',
          url: request.url,
          timestamp: Date.now()
        });
      }
      
      return response;
    } catch (error) {
      // Retourner depuis le cache si hors ligne
      const cached = await cache.match(request);
      if (cached) {
        console.log('📴 Retour depuis cache (hors ligne):', request.url);
        return cached;
      }
      
      // Données non disponibles
      throw new Error(`Données non disponibles: ${request.url}`);
    }
  },
  
  // Pour les images - Cache First avec validation
  IMAGE: async (request) => {
    const cache = await caches.open(CACHE_CONFIG.static.name);
    const cached = await cache.match(request);
    
    if (cached) {
      // Vérifier si l'image est encore fraîche
      if (isCacheFresh(cached)) {
        return cached;
      }
    }
    
    // Récupérer la nouvelle version
    try {
      const response = await fetch(request);
      if (response.status === 200) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      // Retourner l'ancienne version si disponible
      if (cached) {
        return cached;
      }
      throw error;
    }
  },
  
  // Pour les API - Network Only avec cache de secours
  API: async (request) => {
    const cache = await caches.open(CACHE_CONFIG.runtime.name);
    
    try {
      const response = await fetch(request);
      
      // Cache des réponses API réussies
      if (response.status === 200) {
        await cache.put(request, response.clone());
      }
      
      return response;
    } catch (error) {
      // Fallback au cache pour les API
      const cached = await cache.match(request);
      if (cached) {
        console.log('📴 API depuis cache:', request.url);
        return cached;
      }
      throw error;
    }
  }
};

// Interception des requêtes avancée
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET et les origines non autorisées
  if (!shouldHandleRequest(request)) {
    return;
  }
  
  // Sélectionner la stratégie en fonction du type de requête
  const strategy = getCacheStrategy(request, url);
  
  if (strategy) {
    event.respondWith(
      (async () => {
        try {
          return await strategy(request);
        } catch (error) {
          console.error('❌ Erreur stratégie cache:', error);
          return handleFetchError(request, error);
        }
      })()
    );
  }
});

// Déterminer si une requête doit être gérée
function shouldHandleRequest(request) {
  const url = new URL(request.url);
  
  // Ignorer les méthodes non-GET
  if (request.method !== 'GET') return false;
  
  // Ignorer les requêtes chrome-extension
  if (url.protocol === 'chrome-extension:') return false;
  
  // Vérifier l'origine
  if (!ALLOWED_ORIGINS.some(origin => url.origin === origin)) {
    return false;
  }
  
  return true;
}

// Obtenir la stratégie de cache appropriée
function getCacheStrategy(request, url) {
  // Données des collections
  if (DYNAMIC_PATTERNS.data.test(url.pathname)) {
    return CACHE_STRATEGIES.DATA;
  }
  
  // API calls
  if (DYNAMIC_PATTERNS.api.test(url.pathname)) {
    return CACHE_STRATEGIES.API;
  }
  
  // Images
  if (DYNAMIC_PATTERNS.images.test(url.pathname)) {
    return CACHE_STRATEGIES.IMAGE;
  }
  
  // Ressources critiques
  if (CRITICAL_URLS.some(criticalUrl => url.pathname === criticalUrl)) {
    return CACHE_STRATEGIES.CRITICAL;
  }
  
  // Par défaut: stratégie cache first
  return CACHE_STRATEGIES.CRITICAL;
}

// Gestion avancée des erreurs
async function handleFetchError(request, error) {
  console.warn('⚠️ Erreur de récupération:', request.url, error);
  
  // Essayer de retourner une réponse de fallback
  const fallbackResponse = await getFallbackResponse(request);
  if (fallbackResponse) {
    return fallbackResponse;
  }
  
  // Fallback générique
  return new Response(
    JSON.stringify({ 
      error: 'Ressource non disponible hors ligne',
      url: request.url,
      timestamp: Date.now()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Obtenir une réponse de fallback
async function getFallbackResponse(request) {
  const cache = await caches.open(CACHE_CONFIG.static.name);
  
  // Fallback pour les pages
  if (request.destination === 'document') {
    const fallback = await cache.match('/index.html');
    if (fallback) return fallback;
  }
  
  // Fallback pour les images
  if (request.destination === 'image') {
    const fallback = await cache.match('/icons/icon.svg');
    if (fallback) return fallback;
  }
  
  return null;
}

// Vérifier si le cache est frais
function isCacheFresh(cachedResponse) {
  const dateHeader = cachedResponse.headers.get('date');
  if (!dateHeader) return true;
  
  const cacheTime = new Date(dateHeader).getTime();
  const now = Date.now();
  const age = now - cacheTime;
  
  // Considérer frais si moins de 1 heure
  return age < (60 * 60 * 1000);
}

// Mettre à jour le cache en arrière-plan
async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      await cache.put(request, response);
      console.log('🔄 Cache mis à jour en arrière-plan:', request.url);
    }
  } catch (error) {
    // Échec silencieux - le cache existant reste valide
  }
}

// Gestion des messages avancée
self.addEventListener('message', (event) => {
  const { data, ports } = event;
  
  console.log('📨 Message reçu:', data.type);
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      notifyClient(ports[0], {
        version: SW_VERSION,
        cache: CACHE_NAME,
        features: Object.keys(CACHE_STRATEGIES)
      });
      break;
      
    case 'CACHE_CLEANUP':
      event.waitUntil(cleanupCache(data.pattern));
      break;
      
    case 'PRELOAD_RESOURCES':
      event.waitUntil(preloadResources(data.urls));
      break;
      
    case 'SYNC_DATA':
      event.waitUntil(syncBackgroundData(data.collections));
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(sendCacheStatus(ports[0]));
      break;
      
    case 'OPTIMIZE_CACHE':
      event.waitUntil(optimizeCacheStorage());
      break;
  }
});

// Synchronisation des données en arrière-plan
async function syncBackgroundData(collections = ['clients', 'creations', 'orders']) {
  console.log('🔄 Synchronisation des données en arrière-plan:', collections);
  
  try {
    const results = {};
    
    for (const collection of collections) {
      try {
        // Simuler la synchronisation (à remplacer par l'implémentation réelle)
        await new Promise(resolve => setTimeout(resolve, 1000));
        results[collection] = { status: 'success', syncedAt: Date.now() };
        console.log(`✅ ${collection} synchronisée`);
      } catch (error) {
        results[collection] = { status: 'error', error: error.message };
        console.error(`❌ Erreur synchro ${collection}:`, error);
      }
    }
    
    // Notifier les clients
    await notifyClients({
      type: 'SYNC_COMPLETED',
      results,
      timestamp: Date.now()
    });
    
    return results;
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    
    await notifyClients({
      type: 'SYNC_FAILED',
      error: error.message,
      timestamp: Date.now()
    });
    
    throw error;
  }
}

// Nettoyage du cache par pattern
async function cleanupCache(pattern) {
  const cache = await caches.open(CACHE_CONFIG.data.name);
  const keys = await cache.keys();
  
  const deletePromises = keys
    .filter(request => request.url.includes(pattern))
    .map(request => cache.delete(request));
  
  const results = await Promise.allSettled(deletePromises);
  const deleted = results.filter(r => r.status === 'fulfilled').length;
  
  console.log(`🗑️ Nettoyage cache: ${deleted} éléments supprimés pour ${pattern}`);
  return deleted;
}

// Préchargement de ressources
async function preloadResources(urls) {
  const cache = await caches.open(CACHE_CONFIG.static.name);
  const results = [];
  
  for (const url of urls) {
    try {
      await cache.add(url);
      results.push({ url, status: 'success' });
      console.log(`📥 Préchargé: ${url}`);
    } catch (error) {
      results.push({ url, status: 'error', error: error.message });
      console.warn(`⚠️ Échec préchargement ${url}:`, error);
    }
  }
  
  return results;
}

// Optimiser le stockage du cache
async function optimizeCacheStorage() {
  console.log('⚡ Optimisation du stockage cache...');
  
  try {
    const cache = await caches.open(CACHE_CONFIG.static.name);
    const requests = await cache.keys();
    
    // Trier par date (les plus anciens d'abord)
    const sortedRequests = await Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        const date = response.headers.get('date');
        return {
          request,
          timestamp: date ? new Date(date).getTime() : 0
        };
      })
    );
    
    sortedRequests.sort((a, b) => a.timestamp - b.timestamp);
    
    // Supprimer les 20% les plus anciens si nécessaire
    const maxEntries = CACHE_CONFIG.static.maxEntries;
    if (sortedRequests.length > maxEntries) {
      const toDelete = sortedRequests.slice(0, Math.floor(sortedRequests.length * 0.2));
      
      for (const item of toDelete) {
        await cache.delete(item.request);
      }
      
      console.log(`🗑️ Optimisation: ${toDelete.length} anciens éléments supprimés`);
    }
    
    await notifyClients({
      type: 'CACHE_OPTIMIZED',
      remaining: sortedRequests.length - (toDelete?.length || 0),
      deleted: toDelete?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Erreur optimisation cache:', error);
  }
}

// Envoyer le statut du cache
async function sendCacheStatus(port) {
  const cacheStatus = {};
  
  for (const [type, config] of Object.entries(CACHE_CONFIG)) {
    try {
      const cache = await caches.open(config.name);
      const keys = await cache.keys();
      cacheStatus[type] = {
        name: config.name,
        size: keys.length,
        maxEntries: config.maxEntries
      };
    } catch (error) {
      cacheStatus[type] = { error: error.message };
    }
  }
  
  notifyClient(port, {
    type: 'CACHE_STATUS',
    status: cacheStatus,
    version: SW_VERSION
  });
}

// Notifier tous les clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  
  const promises = clients.map(client => {
    return client.postMessage(message);
  });
  
  await Promise.allSettled(promises);
}

// Notifier un client spécifique
function notifyClient(port, message) {
  if (port && port.postMessage) {
    port.postMessage(message);
  }
}

// Démarrer les tâches de fond
function startBackgroundTasks() {
  // Nettoyage périodique du cache
  setInterval(async () => {
    await optimizeCacheStorage();
  }, 30 * 60 * 1000); // Toutes les 30 minutes
  
  // Vérification des mises à jour
  setInterval(async () => {
    await checkForUpdates();
  }, 2 * 60 * 60 * 1000); // Toutes les 2 heures
  
  console.log('🔄 Tâches de fond démarrées');
}

// Vérifier les mises à jour
async function checkForUpdates() {
  try {
    const cache = await caches.open(CACHE_CONFIG.static.name);
    
    for (const url of CRITICAL_URLS.slice(0, 5)) { // Vérifier seulement les 5 plus critiques
      try {
        const networkResponse = await fetch(url, { cache: 'reload' });
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse) {
          const cachedETag = cachedResponse.headers.get('etag');
          const networkETag = networkResponse.headers.get('etag');
          
          if (networkETag && cachedETag !== networkETag) {
            console.log(`🔄 Mise à jour disponible: ${url}`);
            await cache.put(url, networkResponse.clone());
            
            await notifyClients({
              type: 'ASSET_UPDATED',
              url,
              timestamp: Date.now()
            });
          }
        }
      } catch (error) {
        // Ignorer les erreurs pour les vérifications de mise à jour
      }
    }
  } catch (error) {
    console.error('❌ Erreur vérification mises à jour:', error);
  }
}

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('🔄 Événement de synchronisation:', event.tag);
  
  switch (event.tag) {
    case 'background-sync':
      event.waitUntil(syncBackgroundData());
      break;
      
    case 'cache-cleanup':
      event.waitUntil(optimizeCacheStorage());
      break;
      
    default:
      console.log('🏷️ Tag de sync non géré:', event.tag);
  }
}

// Gestion des push notifications (pour future implémentation)
self.addEventListener('push', (event) => {
  console.log('📲 Événement push reçu');
  
  const options = {
    body: 'Nouvelle mise à jour disponible pour vos collections',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('TailorPro Collections', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

console.log(`✅ Service Worker TailorPro v${SW_VERSION} initialisé - Prêt pour les Collections Métier`);