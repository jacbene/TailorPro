// js/init.js - VERSION AVEC FIREBASEUI INTÉGRÉ
console.log('🏁 init.js: Démarrage - Mode Collections Métier avec FirebaseUI');

// Configuration des collections métier
const BUSINESS_COLLECTIONS_CONFIG = {
    creations: {
        name: 'Créations',
        description: 'Vos modèles et produits',
        icon: '🎨'
    },
    clients: {
        name: 'Clients', 
        description: 'Votre base de clients',
        icon: '👥'
    },
    orders: {
        name: 'Commandes',
        description: 'Suivi des commandes et paiements',
        icon: '📦'
    },
    stats: {
        name: 'Statistiques',
        description: 'Analyses et rapports business',
        icon: '📊'
    }
};

let authManager = null;
let businessCollectionsReady = false;
let firebaseUIInitialized = false;

// Désactiver temporairement le Service Worker pour éviter les problèmes de cache
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
            console.log('🔄 init.js: Désinscription du Service Worker:', registration.scope);
            registration.unregister();
        }
    });
}

// Écouteurs pour la gestion des collections métier
document.addEventListener('business-collections-ready', (event) => {
    console.log('🎯 init.js: Collections métier prêtes pour:', event.detail.user.email);
    businessCollectionsReady = true;
    
    // Mettre à jour l'interface pour refléter la disponibilité des collections
    updateUIForBusinessCollections(true);
    
    // Afficher une notification de succès
    if (window.app && typeof window.app.showNotification === 'function') {
        window.app.showNotification('Vos données business sont maintenant disponibles!', 'success');
    }
});

document.addEventListener('business-collections-error', (event) => {
    console.error('🚨 init.js: Erreur collections métier:', event.detail.error);
    businessCollectionsReady = false;
    
    // Mettre à jour l'interface pour indiquer l'erreur
    updateUIForBusinessCollections(false);
    
    if (window.app && typeof window.app.showNotification === 'function') {
        window.app.showNotification('Erreur lors du chargement des données business', 'error');
    }
});

document.addEventListener('auth-state-changed', (event) => {
    console.log('🎯 init.js: Événement auth-state-changed reçu');
    console.log('🔍 init.js: Détails:', {
        user: event.detail.user ? event.detail.user.email : 'null',
        collectionsReady: event.detail.collectionsReady,
        timestamp: event.detail.timestamp
    });
});

document.addEventListener('auth-required', (event) => {
    console.log('🔐 init.js: Authentification requise pour:', event.detail.action);
    console.log('💬 init.js: Message:', event.detail.message);
    
    // Afficher l'interface d'authentification
    showAuthInterface();
});

document.addEventListener('auth-error', (event) => {
    console.error('🚨 init.js: Erreur auth:', event.detail.error);
});

document.addEventListener('auth-signed-out', () => {
    console.log('🚪 init.js: Utilisateur déconnecté - nettoyage collections métier');
    businessCollectionsReady = false;
    updateUIForBusinessCollections(false);
});

// Événement personnalisé pour FirebaseUI
document.addEventListener('firebaseui-ready', () => {
    console.log('🎨 init.js: FirebaseUI prêt et initialisé');
    firebaseUIInitialized = true;
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏁 init.js: DOM chargé - Lancement avec FirebaseUI et collections métier');
    
    try {
        // --- NETTOYAGE INITIAL ---
        console.log('🧹 init.js: Nettoyage initial...');
        
        // Nettoyer les paramètres URL gênants
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('recovery') || urlParams.has('clean') || urlParams.has('mode')) {
            console.log('🔄 init.js: Nettoyage des paramètres URL...');
            window.history.replaceState({}, '', window.location.pathname);
        }

        // --- Étape 1: Initialiser Firebase SANS BLOCAGE ---
        console.log('🏁 init.js: Initialisation Firebase (non-bloquante)...');
        
        if (window.firebaseServices && typeof window.firebaseServices.initialize === 'function') {
            window.firebaseServices.initialize();
            console.log('✅ init.js: Firebase initialisé sans observateur auth');
            
            // Court délai pour laisser Firebase s'initialiser
            await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
            console.warn('⚠️ init.js: Services Firebase non trouvés - continuation sans Firebase');
        }

        // --- Étape 2: AFFICHER L'APPLICATION IMMÉDIATEMENT ---
        console.log('🏁 init.js: Affichage application pour tous...');
        
        if (window.app && typeof window.app.showAppScreen === 'function') {
            window.app.showAppScreen();
            console.log('✅ init.js: Interface principale affichée');
            
            // Initialiser les fonctionnalités PUBLIQUES
            if (typeof window.app.initPublic === 'function') {
                window.app.initPublic();
                console.log('✅ init.js: Fonctionnalités publiques initialisées');
            } else if (typeof window.app.init === 'function') {
                window.app.init();
                console.log('✅ init.js: Application initialisée (mode compatibilité)');
            }
        } else {
            console.error('❌ init.js: Application non disponible');
            showCriticalError('L\'application n\'a pas pu être chargée.');
            return;
        }

        // --- Étape 3: Initialiser FirebaseUI et AuthManager ---
        console.log('🎨 init.js: Initialisation FirebaseUI et AuthManager...');
        
        // Vérifier que FirebaseUI est disponible
        if (typeof firebaseui === 'undefined') {
            console.warn('⚠️ init.js: FirebaseUI non chargé - authentification native uniquement');
        } else {
            console.log('✅ init.js: FirebaseUI disponible');
        }

        // Initialiser AuthManager avec support FirebaseUI
        if (window.AuthManager) {
            try {
                authManager = new window.AuthManager();
                console.log('✅ init.js: AuthManager instancié avec FirebaseUI');
                
                // Initialiser les écouteurs d'interface
                if (typeof authManager.initEventListeners === 'function') {
                    const listenersReady = authManager.initEventListeners();
                    console.log('✅ init.js: Écouteurs AuthManager initialisés:', listenersReady);
                }
                
                // Configurer le changement de vues auth
                if (typeof authManager.setupViewSwitching === 'function') {
                    authManager.setupViewSwitching();
                    console.log('✅ init.js: Navigation auth configurée');
                }
                
                // Configurer l'option FirebaseUI
                if (typeof authManager.setupFirebaseUIOption === 'function') {
                    authManager.setupFirebaseUIOption();
                    console.log('✅ init.js: Option FirebaseUI configurée');
                }
                
                // Démarrer la surveillance de l'authentification
                if (typeof authManager.checkAuthState === 'function') {
                    authManager.checkAuthState();
                    console.log('✅ init.js: Surveillance auth démarrée');
                }
                
            } catch (error) {
                console.error('❌ init.js: Erreur AuthManager:', error);
            }
        } else {
            console.warn('⚠️ init.js: AuthManager non disponible - authentification limitée');
        }

        // --- Étape 4: Vérifier silencieusement une session existante ---
        console.log('🏁 init.js: Vérification session existante...');
        
        if (window.firebaseServices && typeof window.firebaseServices.checkExistingSession === 'function') {
            try {
                const user = await window.firebaseServices.checkExistingSession();
                if (user) {
                    console.log('🔐 init.js: Session existante détectée:', user.email);
                    
                    // Activer l'observateur pour cette session
                    window.firebaseServices.enableAuthObserver();
                    
                    // Initialiser les collections métier pour la session existante
                    if (authManager && typeof authManager.initializeUserBusinessData === 'function') {
                        await authManager.initializeUserBusinessData(user);
                    }
                } else {
                    console.log('🔐 init.js: Aucune session existante');
                }
            } catch (error) {
                console.warn('⚠️ init.js: Erreur vérification session:', error);
            }
        }

        // --- Étape 5: Configurer la gestion des fonctionnalités premium et collections ---
        setupPremiumFeatures();
        setupBusinessCollections();

        // --- Étape 6: Initialiser FirebaseUI après un délai ---
        setTimeout(() => {
            initializeFirebaseUIDelayed();
        }, 2000);

        console.log('🎉 init.js: Initialisation terminée - Prêt pour FirebaseUI et collections métier');

    } catch (error) {
        console.error('❌ init.js: Erreur lors de l\'initialisation:', error);
        showCriticalError('Erreur mineure: ' + error.message);
    }
});

/**
 * Initialise FirebaseUI après un délai pour éviter les conflits
 */
function initializeFirebaseUIDelayed() {
    console.log('🎨 init.js: Initialisation différée de FirebaseUI...');
    
    if (!window.firebaseServices || typeof window.firebaseServices.initializeUI !== 'function') {
        console.warn('⚠️ init.js: Services FirebaseUI non disponibles');
        return;
    }

    try {
        // Initialiser FirebaseUI mais ne pas l'afficher immédiatement
        const uiInitialized = window.firebaseServices.initializeUI('#firebaseui-auth-container');
        
        if (uiInitialized) {
            console.log('✅ init.js: FirebaseUI initialisé avec succès');
            
            // Masquer le conteneur par défaut
            const firebaseUIContainer = document.getElementById('firebaseui-auth-container');
            if (firebaseUIContainer) {
                firebaseUIContainer.style.display = 'none';
            }
            
            // Émettre un événement de réussite
            document.dispatchEvent(new CustomEvent('firebaseui-ready'));
        } else {
            console.warn('⚠️ init.js: FirebaseUI non initialisé');
        }
    } catch (error) {
        console.error('❌ init.js: Erreur initialisation FirebaseUI:', error);
    }
}

/**
 * Configure la gestion des collections métier
 */
function setupBusinessCollections() {
    console.log('🏗️ init.js: Configuration collections métier...');
    
    // Écouter les événements spécifiques aux collections
    document.addEventListener('business-collections-ready', handleBusinessCollectionsReady);
    document.addEventListener('business-collections-error', handleBusinessCollectionsError);
    
    // Configurer l'interface pour les collections
    updateUIForBusinessCollections(false);
    
    console.log('✅ init.js: Gestion collections métier configurée');
}

/**
 * Gère la disponibilité des collections métier
 */
function handleBusinessCollectionsReady(event) {
    const { user } = event.detail;
    console.log('✅ init.js: Collections métier disponibles pour:', user.email);
    
    // Mettre à jour l'interface
    updateUIForBusinessCollections(true);
    
    // Charger les données initiales si l'app est prête
    if (window.app && typeof window.app.loadDashboardData === 'function') {
        window.app.loadDashboardData();
    }
    
    // Afficher les indicateurs de collections
    showBusinessCollectionsStatus(true);
}

/**
 * Gère les erreurs de collections métier
 */
function handleBusinessCollectionsError(event) {
    const { error, user } = event.detail;
    console.error('❌ init.js: Erreur collections métier pour:', user?.email, error);
    
    // Mettre à jour l'interface
    updateUIForBusinessCollections(false);
    
    // Afficher les indicateurs d'erreur
    showBusinessCollectionsStatus(false);
}

/**
 * Met à jour l'interface pour refléter l'état des collections métier
 */
function updateUIForBusinessCollections(ready) {
    console.log(`🔧 init.js: Mise à jour UI collections - Prêtes: ${ready}`);
    
    const statusIndicator = document.getElementById('business-collections-status');
    if (statusIndicator) {
        if (ready) {
            statusIndicator.innerHTML = `
                <div style="background: #27ae60; color: white; padding: 8px 12px; border-radius: 4px; font-size: 14px;">
                    ✅ Données business disponibles
                </div>
            `;
        } else {
            statusIndicator.innerHTML = `
                <div style="background: #e67e22; color: white; padding: 8px 12px; border-radius: 4px; font-size: 14px;">
                    ⚠️ Données business en attente
                </div>
            `;
        }
    }
    
    // Mettre à jour les boutons d'action en fonction de la disponibilité
    const businessActions = document.querySelectorAll('.business-action');
    businessActions.forEach(button => {
        if (ready) {
            button.disabled = false;
            button.style.opacity = '1';
        } else {
            button.disabled = true;
            button.style.opacity = '0.6';
        }
    });
}

/**
 * Affiche le statut des collections métier dans l'interface
 */
function showBusinessCollectionsStatus(success = true) {
    if (window.app && typeof window.app.showNotification === 'function') {
        if (success) {
            window.app.showNotification('✅ Vos données business sont chargées et disponibles!', 'success');
        } else {
            window.app.showNotification('⚠️ Certaines données business ne sont pas disponibles', 'warning');
        }
    }
}

/**
 * Configure la gestion des fonctionnalités réservées aux utilisateurs connectés
 */
function setupPremiumFeatures() {
    console.log('⚡ init.js: Configuration fonctionnalités premium...');
    
    // Écouter les demandes d'authentification pour les actions protégées
    document.addEventListener('auth-required', handleAuthRequired);
    
    // Écouter les changements d'état d'authentification
    document.addEventListener('auth-state-changed', handleAuthStateChange);
    
    console.log('✅ init.js: Gestion premium configurée');
}

/**
 * Gère les demandes d'authentification (quand une action premium est tentée)
 */
function handleAuthRequired(event) {
    console.log('🔐 init.js: Authentification requise pour:', event.detail.action);
    
    // Afficher l'interface d'authentification
    showAuthInterface();
    
    // Afficher un message contextuel
    if (window.app && typeof window.app.showAuthPrompt === 'function') {
        window.app.showAuthPrompt(event.detail.message);
    }
}

/**
 * Pilote l'affichage de l'application en fonction de l'état de connexion.
 */
function handleAuthStateChange(event) {
    try {
        const { user, collectionsReady } = event.detail;
        
        console.log('🏁 init.js: Événement auth-state-changed - User:', user ? user.email : 'null');

        if (!window.app) {
            console.warn('⚠️ init.js: window.app non disponible, report...');
            setTimeout(() => handleAuthStateChange(event), 5000);
            return;
        }

        if (user) {
            // Utilisateur connecté
            console.log('⭐ init.js: Activation mode premium pour:', user.email);
            try {
                // S'assurer que l'appli est affichée
                if (typeof window.app.showAppScreen === 'function') {
                    window.app.showAppScreen();
                }
                
                // Initialiser les fonctionnalités premium
                if (typeof window.app.initPremium === 'function') {
                    window.app.initPremium(user);
                } else if (typeof window.app.enablePremiumFeatures === 'function') {
                    window.app.enablePremiumFeatures(user);
                }
                
                // Si les collections sont déjà prêtes, mettre à jour l'interface
                if (collectionsReady) {
                    updateUIForBusinessCollections(true);
                }
                
            } catch (error) {
                console.error('❌ init.js: Erreur activation premium:', error);
            }
        } else {
            // Utilisateur déconnecté
            console.log('🔒 init.js: Activation mode public');
            try {
                // S'assurer que l'appli est affichée
                if (typeof window.app.showAppScreen === 'function') {
                    window.app.showAppScreen();
                }
                
                // Désactiver les fonctionnalités premium
                if (typeof window.app.disablePremiumFeatures === 'function') {
                    window.app.disablePremiumFeatures();
                } else if (typeof window.app.initPublic === 'function') {
                    window.app.initPublic();
                }
                
                // Réinitialiser l'état des collections
                updateUIForBusinessCollections(false);
                
                // Réinitialiser FirebaseUI si nécessaire
                if (window.firebaseServices && typeof window.firebaseServices.resetUI === 'function') {
                    window.firebaseServices.resetUI();
                }
                
            } catch (error) {
                console.error('❌ init.js: Erreur activation mode public:', error);
            }
        }
    } catch (error) {
        console.error('❌ init.js: Erreur dans handleAuthStateChange:', error);
    }
}

/**
 * Affiche l'interface d'authentification avec FirebaseUI
 */
function showAuthInterface() {
    console.log('🔐 init.js: Affichage interface auth avec FirebaseUI...');
    
    // Méthode 1: Via l'application
    if (window.app && typeof window.app.showAuthModal === 'function') {
        window.app.showAuthModal();
        
        // Si FirebaseUI est disponible, afficher l'option
        if (firebaseUIInitialized) {
            setTimeout(() => {
                const firebaseUIContainer = document.getElementById('firebaseui-auth-container');
                if (firebaseUIContainer) {
                    firebaseUIContainer.style.display = 'block';
                }
            }, 2000);
        }
        return;
    }
    
    // Méthode 2: Via AuthManager
    if (authManager && typeof authManager.showAuthView === 'function') {
        authManager.showAuthView('login');
        return;
    }
    
    // Méthode 3: Fallback direct
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'block';
        console.log('✅ init.js: Modale auth affichée (fallback)');
    } else {
        console.error('❌ init.js: Impossible d\'afficher l\'interface auth');
    }
}

/**
 * Masque l'interface d'authentification
 */
function hideAuthInterface() {
    console.log('🔐 init.js: Masquage interface auth...');
    
    // Méthode 1: Via l'application
    if (window.app && typeof window.app.hideAuthModal === 'function') {
        window.app.hideAuthModal();
        return;
    }
    
    // Méthode 2: Via AuthManager
    if (authManager && typeof authManager.showAuthView === 'function') {
        authManager.showAuthView('auth');
        return;
    }
    
    // Méthode 3: Fallback direct
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'none';
    }
    
    // Masquer FirebaseUI
    const firebaseUIContainer = document.getElementById('firebaseui-auth-container');
    if (firebaseUIContainer) {
        firebaseUIContainer.style.display = 'none';
    }
}

/**
 * Vérifie si les collections métier sont prêtes
 */
function areBusinessCollectionsReady() {
    return businessCollectionsReady;
}

/**
 * Vérifie si FirebaseUI est initialisé
 */
function isFirebaseUIReady() {
    return firebaseUIInitialized;
}

/**
 * Récupère la configuration des collections métier
 */
function getBusinessCollectionsConfig() {
    return BUSINESS_COLLECTIONS_CONFIG;
}

/**
 * Affiche un message d'erreur critique
 */
function showCriticalError(message) {
    console.error('🚨 ERREUR CRITIQUE:', message);
    
    const authModal = document.getElementById('auth-modal');
    const appContainer = document.getElementById('app-container');
    
    if (authModal) {
        authModal.innerHTML = `
            <div class="modal-content" style="text-align: center; padding: 2rem;">
                <h2 style="color: #e74c3c; margin-bottom: 1rem;">🚨 Erreur Critique</h2>
                <p style="margin-bottom: 1.5rem; color: #333;">${message}</p>
                <div style="margin-bottom: 1rem;">
                    <button onclick="location.reload()" class="btn-primary">Recharger l'application</button>
                </div>
                <div>
                    <button onclick="init.retryInitialization()" class="btn-secondary">Réessayer l'initialisation</button>
                </div>
            </div>
        `;
        authModal.style.display = 'block';
    } else if (appContainer) {
        appContainer.innerHTML = `
            <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
                <h2 style="color: #e74c3c;">🚨 Erreur Critique</h2>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn-primary">Recharger</button>
            </div>
        `;
    }
}

/**
 * Réessaie l'initialisation
 */
function retryInitialization() {
    console.log('🔄 init.js: Nouvelle tentative d\'initialisation...');
    location.reload();
}

// Gestionnaire d'erreurs global
window.addEventListener('error', function(event) {
    console.error('❌ Erreur globale:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Promise rejetée:', event.reason);
});

// Exposition globale
window.init = {
    retryInitialization,
    areBusinessCollectionsReady,
    isFirebaseUIReady,
    getBusinessCollectionsConfig,
    showAuthInterface,
    hideAuthInterface
};

console.log('✅ init.js: Prêt - FirebaseUI et Collections Métier activés');