// pwa.js - Gestion de la Progressive Web App avec Collections Métier - Version Améliorée
let deferredPrompt = null;
let installPromptDismissed = false;
let isOnline = navigator.onLine;
let syncInProgress = false;
let retryCount = 0;
const MAX_RETRIES = 3;

function setupPWA() {
    console.log('🔄 Configuration PWA avec Collections Métier...');
    
    // Initialiser les écouteurs d'événements
    setupEventListeners();
    
    // Vérifier l'état des données locales
    checkLocalDataState();
    
    // Enregistrer le Service Worker
    registerServiceWorker();
    
    // Configurer la gestion des données hors ligne
    setupOfflineDataManagement();
    
    // Initialiser les indicateurs d'état
    updateConnectionStatus();
    updateStorageIndicator();
    
    console.log('✅ PWA configurée avec succès');
}

// Configuration centralisée des écouteurs d'événements
function setupEventListeners() {
    // Événement pour l'installation PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('📱 Événement beforeinstallprompt déclenché');
        e.preventDefault();
        deferredPrompt = e;
        
        if (!installPromptDismissed && shouldShowInstallPrompt()) {
            console.log('💡 Affichage du prompt d\'installation dans 3 secondes');
            setTimeout(() => {
                showInstallPrompt();
            }, 3000);
        }
    });
    
    // Événement lorsque l'app est installée
    window.addEventListener('appinstalled', () => {
        console.log('✅ Application installée avec succès');
        handleAppInstalled();
    });
    
    // Événements de visibilité de la page
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Page redevenue visible - vérifier les mises à jour
            checkForUpdates();
        }
    });
    
    // Événements de mise à jour des collections
    window.addEventListener('collectionUpdated', (e) => {
        handleCollectionUpdate(e.detail);
    });
}

// Vérifier si on doit afficher le prompt d'installation
function shouldShowInstallPrompt() {
    const dismissed = localStorage.getItem('installPromptDismissed') === 'true';
    const installed = localStorage.getItem('pwaInstalled') === 'true';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isiOSStandalone = window.navigator.standalone === true;
    
    return !dismissed && !installed && !isStandalone && !isiOSStandalone;
}
// Fonction pour rejeter le prompt d'installation
function dismissInstallPrompt() {
    console.log('❌ Prompt d\'installation rejeté par l\'utilisateur');
    
    // Cacher le prompt
    hideInstallPrompt();
    
    // Marquer comme rejeté
    installPromptDismissed = true;
    localStorage.setItem('installPromptDismissed', 'true');
    
    // Tracker le rejet
    if (typeof gtag !== 'undefined') {
        gtag('event', 'install_prompt_dismissed', {
            'event_category': 'pwa',
            'event_label': 'installation_prompt'
        });
    }
    
    console.log('📱 Prompt d\'installation rejeté - Ne plus afficher');
}

// Fonction pour cacher le prompt d'installation
function hideInstallPrompt() {
    const installPrompt = document.getElementById('install-prompt');
    if (installPrompt) {
        installPrompt.classList.remove('visible');
        setTimeout(() => {
            installPrompt.style.display = 'none';
        }, 300);
    }
    deferredPrompt = null;
}

// Gérer l'installation de l'application
function handleAppInstalled() {
    hideInstallPrompt();
    localStorage.setItem('pwaInstalled', 'true');
    localStorage.removeItem('installPromptDismissed');
    showNotification('Application installée avec succès!', 'success');
    updatePWAStatus('installed');
    
    // Marquer l'installation pour les collections
    trackPWAInstallation();
    
    // Optimiser les performances après installation
    optimizePostInstallation();
}

// Vérifier l'état des données locales des collections
function checkLocalDataState() {
    const collections = ['clients', 'creations', 'orders'];
    let hasLocalData = false;
    let totalItems = 0;
    
    collections.forEach(collection => {
        const data = localStorage.getItem(`${collection}Collection`);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (parsed.data && parsed.data.length > 0) {
                    hasLocalData = true;
                    totalItems += parsed.data.length;
                    console.log(`📊 Données locales trouvées pour ${collection}: ${parsed.data.length} éléments`);
                    
                    // Vérifier l'intégrité des données
                    checkDataIntegrity(collection, parsed.data);
                }
            } catch (error) {
                console.error(`❌ Erreur lors de l'analyse des données ${collection}:`, error);
                repairCorruptedData(collection);
            }
        }
    });
    
    if (hasLocalData) {
        console.log(`💾 Données locales détectées: ${totalItems} éléments - Mode hors ligne prêt`);
        updateDataIndicator(totalItems);
    } else {
        console.log('🆕 Aucune donnée locale - Synchronisation cloud nécessaire');
        updateDataIndicator(0);
    }
}

// Vérifier l'intégrité des données
function checkDataIntegrity(collection, data) {
    let corruptedItems = 0;
    
    data.forEach((item, index) => {
        if (!item.id || typeof item.id !== 'string') {
            console.warn(`⚠️ Élément ${index} de ${collection} sans ID valide`);
            corruptedItems++;
        }
        
        // Vérifier la date de modification
        if (!item.lastModified) {
            item.lastModified = new Date().toISOString();
            console.log(`📝 Date de modification ajoutée à l'élément ${item.id}`);
        }
    });
    
    if (corruptedItems > 0) {
        console.warn(`⚠️ ${corruptedItems} éléments corrompus détectés dans ${collection}`);
        // Sauvegarder les données réparées
        saveCollection(collection, data);
    }
}

// Réparer les données corrompues
function repairCorruptedData(collection) {
    console.log(`🔧 Tentative de réparation des données ${collection}...`);
    
    // Essayer de récupérer depuis la sauvegarde
    const backup = localStorage.getItem('collectionsBackup');
    if (backup) {
        try {
            const backupData = JSON.parse(backup);
            if (backupData[collection]) {
                saveCollection(collection, backupData[collection]);
                console.log(`✅ Données ${collection} restaurées depuis sauvegarde`);
                return;
            }
        } catch (error) {
            console.error('❌ Erreur lors de la restauration:', error);
        }
    }
    
    // Réinitialiser les données corrompues
    saveCollection(collection, { data: [], lastSync: null });
    console.log(`🔄 Données ${collection} réinitialisées`);
}

// Sauvegarder une collection
function saveCollection(name, data) {
    try {
        localStorage.setItem(`${name}Collection`, JSON.stringify(data));
    } catch (error) {
        console.error(`❌ Erreur lors de la sauvegarde de ${name}:`, error);
        handleStorageFull();
    }
}

// Gérer le stockage plein
function handleStorageFull() {
    console.error('💥 Stockage local plein!');
    showNotification('Espace de stockage insuffisant - Nettoyage en cours...', 'error');
    
    // Nettoyer les anciennes sauvegardes
    cleanupOldBackups();
    
    // Supprimer les données temporaires
    const tempKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('temp_') || key.includes('cache_')) {
            tempKeys.push(key);
        }
    }
    
    tempKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Donnée temporaire supprimée: ${key}`);
    });
    
    showNotification('Espace libéré - Réessayez l\'opération', 'success');
}

// Nettoyer les anciennes sauvegardes
function cleanupOldBackups() {
    const backupKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('backup_') || key.includes('Backup'))) {
            backupKeys.push(key);
        }
    }
    
    // Garder seulement les 2 dernières sauvegardes
    if (backupKeys.length > 2) {
        backupKeys.sort().slice(0, -2).forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Ancienne sauvegarde supprimée: ${key}`);
        });
    }
}

// Enregistrer le Service Worker avec gestion des collections améliorée
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        const swUrl = './sw.js';
        
        navigator.serviceWorker.register(swUrl)
            .then(registration => {
                console.log('✅ Service Worker enregistré avec succès:', registration);
                
                // Vérifier les mises à jour
                setupUpdateHandling(registration);
                
                // Vérifier la version du Service Worker
                checkSWVersion(registration);
            })
            .catch(error => {
                console.error('❌ Échec de l\'enregistrement du Service Worker:', error);
                showNotification('Erreur de chargement de l\'application - Mode hors ligne limité', 'error');
                
                // Réessayer après un délai
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    console.log(`🔄 Nouvelle tentative d'enregistrement (${retryCount}/${MAX_RETRIES}) dans 10s...`);
                    setTimeout(registerServiceWorker, 10000);
                }
            });
        
        // Gérer les changements de contrôleur
        setupControllerHandling();
    } else {
        console.log('⚠️ Service Worker non supporté par ce navigateur');
        showNotification('Fonctionnalités hors ligne limitées', 'warning');
    }
}

// Configuration de la gestion des mises à jour
function setupUpdateHandling(registration) {
    registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Nouveau Service Worker trouvé:', newWorker);
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('📦 Nouveau contenu disponible!');
                showNotification('Nouvelle version disponible! Rafraîchissez la page.', 'info');
                
                // Sauvegarder les données avant mise à jour
                backupCollectionsData();
                
                // Afficher un bouton de rafraîchissement
                showUpdateNotification();
            }
        });
    });
}

// Configuration de la gestion du contrôleur
function setupControllerHandling() {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            console.log('🔄 Controller changé - rafraîchissement de la page');
            
            // Préparer la restauration après rafraîchissement
            preparePostRefreshRestoration();
            
            window.location.reload();
        }
    });
}

// Préparer la restauration après rafraîchissement
function preparePostRefreshRestoration() {
    // Sauvegarder l'état actuel
    const currentState = {
        timestamp: Date.now(),
        collections: {}
    };
    
    ['clients', 'creations', 'orders'].forEach(collection => {
        const data = localStorage.getItem(`${collection}Collection`);
        if (data) {
            currentState.collections[collection] = JSON.parse(data);
        }
    });
    
    localStorage.setItem('preRefreshState', JSON.stringify(currentState));
}

// Sauvegarder les données des collections avant mise à jour
function backupCollectionsData() {
    const collections = ['clients', 'creations', 'orders'];
    const backup = {
        timestamp: Date.now(),
        version: '2.0',
        collections: {}
    };
    
    collections.forEach(collection => {
        const data = localStorage.getItem(`${collection}Collection`);
        if (data) {
            backup.collections[collection] = JSON.parse(data);
        }
    });
    
    if (Object.keys(backup.collections).length > 0) {
        const backupKey = `collectionsBackup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        console.log('💾 Sauvegarde des collections créée:', backupKey);
        
        // Nettoyer les anciennes sauvegardes
        cleanupOldBackups();
    }
}

// Vérifier la version du Service Worker
function checkSWVersion(registration) {
    if (registration.active) {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
            console.log('📋 Version du Service Worker:', event.data);
            updateSWVersionIndicator(event.data);
        };
        registration.active.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
    }
}

// Mettre à jour l'indicateur de version SW
function updateSWVersionIndicator(version) {
    const versionElement = document.getElementById('sw-version');
    if (versionElement) {
        versionElement.textContent = `v${version}`;
    }
}

// Afficher une notification de mise à jour améliorée
function showUpdateNotification() {
    if (document.hidden) {
        // Page en arrière-plan - notification plus tard
        return;
    }
    
    const updateNotification = document.createElement('div');
    updateNotification.className = 'update-notification enhanced';
    updateNotification.innerHTML = `
        <div class="update-content">
            <div class="update-header">
                <span class="update-icon">🔄</span>
                <h3>Mise à jour disponible</h3>
            </div>
            <p class="update-description">Une nouvelle version de l'application est disponible avec des améliorations de performance.</p>
            <div class="update-actions">
                <button class="btn btn-primary" id="refresh-app">
                    <span class="btn-icon">⚡</span>
                    Mettre à jour maintenant
                </button>
                <button class="btn btn-outline" id="refresh-later">
                    <span class="btn-icon">⏰</span>
                    Rappeler plus tard
                </button>
            </div>
            <div class="update-progress" id="update-progress" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Préparation...</span>
            </div>
        </div>
    `;
    
    updateNotification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 16px;
        z-index: 10001;
        box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        max-width: 400px;
        width: 90%;
        animation: slideInDown 0.4s ease-out;
        backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(updateNotification);
    
    document.getElementById('refresh-app').addEventListener('click', () => {
        const progress = document.getElementById('update-progress');
        const progressFill = progress.querySelector('.progress-fill');
        const progressText = progress.querySelector('.progress-text');
        
        progress.style.display = 'block';
        document.getElementById('refresh-app').disabled = true;
        
        // Animation de progression
        let progressValue = 0;
        const progressInterval = setInterval(() => {
            progressValue += 5;
            progressFill.style.width = `${progressValue}%`;
            progressText.textContent = `Mise à jour... ${progressValue}%`;
            
            if (progressValue >= 100) {
                clearInterval(progressInterval);
                progressText.textContent = 'Redémarrage...';
                setTimeout(() => window.location.reload(), 500);
            }
        }, 50);
    });
    
    document.getElementById('refresh-later').addEventListener('click', () => {
        updateNotification.style.animation = 'slideOutUp 0.3s ease-in';
        setTimeout(() => updateNotification.remove(), 300);
        
        // Rappeler dans 1 heure
        setTimeout(showUpdateNotification, 3600000);
    });
    
    // Auto-suppression après 30 secondes
    setTimeout(() => {
        if (updateNotification.parentNode) {
            updateNotification.style.animation = 'slideOutUp 0.3s ease-in';
            setTimeout(() => updateNotification.remove(), 300);
        }
    }, 30000);
}

// Afficher le prompt d'installation amélioré
function showInstallPrompt() {
    const installPrompt = document.getElementById('install-prompt');
    if (deferredPrompt && !installPromptDismissed && installPrompt) {
        console.log('💡 Affichage du prompt d\'installation amélioré');
        
        // Animation d'entrée
        installPrompt.style.display = 'block';
        setTimeout(() => {
            installPrompt.classList.add('visible');
        }, 100);
        
        // Ajouter des métriques d'affichage
        trackInstallPromptDisplay();
        
        // Auto-masquage après 25 secondes avec compte à rebours
        startInstallPromptTimer();
    }
}

// Démarrer le compte à rebours du prompt
function startInstallPromptTimer() {
    const timerElement = document.getElementById('install-timer');
    if (!timerElement) return;
    
    let timeLeft = 25;
    const timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            dismissInstallPrompt();
        }
    }, 1000);
}

// Tracker l'affichage du prompt
function trackInstallPromptDisplay() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'install_prompt_displayed', {
            'event_category': 'pwa',
            'event_label': 'installation_prompt'
        });
    }
}

// Installer l'application avec gestion améliorée
function installApp() {
    if (deferredPrompt) {
        console.log('🚀 Début du processus d\'installation amélioré');
        
        // Désactiver le bouton pendant l'installation
        const installBtn = document.querySelector('#install-prompt .install-btn');
        if (installBtn) {
            installBtn.disabled = true;
            installBtn.innerHTML = '<span class="btn-icon">⏳</span> Installation...';
        }
        
        // Sauvegarder les données avant installation
        backupCollectionsData();
        
        // Afficher le prompt d'installation natif
        deferredPrompt.prompt();
        
        // Attendre la décision de l'utilisateur
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ Utilisateur a accepté l\'installation PWA');
                showNotification('Installation en cours...', 'success');
                
                // Marquer comme installée et tracker
                localStorage.setItem('pwaInstalled', 'true');
                installPromptDismissed = true;
                trackPWAInstallation('accepted');
            } else {
                console.log('❌ Utilisateur a refusé l\'installation PWA');
                trackPWAInstallation('dismissed');
                showNotification('Vous pouvez installer l\'application plus tard via le menu de votre navigateur.', 'info');
                
                // Réactiver le bouton
                if (installBtn) {
                    installBtn.disabled = false;
                    installBtn.innerHTML = '<span class="btn-icon">📱</span> Installer l\'app';
                }
            }
            
            // Réinitialiser la variable
            deferredPrompt = null;
            hideInstallPrompt();
        });
    } else {
        console.log('⚠️ Aucun prompt d\'installation disponible');
        handleNoInstallPrompt();
    }
}

// Gérer l'absence de prompt d'installation
function handleNoInstallPrompt() {
    const isInstalled = localStorage.getItem('pwaInstalled') === 'true' || 
                       window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;
    
    if (isInstalled) {
        showNotification('L\'application est déjà installée sur votre appareil.', 'info');
    } else {
        showNotification('Votre navigateur ne supporte pas l\'installation d\'applications. Essayez avec Chrome, Edge ou Safari.', 'warning');
    }
    
    hideInstallPrompt();
}

// Tracker l'installation PWA avec plus de détails
function trackPWAInstallation(outcome = 'accepted') {
    // Envoyer des métriques d'installation si analytics disponible
    if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_installation', {
            'event_category': 'pwa',
            'event_label': outcome,
            'value': outcome === 'accepted' ? 1 : 0
        });
    }
    
    // Mettre à jour l'interface
    updatePWAStatus('installed');
    
    console.log(`📊 Installation PWA trackée: ${outcome}`);
}

// Optimiser après installation
function optimizePostInstallation() {
    console.log('⚡ Optimisation post-installation...');
    
    // Précharger les ressources critiques
    preloadCriticalResources();
    
    // Optimiser le cache
    optimizeCache();
    
    // Planifier la synchronisation initiale
    scheduleInitialSync();
}

// Précharger les ressources critiques
function preloadCriticalResources() {
    const criticalResources = [
        './styles/main.css',
        './scripts/app.js',
        './images/icon-192.png'
    ];
    
    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.includes('.css') ? 'style' : resource.includes('.js') ? 'script' : 'image';
        document.head.appendChild(link);
    });
}

// Optimiser le cache
function optimizeCache() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'OPTIMIZE_CACHE'
        });
    }
}

// Planifier la synchronisation initiale
function scheduleInitialSync() {
    setTimeout(() => {
        if (typeof window.app !== 'undefined' && typeof window.app.syncWithCloud === 'function') {
            window.app.syncWithCloud();
        }
    }, 5000);
}

// Configurer la gestion des données hors ligne améliorée
function setupOfflineDataManagement() {
    // Surveiller l'espace de stockage
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.includes('Collection')) {
            console.log('💾 Changement détecté dans les données locales:', e.key);
            updateDataIndicator(getTotalItemsCount());
        }
    });
    
    // Vérifier l'espace disponible périodiquement
    setInterval(() => {
        checkStorageQuota();
    }, 60000); // Toutes les minutes
    
    // Surveiller les performances de stockage
    monitorStoragePerformance();
}

// Obtenir le nombre total d'éléments
function getTotalItemsCount() {
    const collections = ['clients', 'creations', 'orders'];
    let total = 0;
    
    collections.forEach(collection => {
        const data = localStorage.getItem(`${collection}Collection`);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (parsed.data) {
                    total += parsed.data.length;
                }
            } catch (error) {
                console.error(`Erreur lors du comptage des éléments ${collection}:`, error);
            }
        }
    });
    
    return total;
}

// Mettre à jour l'indicateur de données
function updateDataIndicator(count) {
    const indicator = document.getElementById('data-indicator');
    if (indicator) {
        indicator.textContent = `${count} éléments`;
        indicator.title = `${count} éléments stockés localement`;
    }
}

// Surveiller les performances de stockage
function monitorStoragePerformance() {
    let lastCheck = Date.now();
    
    setInterval(() => {
        const startTime = performance.now();
        
        // Test d'écriture simple
        const testKey = 'perf_test_' + Date.now();
        try {
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            
            const duration = performance.now() - startTime;
            
            if (duration > 100) {
                console.warn(`⚠️ Performance de stockage lente: ${duration.toFixed(2)}ms`);
                showNotification('Performances de stockage dégradées', 'warning');
            }
        } catch (error) {
            console.error('❌ Erreur de performance de stockage:', error);
        }
    }, 300000); // Toutes les 5 minutes
}

// Vérifier le quota de stockage avec plus de détails
function checkStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
            const used = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const percentage = quota > 0 ? (used / quota) * 100 : 0;
            
            updateStorageIndicator(percentage, used, quota);
            
            if (percentage > 90) {
                console.error('💥 Stockage critique:', percentage.toFixed(1) + '%');
                showNotification('Espace de stockage critique - Synchronisation urgente requise', 'error');
                triggerEmergencyCleanup();
            } else if (percentage > 80) {
                console.warn('⚠️ Stockage local presque plein:', percentage.toFixed(1) + '%');
                showNotification('Espace de stockage presque plein - Synchronisation recommandée', 'warning');
            }
        }).catch(error => {
            console.error('❌ Erreur lors de l\'estimation du stockage:', error);
        });
    }
}

// Mettre à jour l'indicateur de stockage
function updateStorageIndicator(percentage, used, quota) {
    const indicator = document.getElementById('storage-indicator');
    if (indicator) {
        const usedMB = (used / 1024 / 1024).toFixed(1);
        const quotaMB = (quota / 1024 / 1024).toFixed(1);
        indicator.textContent = `${percentage.toFixed(1)}% utilisé`;
        indicator.title = `${usedMB}MB / ${quotaMB}MB utilisés`;
        
        // Changer la couleur selon le niveau
        if (percentage > 90) {
            indicator.style.color = '#f44336';
        } else if (percentage > 80) {
            indicator.style.color = '#ff9800';
        } else {
            indicator.style.color = '#4CAF50';
        }
    }
}

// Déclencher un nettoyage d'urgence
function triggerEmergencyCleanup() {
    console.log('🚨 Nettoyage d\'urgence du stockage...');
    
    // Supprimer les données les plus anciennes
    const collections = ['clients', 'creations', 'orders'];
    
    collections.forEach(collection => {
        const data = localStorage.getItem(`${collection}Collection`);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (parsed.data && parsed.data.length > 50) {
                    // Garder seulement les 50 éléments les plus récents
                    parsed.data.sort((a, b) => {
                        const dateA = new Date(a.lastModified || 0);
                        const dateB = new Date(b.lastModified || 0);
                        return dateB - dateA;
                    });
                    
                    parsed.data = parsed.data.slice(0, 50);
                    saveCollection(collection, parsed);
                    console.log(`🗑️ ${collection} réduit à 50 éléments`);
                }
            } catch (error) {
                console.error(`Erreur lors du nettoyage de ${collection}:`, error);
            }
        }
    });
    
    // Nettoyer toutes les sauvegardes sauf la plus récente
    cleanupOldBackups();
}

// Mettre à jour le statut PWA dans l'interface
function updatePWAStatus(status) {
    const statusElement = document.getElementById('pwa-status');
    if (statusElement) {
        const statusConfig = {
            'installed': { text: '📱 Application installée', className: 'pwa-installed' },
            'browser': { text: '🌐 Mode navigateur', className: 'pwa-browser' },
            'standalone': { text: '🏠 Écran d\'accueil', className: 'pwa-standalone' }
        };
        
        const config = statusConfig[status] || statusConfig.browser;
        statusElement.textContent = config.text;
        statusElement.className = `pwa-status ${config.className}`;
    }
}

// Mettre à jour le statut de connexion
function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        if (isOnline) {
            statusElement.textContent = '🌐 En ligne';
            statusElement.className = 'connection-online';
        } else {
            statusElement.textContent = '📴 Hors ligne';
            statusElement.className = 'connection-offline';
        }
    }
}

// Vérifier les mises à jour
function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
            console.log('🔍 Vérification des mises à jour...');
        });
    }
}

// Gérer la mise à jour des collections
function handleCollectionUpdate(detail) {
    console.log('📝 Collection mise à jour:', detail.collection);
    
    // Sauvegarder automatiquement
    if (detail.autoBackup !== false) {
        backupCollectionsData();
    }
    
    // Synchroniser si en ligne
    if (isOnline && !syncInProgress && typeof window.app?.syncWithCloud === 'function') {
        setTimeout(() => {
            window.app.syncWithCloud();
        }, 2000);
    }
}

// Configuration améliorée des événements réseau
function setupNetworkEvents() {
    // Surveiller les changements de connexion
    window.addEventListener('online', () => {
        console.log('🌐 Connexion rétablie');
        isOnline = true;
        updateConnectionStatus();
        showNotification('Connexion internet rétablie', 'success');
        
        // Resynchroniser les données si nécessaire
        if (typeof window.app !== 'undefined' && typeof window.app.syncWithCloud === 'function') {
            setTimeout(() => {
                syncInProgress = true;
                window.app.syncWithCloud().finally(() => {
                    syncInProgress = false;
                });
                showNotification('Synchronisation des collections en cours...', 'info');
            }, 2000);
        }
    });
    
    window.addEventListener('offline', () => {
        console.log('📴 Perte de connexion');
        isOnline = false;
        updateConnectionStatus();
        showNotification('Vous êtes hors ligne - Mode local activé', 'warning');
        
        // Basculer en mode hors ligne pour les collections
        if (typeof window.app !== 'undefined' && typeof window.app.setOfflineMode === 'function') {
            window.app.setOfflineMode(true);
        }
    });
    
    // Vérifier l'état initial
    if (!navigator.onLine) {
        showNotification('Mode hors ligne - Les données seront synchronisées lors du retour en ligne', 'warning');
    }
}

// Écouter les messages du Service Worker
function setupSWMessageListener() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener('message', event => {
            console.log('📨 Message reçu du Service Worker:', event.data);
            
            switch (event.data.type) {
                case 'SW_ACTIVATED':
                    console.log(`✅ Service Worker ${event.data.version} activé`);
                    showNotification('Application optimisée pour le mode hors ligne', 'success');
                    break;
                    
                case 'CACHE_UPDATED':
                    showNotification('Nouvelles ressources mises en cache', 'info');
                    break;
                    
                case 'SYNC_COMPLETED':
                    showNotification('Synchronisation des données terminée', 'success');
                    break;
                    
                case 'SYNC_FAILED':
                    showNotification('Échec de la synchronisation - Réessai automatique', 'error');
                    break;
                    
                case 'CACHE_FULL':
                    showNotification('Cache plein - Nettoyage automatique', 'warning');
                    break;
            }
        });
    }
}

// Initialiser les écouteurs de messages SW
setupSWMessageListener();

// Exposer les fonctions globalement
window.setupPWA = setupPWA;
window.installApp = installApp;
window.dismissInstallPrompt = dismissInstallPrompt;
window.showInstallPrompt = showInstallPrompt;
window.hideInstallPrompt = hideInstallPrompt;
window.backupCollectionsData = backupCollectionsData;
window.checkForUpdates = checkForUpdates;

console.log('🚀 Module PWA Collections Métier amélioré chargé - Prêt pour l\'installation');