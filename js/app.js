// js/app.js - VERSION MISE À JOUR AVEC FIREBASEUI, COLLECTIONS MÉTIER ET COOKIES RGPD
console.log('🚀 app.js: Chargement - Version FirebaseUI, Collections Métier et Cookies RGPD');

// Variables globales
let isAppInitialized = false;
// let currentUser = null;
let globalData = {
    creations: [],
    clients: [],
    orders: [],
    stats: null,
    publicData: []
};

// === GESTION DES COOKIES RGPD ===

/**
 * Initialise la gestion des cookies RGPD
 */
function initCookieConsent() {
    console.log('🍪 app.js: Initialisation gestion cookies RGPD');
    
    // Créer le modal cookies s'il n'existe pas
    createCookieModal();
    
    // Vérifier si le consentement a déjà été donné
    const cookieConsent = getCookieConsent();
    
    if (!cookieConsent) {
        // Afficher le modal si aucun consentement n'a été donné
        setTimeout(() => {
            showCookieModal();
        }, 1000);
    } else {
        // Appliquer les préférences existantes
        applyCookiePreferences(cookieConsent);
        console.log('✅ app.js: Préférences cookies appliquées:', cookieConsent);
    }
}

/**
 * Crée le modal de consentement aux cookies
 */
function createCookieModal() {
    if (document.getElementById('cookie-consent-modal')) {
        return; // Le modal existe déjà
    }
    
    console.log('🔧 app.js: Création modal cookies RGPD');
    
    const cookieModal = document.createElement('div');
    cookieModal.id = 'cookie-consent-modal';
    cookieModal.className = 'cookie-modal';
    cookieModal.style.display = 'none';
    
    cookieModal.innerHTML = `
        <div class="cookie-modal-content">
            <div class="cookie-header">
                <h3>🍪 Gestion des cookies</h3>
            </div>
            
            <div class="cookie-body">
                <p>Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                   Conformément au RGPD, nous avons besoin de votre consentement.</p>
                
                <div class="cookie-categories">
                    <div class="cookie-category">
                        <div class="category-header">
                            <label class="cookie-toggle">
                                <input type="checkbox" id="essential-cookies" checked disabled>
                                <span class="toggle-slider"></span>
                            </label>
                            <div class="category-info">
                                <strong>Cookies essentiels</strong>
                                <span class="category-status">(Toujours activés)</span>
                            </div>
                        </div>
                        <p class="category-description">Nécessaires au fonctionnement du site, ne peuvent pas être désactivés.</p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="category-header">
                            <label class="cookie-toggle">
                                <input type="checkbox" id="analytics-cookies">
                                <span class="toggle-slider"></span>
                            </label>
                            <div class="category-info">
                                <strong>Cookies analytiques</strong>
                                <span class="category-status">(Recommandés)</span>
                            </div>
                        </div>
                        <p class="category-description">Nous aident à comprendre comment vous utilisez le site pour l'améliorer.</p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="category-header">
                            <label class="cookie-toggle">
                                <input type="checkbox" id="marketing-cookies">
                                <span class="toggle-slider"></span>
                            </label>
                            <div class="category-info">
                                <strong>Cookies marketing</strong>
                                <span class="category-status">(Optionnels)</span>
                            </div>
                        </div>
                        <p class="category-description">Pour personnaliser les publicités et mesurer leur performance.</p>
                    </div>
                </div>
                
                <div class="cookie-links">
                    <a href="politique-cookies.html" target="_blank">Politique des cookies</a>
                    <a href="privacy-policy.html" target="_blank">Politique de confidentialité</a>
                    <a href="legal-notice.html" target="_blank">Mentions légales</a>
                </div>
            </div>
            
            <div class="cookie-footer">
                <button id="cookie-accept-all" class="btn-cookie btn-cookie-primary">
                    Tout accepter
                </button>
                <button id="cookie-save-preferences" class="btn-cookie btn-cookie-secondary">
                    Enregistrer mes préférences
                </button>
                <button id="cookie-reject-all" class="btn-cookie btn-cookie-tertiary">
                    Tout refuser
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(cookieModal);
    setupCookieModalEvents();
}

/**
 * Affiche le modal de consentement aux cookies
 */
function showCookieModal() {
    console.log('🍪 app.js: Affichage modal cookies');
    const modal = document.getElementById('cookie-consent-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Cache le modal de consentement aux cookies
 */
function hideCookieModal() {
    console.log('🍪 app.js: Masquage modal cookies');
    const modal = document.getElementById('cookie-consent-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupCookieModalEvents() {
    console.log('🔧 app.js: Configuration événements modal cookies');
    
    // Utiliser event delegation ou réattacher les événements après création
    setTimeout(() => {
        // Bouton "Tout accepter"
        const acceptAllBtn = document.getElementById('cookie-accept-all');
        if (acceptAllBtn) {
            acceptAllBtn.addEventListener('click', handleAcceptAllCookies);
            console.log('✅ Bouton "Tout accepter" configuré');
        }
        
        // Bouton "Tout refuser"
        const rejectAllBtn = document.getElementById('cookie-reject-all');
        if (rejectAllBtn) {
            rejectAllBtn.addEventListener('click', handleRejectAllCookies);
            console.log('✅ Bouton "Tout refuser" configuré');
        }
        
        // Bouton "Enregistrer mes préférences"
        const savePrefBtn = document.getElementById('cookie-save-preferences');
        if (savePrefBtn) {
            savePrefBtn.addEventListener('click', handleSaveCookiePreferences);
            console.log('✅ Bouton "Enregistrer préférences" configuré');
        }
        
        // Vérification finale
        console.log('🔧 État boutons cookies:', {
            acceptAll: !!acceptAllBtn,
            rejectAll: !!rejectAllBtn,
            savePref: !!savePrefBtn
        });
    }, 100);
}

// Fonctions séparées pour plus de clarté
function handleAcceptAllCookies() {
    console.log('🍪 app.js: Utilisateur accepte tous les cookies');
    setCookieConsent({
        essential: true,
        analytics: true,
        marketing: true,
        timestamp: new Date().toISOString()
    });
    hideCookieModal();
    showNotification('Préférences cookies enregistrées', 'success');
}

function handleRejectAllCookies() {
    console.log('🍪 app.js: Utilisateur refuse tous les cookies');
    setCookieConsent({
        essential: true, // Toujours true car nécessaire
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString()
    });
    hideCookieModal();
    showNotification('Préférences cookies enregistrées', 'success');
}

function handleSaveCookiePreferences() {
    console.log('🍪 app.js: Utilisateur enregistre ses préférences');
    const preferences = {
        essential: true, // Toujours true
        analytics: document.getElementById('analytics-cookies')?.checked || false,
        marketing: document.getElementById('marketing-cookies')?.checked || false,
        timestamp: new Date().toISOString()
    };
    
    setCookieConsent(preferences);
    hideCookieModal();
    showNotification('Préférences cookies enregistrées', 'success');
}

/**
 * Récupère le consentement actuel depuis le localStorage
 */
function getCookieConsent() {
    try {
        const consent = localStorage.getItem('tailorpro_cookie_consent');
        return consent ? JSON.parse(consent) : null;
    } catch (error) {
        console.error('❌ app.js: Erreur lecture consentement cookies:', error);
        return null;
    }
}

/**
 * Sauvegarde le consentement dans le localStorage
 */
function setCookieConsent(consent) {
    try {
        localStorage.setItem('tailorpro_cookie_consent', JSON.stringify(consent));
        applyCookiePreferences(consent);
        console.log('✅ app.js: Consentement cookies sauvegardé:', consent);
    } catch (error) {
        console.error('❌ app.js: Erreur sauvegarde consentement cookies:', error);
    }
}

/**
 * Applique les préférences de cookies
 */
function applyCookiePreferences(consent) {
    console.log('🍪 app.js: Application préférences cookies:', consent);
    
    // Désactiver les services selon les préférences
    if (!consent.analytics) {
        disableAnalyticsServices();
    }
    
    if (!consent.marketing) {
        disableMarketingServices();
    }
    
    // Toujours activer les services essentiels
    enableEssentialServices();
}

/**
 * Désactive les services d'analytics
 */
function disableAnalyticsServices() {
    console.log('📊 app.js: Désactivation analytics');
    // Exemple: window['ga-disable-GA_MEASUREMENT_ID'] = true;
}

/**
 * Désactive les services marketing
 */
function disableMarketingServices() {
    console.log('📧 app.js: Désactivation marketing');
    // Exemple: désactiver Facebook Pixel, etc.
}

/**
 * Active les services essentiels
 */
function enableEssentialServices() {
    console.log('🔧 app.js: Activation services essentiels');
    // Les services essentiels comme l'authentification sont toujours actifs
}

/**
 * Vérifie si un type de cookie est autorisé
 */
function isCookieAllowed(cookieType) {
    const consent = getCookieConsent();
    if (!consent) return false;
    
    switch (cookieType) {
        case 'essential':
            return consent.essential;
        case 'analytics':
            return consent.analytics;
        case 'marketing':
            return consent.marketing;
        default:
            return false;
    }
}

/**
 * Réinitialise le consentement (pour tests)
 */
function resetCookieConsent() {
    localStorage.removeItem('tailorpro_cookie_consent');
    console.log('🍪 app.js: Consentement cookies réinitialisé');
    showCookieModal();
}

// --- Gestion FirebaseUI ---

/**
 * Gère le succès de l'authentification FirebaseUI
 */
function handleAuthSuccess(user) {
    console.log('✅ app.js: Authentification FirebaseUI réussie pour:', user.email);
    
    // Masquer la modale d'authentification
    hideAuthModal();
    
    // Initialiser les fonctionnalités premium
    if (typeof initPremium === 'function') {
        initPremium(user);
    }
    
    // Afficher une notification
    showNotification(`Bienvenue ${user.email} !`, 'success');
}

/**
 * Configure l'interface FirebaseUI dans la modale d'authentification
 */
function setupFirebaseUIInterface() {
    console.log('🎨 app.js: Configuration interface FirebaseUI...');
    
    const authView = document.getElementById('firebaseui-view');
    if (!authView) {
        console.warn('⚠️ app.js: Vue auth non trouvée - création dynamique');
        createAuthModal();
        return;
    }
    
    // Vérifier si l'option FirebaseUI existe déjà
    if (document.getElementById('firebaseui-option')) {
        console.log('✅ app.js: Option FirebaseUI déjà configurée');
        return;
    }
    
    // Créer l'option FirebaseUI
    const firebaseUIOption = document.createElement('div');
    firebaseUIOption.id = 'firebaseui-option';
    firebaseUIOption.className = 'firebaseui-option';
    firebaseUIOption.innerHTML = `
        <div class="auth-separator">
            <span>Ou connectez-vous avec</span>
        </div>
        <div id="firebaseui-auth-container"></div>
        <div class="auth-native-option">
            <button id="show-native-auth" class="btn-secondary">
                📧 Utiliser email/mot de passe
            </button>
        </div>
    `;
    
    // Insérer après le formulaire de connexion
    const loginButton = document.getElementById('login-btn');
    if (loginButton && loginButton.parentNode) {
        loginButton.parentNode.insertBefore(firebaseUIOption, loginButton.nextSibling);
        console.log('✅ app.js: Interface FirebaseUI ajoutée');
    } else {
        // Fallback: ajouter à la fin de la vue auth
        authView.appendChild(firebaseUIOption);
        console.log('✅ app.js: Interface FirebaseUI ajoutée (fallback)');
    }
    
    // Configurer l'écouteur pour basculer vers l'authentification native
    document.getElementById('show-native-auth')?.addEventListener('click', (e) => {
        e.preventDefault();
        showNativeAuth();
    });
}

function createAuthModal() {
    console.log('🔧 app.js: Création dynamique de la modale auth');
    
    // Créer la modale d'authentification
    const authModal = document.createElement('div');
    authModal.id = 'auth-modal';
    authModal.className = 'modal';
    authModal.style.display = 'none';
    
    authModal.innerHTML = `
        <div class="modal-content" style="heigth:100%;>
            <span class="close" onclick="app.hideAuthModal()">&times;</span>
            
            <div id="auth-view">
                <h2>Connexion à TailorPro</h2>
                <div id="firebaseui-auth-container"></div>
                <div class="auth-native-option">
                    <button id="show-native-auth" class="btn-secondary">
                        📧 Utiliser email/mot de passe
                    </button>
                </div>
            </div>
            
            <div id="register-view" style="display: none;">
                <h2>Inscription</h2>
                <form id="register-form">
                    <input type="email" id="register-email" placeholder="Email" required>
                    <input type="password" id="register-password" placeholder="Mot de passe" required>
                    <button type="submit" class="btn-primary">S'inscrire</button>
                </form>
                <button onclick="app.showAuthView('auth')" class="btn-secondary">← Retour</button>
            </div>
            
            <div id="password-reset-view" style="display: none;">
                <h2>Réinitialiser le mot de passe</h2>
                <form id="password-reset-form">
                    <input type="email" id="reset-email" placeholder="Email" required>
                    <button type="submit" class="btn-primary">Envoyer le lien</button>
                </form>
                <button onclick="app.showAuthView('auth')" class="btn-secondary">← Retour</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(authModal);
    console.log('✅ app.js: Modale auth créée dynamiquement');
}

/**
 * Affiche l'authentification native (email/mot de passe)
 */
function showNativeAuth() {
    console.log('🎨 app.js: Affichage authentification native');
    
    // Masquer FirebaseUI
    const firebaseUIContainer = document.getElementById('firebaseui-auth-container');
    if (firebaseUIContainer) {
        firebaseUIContainer.style.display = 'none';
        
        // Réinitialiser FirebaseUI
        if (window.firebaseServices && typeof window.firebaseServices.resetUI === 'function') {
            window.firebaseServices.resetUI();
        }
    }
    
    // Afficher la vue de connexion native
    showAuthView('auth');
}

/**
 * Affiche une vue d'authentification spécifique
 */
function showAuthView(viewName) {
    console.log('🔒 app.js: Affichage de la vue:', viewName);
    
    // Masquer toutes les vues
    const views = ['auth', 'register', 'password-reset', 'mfa'];
    views.forEach(view => {
        const element = document.getElementById(`${view}-view`);
        if (element) element.style.display = 'none';
    });
    
    // Masquer FirebaseUI si on bascule vers une vue native
    if (viewName !== 'firebaseui') {
        const firebaseUIContainer = document.getElementById('firebaseui-auth-container');
        if (firebaseUIContainer) {
            firebaseUIContainer.style.display = 'none';
        }
    }
    
    // Afficher la vue demandée
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.style.display = 'block';
        console.log('✅ app.js: Vue affichée:', viewName);
    } else {
        console.error('❌ app.js: Vue non trouvée:', viewName);
    }
}

// --- Contrôle de l'affichage --- 

function showLoginScreen() {
    console.log('🔐 app.js: Affichage écran connexion');
    const authModal = document.getElementById('auth-modal');
    const appContainer = document.getElementById('app-container');
    
    if (authModal) authModal.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
    document.body.classList.add('logged-out');
}

function showAppScreen() {
    console.log('📱 app.js: Affichage application principale');
    const authModal = document.getElementById('auth-modal');
    const appContainer = document.getElementById('app-container');
    
    if (authModal) authModal.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    document.body.classList.remove('logged-out');
}

function showAuthModal() {
    console.log('🔐 app.js: Affichage modale auth');
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'flex';
        
        // Afficher FirebaseUI si disponible
        if (window.init && window.init.isFirebaseUIReady && window.init.isFirebaseUIReady()) {
            const firebaseUIContainer = document.getElementById('firebaseui-auth-container');
            if (firebaseUIContainer) {
                firebaseUIContainer.style.display = 'block';
            }
        }
    }
}

function hideAuthModal() {
    console.log('🔐 app.js: Masquage modale auth');
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

// --- Initialisation de l'application ---

/**
 * Initialise les fonctionnalités PUBLIQUES (accessible à tous)
 */
function initPublic() {
    if (isAppInitialized) return;
    console.log('🚀 app.js: Initialisation fonctionnalités PUBLIQUES...');

    // Initialiser la gestion des cookies RGPD
    initCookieConsent();

    // Charger les données publiques
    loadPublicData();

    // Configurer l'interface publique
    setupPublicInterface();

    // Configurer FirebaseUI
    setupFirebaseUIInterface();

    // Configurer les écouteurs d'événements de base
    setupEventListeners();

    // Initialiser les modals
    if (typeof setupModalEvents === 'function') setupModalEvents();

    // Gère la logique PWA
    if (typeof setupPWA === 'function') setupPWA();

    // Afficher le tableau de bord par défaut
    showTab('dashboard');

    isAppInitialized = true;
    console.log('✅ app.js: Fonctionnalités publiques initialisées');
}

/**
 * Initialise les fonctionnalités PREMIUM (uniquement pour utilisateurs connectés)
 */
async function initPremium(user) {
    console.log('⭐ app.js: Initialisation fonctionnalités PREMIUM pour:', user.email);
    currentUser = user;

    // Initialiser les collections métier
    await initializeBusinessData();

    // Activer l'interface premium
    enablePremiumFeatures();

    // Afficher les sections réservées
    showPremiumSections();

    // Mettre à jour l'interface utilisateur
    updateUIForUser(user);

    // Charger les données du tableau de bord
    await loadDashboardData();
}

/**
 * Initialise les données métier pour un utilisateur connecté
 */
async function initializeBusinessData() {
    if (!currentUser) return;
    
    try {
        console.log('🏗️ app.js: Initialisation données métier...');
        
        // Initialiser les collections métier
        if (window.firebaseServices && typeof window.firebaseServices.initializeBusinessCollections === 'function') {
            await window.firebaseServices.initializeBusinessCollections(currentUser);
        }
        
        // Charger toutes les données métier
        await Promise.all([
            loadCreationsData(),
            loadClientsData(),
            loadOrdersData(),
            loadStatsData()
        ]);
        
        console.log('✅ app.js: Données métier initialisées');
        
    } catch (error) {
        console.error('❌ app.js: Erreur initialisation données métier:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

/**
 * Active les fonctionnalités premium dans l'interface
 */
function enablePremiumFeatures() {
    console.log('⭐ app.js: Activation fonctionnalités premium...');
    
    // Afficher les boutons d'actions premium
    const premiumButtons = document.querySelectorAll('.premium-only');
    premiumButtons.forEach(btn => {
        btn.style.display = 'block';
        btn.disabled = false;
    });
    
    // Activer les formulaires de création
    const creationForms = document.querySelectorAll('.creation-form, .client-form, .order-form');
    creationForms.forEach(form => {
        form.style.display = 'block';
    });
    
    // Mettre à jour le menu utilisateur
    updateUserMenu();
}

/**
 * Désactive les fonctionnalités premium
 */
function disablePremiumFeatures() {
    console.log('🔒 app.js: Désactivation fonctionnalités premium');
    currentUser = null;
    globalData.creations = [];
    globalData.clients = [];
    globalData.orders = [];
    globalData.stats = null;
    
    // Masquer les boutons d'actions premium
    const premiumButtons = document.querySelectorAll('.premium-only');
    premiumButtons.forEach(btn => {
        btn.style.display = 'none';
        btn.disabled = true;
    });
    
    // Masquer les formulaires de création
    const creationForms = document.querySelectorAll('.creation-form, .client-form, .order-form');
    creationForms.forEach(form => {
        form.style.display = 'none';
    });
    
    // Masquer les sections premium
    hidePremiumSections();
    
    // Afficher les CTA de connexion
    showAuthCTAs();
    
    // Re-rendre l'interface publique
    renderPublicContent();
    
    // Réinitialiser FirebaseUI
    if (window.firebaseServices && typeof window.firebaseServices.resetUI === 'function') {
        window.firebaseServices.resetUI();
    }
}

/**
 * Affiche les sections réservées aux utilisateurs connectés
 */
function showPremiumSections() {
    console.log('⭐ app.js: Affichage sections premium');
    const premiumSections = document.querySelectorAll('.premium-section');
    premiumSections.forEach(section => {
        section.style.display = 'block';
    });
    
    // Masquer les CTA de connexion
    hideAuthCTAs();
}

/**
 * Masque les sections réservées aux utilisateurs connectés
 */
function hidePremiumSections() {
    console.log('🔒 app.js: Masquage sections premium');
    const premiumSections = document.querySelectorAll('.premium-section');
    premiumSections.forEach(section => {
        section.style.display = 'none';
    });
}

/**
 * Affiche les appels à l'action pour la connexion
 */
function showAuthCTAs() {
    console.log('🔐 app.js: Affichage CTA connexion');
    const authCTAs = document.querySelectorAll('.auth-cta');
    authCTAs.forEach(cta => {
        cta.style.display = 'block';
    });
}

/**
 * Masque les appels à l'action pour la connexion
 */
function hideAuthCTAs() {
    console.log('🔐 app.js: Masquage CTA connexion');
    const authCTAs = document.querySelectorAll('.auth-cta');
    authCTAs.forEach(cta => {
        cta.style.display = 'none';
    });
}

// --- Gestion des données métier ---

/**
 * Charge les données PUBLIQUES (accessibles à tous)
 */
async function loadPublicData() {
    console.log('📥 app.js: Chargement données PUBLIQUES...');
    try {
        if (window.firebaseServices && typeof window.firebaseServices.loadPublicData === 'function') {
            const publicData = await window.firebaseServices.loadPublicData('publicContent');
            globalData.publicData = publicData || [];
            console.log('✅ app.js: Données publiques chargées:', publicData.length, 'éléments');
        } else {
            console.log('ℹ️ app.js: Firebase non disponible - utilisation données mock');
            globalData.publicData = getMockPublicData();
        }
        
        renderPublicContent();
        
    } catch (error) {
        console.error('❌ app.js: Erreur chargement données publiques:', error);
        globalData.publicData = getMockPublicData();
        renderPublicContent();
    }
}

/**
 * Charge les données du tableau de bord
 */
async function loadDashboardData() {
    if (!currentUser) return;
    
    try {
        console.log('📊 app.js: Chargement données dashboard...');
        
        // Charger les statistiques business
        await loadStatsData();
        
        // Re-rendre le dashboard
        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }
        
    } catch (error) {
        console.error('❌ app.js: Erreur chargement dashboard:', error);
    }
}

/**
 * Charge les données des créations
 */
async function loadCreationsData() {
    if (!currentUser) return;
    
    try {
        console.log('🎨 app.js: Chargement données créations...');
        
        if (window.firebaseServices && window.firebaseServices.creations) {
            globalData.creations = await window.firebaseServices.creations.getCreations();
            console.log('✅ app.js: Créations chargées:', globalData.creations.length);
        } else {
            console.warn('⚠️ app.js: Service créations non disponible');
            globalData.creations = [];
        }
        
    } catch (error) {
        console.error('❌ app.js: Erreur chargement créations:', error);
        globalData.creations = [];
    }
}

/**
 * Charge les données des clients
 */
async function loadClientsData() {
    if (!currentUser) return;
    
    try {
        console.log('👥 app.js: Chargement données clients...');
        
        if (window.firebaseServices && window.firebaseServices.clients) {
            globalData.clients = await window.firebaseServices.clients.getClients();
            console.log('✅ app.js: Clients chargés:', globalData.clients.length);
        } else {
            console.warn('⚠️ app.js: Service clients non disponible');
            globalData.clients = [];
        }
        
    } catch (error) {
        console.error('❌ app.js: Erreur chargement clients:', error);
        globalData.clients = [];
    }
}

/**
 * Charge les données des commandes
 */
async function loadOrdersData() {
    if (!currentUser) return;
    
    try {
        console.log('📦 app.js: Chargement données commandes...');
        
        if (window.firebaseServices && window.firebaseServices.orders) {
            globalData.orders = await window.firebaseServices.orders.getOrders();
            console.log('✅ app.js: Commandes chargées:', globalData.orders.length);
        } else {
            console.warn('⚠️ app.js: Service commandes non disponible');
            globalData.orders = [];
        }
        
    } catch (error) {
        console.error('❌ app.js: Erreur chargement commandes:', error);
        globalData.orders = [];
    }
}

/**
 * Charge les statistiques business
 */
async function loadStatsData() {
    if (!currentUser) return;
    
    try {
        console.log('📈 app.js: Chargement statistiques...');
        
        if (window.firebaseServices && typeof window.firebaseServices.getBusinessStats === 'function') {
            globalData.stats = await window.firebaseServices.getBusinessStats();
            console.log('✅ app.js: Statistiques chargées');
        } else {
            console.warn('⚠️ app.js: Service statistiques non disponible');
            globalData.stats = null;
        }
        
    } catch (error) {
        console.error('❌ app.js: Erreur chargement statistiques:', error);
        globalData.stats = null;
    }
}

/**
 * Données mock pour le mode public
 */
function getMockPublicData() {
    return [
        { 
            id: 1, 
            title: 'TailorPro Business Management', 
            description: 'Application de gestion complète pour artisans et créateurs' 
        },
        { 
            id: 2, 
            title: 'Gérez vos créations', 
            description: 'Enregistrez vos modèles avec leurs coûts et photos' 
        },
        { 
            id: 3, 
            title: 'Suivez vos clients', 
            description: 'Centralisez les informations de vos clients et leurs mesures' 
        },
        { 
            id: 4, 
            title: 'Organisez vos commandes', 
            description: 'Gérez les commandes, paiements et échéances' 
        }
    ];
}

// --- Gestion des formulaires métier ---

/**
 * Crée une nouvelle création
 */
async function createNewCreation(creationData) {
    try {
        if (!currentUser) {
            showAuthPrompt('Connectez-vous pour créer une création');
            return;
        }

        console.log('🎨 app.js: Création nouvelle création:', creationData.name);
        
        const newCreation = await window.firebaseServices.creations.createCreation(creationData);
        
        // Mettre à jour les données locales
        globalData.creations.unshift(newCreation);
        
        // Re-rendre les créations
        if (typeof renderCreations === 'function') {
            renderCreations();
        }
        
        showNotification('Création ajoutée avec succès!', 'success');
        return newCreation;
        
    } catch (error) {
        console.error('❌ app.js: Erreur création:', error);
        showNotification('Erreur lors de la création: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Crée un nouveau client
 */
async function createNewClient(clientData) {
    try {
        if (!currentUser) {
            showAuthPrompt('Connectez-vous pour ajouter un client');
            return;
        }

        console.log('👥 app.js: Création nouveau client:', clientData.fullName);
        
        const newClient = await window.firebaseServices.clients.createClient(clientData);
        
        // Mettre à jour les données locales
        globalData.clients.unshift(newClient);
        
        // Re-rendre les clients
        if (typeof renderClients === 'function') {
            renderClients();
        }
        
        showNotification('Client ajouté avec succès!', 'success');
        return newClient;
        
    } catch (error) {
        console.error('❌ app.js: Erreur création client:', error);
        showNotification('Erreur lors de l\'ajout du client: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Crée une nouvelle commande
 */
async function createNewOrder(orderData) {
    try {
        if (!currentUser) {
            showAuthPrompt('Connectez-vous pour créer une commande');
            return;
        }

        console.log('📦 app.js: Création nouvelle commande');
        
        const newOrder = await window.firebaseServices.orders.createOrder(orderData);
        
        // Mettre à jour les données locales
        globalData.orders.unshift(newOrder);
        
        // Re-rendre les commandes
        if (typeof renderOrders === 'function') {
            renderOrders();
        }
        
        // Recharger les statistiques
        await loadStatsData();
        
        showNotification('Commande créée avec succès!', 'success');
        return newOrder;
        
    } catch (error) {
        console.error('❌ app.js: Erreur création commande:', error);
        showNotification('Erreur lors de la création de commande: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Ajoute un paiement à une commande
 */
async function addOrderPayment(orderId, paymentData) {
    try {
        if (!currentUser) {
            showAuthPrompt('Connectez-vous pour enregistrer un paiement');
            return;
        }

        console.log('💰 app.js: Ajout paiement pour commande:', orderId);
        
        const result = await window.firebaseServices.orders.addPayment(orderId, paymentData);
        
        // Mettre à jour la commande locale
        const orderIndex = globalData.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
            globalData.orders[orderIndex] = result.order;
        }
        
        // Re-rendre les commandes
        if (typeof renderOrders === 'function') {
            renderOrders();
        }
        
        // Recharger les statistiques
        await loadStatsData();
        
        showNotification('Paiement enregistré avec succès!', 'success');
        return result;
        
    } catch (error) {
        console.error('❌ app.js: Erreur ajout paiement:', error);
        showNotification('Erreur lors de l\'enregistrement du paiement: ' + error.message, 'error');
        throw error;
    }
}

// --- Interface utilisateur ---

/**
 * Configure la navigation principale
 */
function setupNavigation() {
    console.log('🧭 app.js: Configuration navigation principale...');
    
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionName = link.getAttribute('data-section');
            
            if (!sectionName) {
                console.warn('⚠️ app.js: Lien sans data-section:', link);
                return;
            }
            
            console.log('🧭 app.js: Navigation vers:', sectionName);
            
            // Vérifier l'authentification pour les sections premium
            if (isPremiumSection(sectionName) && !currentUser) {
                const sectionNames = {
                    'clients': 'Gestion des clients',
                    'orders': 'Gestion des commandes', 
                    'creations': 'Galerie de créations',
                    'measurements': 'Module de mesures',
                    'finances': 'Données financières',
                    'settings': 'Paramètres'
                };
                
                const sectionLabel = sectionNames[sectionName] || sectionName;
                showAuthPrompt(`Connectez-vous pour accéder à ${sectionLabel}`);
                return;
            }
            
            showTab(sectionName);
        });
    });
    
    console.log('✅ app.js: Navigation configurée');
}

/**
 * Vérifie si une section nécessite une authentification
 */
function isPremiumSection(sectionName) {
    const premiumSections = [
        'clients', 'orders', 'creations', 
        'measurements', 'finances', 'settings'
    ];
    return premiumSections.includes(sectionName);
}

/**
 * Affiche une section spécifique
 */
function showTab(tabName) {
    console.log('📱 app.js: Affichage onglet:', tabName);
    
    // Masquer toutes les sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Désactiver tous les liens de navigation
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('nav-active');
    });
    
    // Activer la section demandée
    const targetSection = document.getElementById(`${tabName}-section`);
    const targetLink = document.querySelector(`nav a[data-section="${tabName}"]`);
    
    if (targetSection && targetLink) {
        targetSection.classList.add('active');
        targetLink.classList.add('nav-active');
        
        // Charger et afficher les données spécifiques à l'onglet
        switch(tabName) {
            case 'dashboard':
                if (typeof renderDashboard === 'function') renderDashboard();
                break;
            case 'clients':
                if (currentUser) {
                    loadClientsData().then(() => {
                        if (typeof renderClients === 'function') renderClients();
                    });
                }
                break;
            case 'orders':
                if (currentUser) {
                    loadOrdersData().then(() => {
                        if (typeof renderOrders === 'function') renderOrders();
                    });
                }
                break;
            case 'creations':
                if (currentUser) {
                    loadCreationsData().then(() => {
                        if (typeof renderCreations === 'function') renderCreations();
                    });
                }
                break;
        }
        
        console.log('✅ app.js: Onglet affiché:', tabName);
    } else {
        console.error('❌ app.js: Section ou lien non trouvé:', tabName);
    }
}

/**
 * Configure l'interface publique
 */
function setupPublicInterface() {
    console.log('🎨 app.js: Configuration interface publique');
    
    // Afficher le contenu public par défaut
    renderPublicContent();
    
    // Configurer la navigation de base
    setupNavigation();
    
    // Afficher les CTA de connexion
    showAuthCTAs();
}

/**
 * Met à jour l'interface pour l'utilisateur connecté
 */
function updateUIForUser(user) {
    console.log('👤 app.js: Mise à jour UI pour:', user.email);
    
    // Mettre à jour le header avec le nom d'utilisateur
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
        userInfoElement.innerHTML = `
            <span>Connecté en tant que: ${user.email}</span>
            <button onclick="app.signOut()" class="logout-btn">Déconnexion</button>
        `;
    }
    
    // Mettre à jour le dashboard
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
}

/**
 * Met à jour le menu utilisateur
 */
function updateUserMenu() {
    const userMenu = document.getElementById('user-menu');
    if (userMenu && currentUser) {
        userMenu.innerHTML = `
            <div class="user-info">
                <span>${currentUser.email}</span>
                <button onclick="app.signOut()" class="btn-secondary">Déconnexion</button>
            </div>
        `;
    }
}

/**
 * Affiche une invite d'authentification contextuelle
 */
function showAuthPrompt(message = 'Connectez-vous pour accéder à cette fonctionnalité') {
    console.log('🔐 app.js: Prompt auth:', message);
    showNotification(message, 'info');
    
    // Optionnel: Afficher la modale auth après un délai
    setTimeout(() => {
        showAuthModal();
    }, 1500);
}

// --- Écouteurs d'événements ---

function setupEventListeners() {
    console.log('🔧 app.js: Configuration écouteurs événements');
    
    // Navigation entre les onglets
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            if (section) {
                // Vérifier l'authentification pour les onglets premium
                if (['clients', 'creations', 'orders', 'finances'].includes(section) && !currentUser) {
                    showAuthPrompt('Connectez-vous pour accéder à ' + section);
                    return;
                }
                showTab(section);
            }
        });
    });
    
    // Écouteurs pour les formulaires (seront attachés dynamiquement dans les render functions)
    console.log('✅ app.js: Écouteurs événements configurés');
}

// --- Fonctions de rendu ---

function renderPublicContent() {
    console.log('🎨 app.js: Rendu contenu public');
    const publicSection = document.getElementById('public-content');
    if (publicSection) {
        const featuresHtml = globalData.publicData.map(item => `
            <div class="feature-card">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
        `).join('');
        
        publicSection.innerHTML = `
            <div class="public-welcome">
                <h1>Bienvenue sur TailorPro</h1>
                <p>Gérez votre activité d'artisan/créateur de manière professionnelle</p>
                
                <div class="features-grid">
                    ${featuresHtml}
                </div>
                
                <div class="auth-cta">
                    <button onclick="app.showAuthModal()" class="btn-primary">
                        Se connecter pour accéder à vos données
                    </button>
                </div>
                
                <div class="cookie-management" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
                    <small>
                        <a href="javascript:void(0)" onclick="app.showCookieModal()" style="color: #667eea; text-decoration: none;">
                            🍪 Gérer les préférences cookies
                        </a>
                    </small>
                </div>
            </div>
        `;
    }
}

function renderAll() {
    console.log('🎨 app.js: Rendu complet');
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderCreations === 'function' && currentUser) renderCreations();
    if (typeof renderClients === 'function' && currentUser) renderClients();
    if (typeof renderOrders === 'function' && currentUser) renderOrders();
}

// --- Déconnexion ---

/**
 * Déconnexion de l'utilisateur
 */
async function signOut() {
    console.log('🚪 app.js: Déconnexion utilisateur');
    try {
        if (window.firebaseServices && typeof window.firebaseServices.signOut === 'function') {
            await window.firebaseServices.signOut();
            disablePremiumFeatures();
            showNotification('Déconnexion réussie', 'success');
        } else {
            const auth = window.firebaseServices?.getAuth();
            if (auth) await auth.signOut();
            disablePremiumFeatures();
        }
        
        // Retourner à l'écran public
        showTab('dashboard');
        
    } catch (error) {
        console.error('❌ app.js: Erreur déconnexion:', error);
        showNotification('Erreur lors de la déconnexion', 'error');
    }
}

// --- Notifications ---

/**
 * Affiche une notification (version sécurisée)
 */
function showNotification(message, type = 'info') {
    if (message.includes('chargement') && type === 'error') {
        document.body.style.overflow = 'hidden'; 
        console.warn(`📢 Notification [${type} évitée]: ${message}`);
        return;
    }
    
    console.log(`📢 Notification [${type}]: ${message}`);
    
    if (typeof window.showNotification === 'function') {
        try {
            window.showNotification(message, type);
            document.body.style.overflow = 'hidden'; 
            return;
        } catch (error) {
            console.warn('⚠️ app.js: Erreur showNotification render.js:', error);
        }
    }
    
    // Fallback simple
    try {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
        
    } catch (error) {
        console.warn('⚠️ app.js: Impossible d\'afficher la notification:', error);
    }
}

// --- Exposition globale ---
window.app = {
    // Initialisation
    init: initPublic,
    initPublic: initPublic,
    initPremium: initPremium,
    
    // Affichage
    showLoginScreen: showLoginScreen,
    showAppScreen: showAppScreen,
    showAuthModal: showAuthModal,
    hideAuthModal: hideAuthModal,
    showAuthView: showAuthView,
    showNativeAuth: showNativeAuth,
    
    // FirebaseUI
    handleAuthSuccess: handleAuthSuccess,
    setupFirebaseUIInterface: setupFirebaseUIInterface,
    
    // Fonctionnalités premium
    enablePremiumFeatures: enablePremiumFeatures,
    disablePremiumFeatures: disablePremiumFeatures,
    showPremiumSections: showPremiumSections,
    hidePremiumSections: hidePremiumSections,
    
    // Données métier
    initializeBusinessData: initializeBusinessData,
    loadCreationsData: loadCreationsData,
    loadClientsData: loadClientsData,
    loadOrdersData: loadOrdersData,
    loadStatsData: loadStatsData,
    
    // Actions métier
    createNewCreation: createNewCreation,
    createNewClient: createNewClient,
    createNewOrder: createNewOrder,
    addOrderPayment: addOrderPayment,
    
    // Données globales
    getGlobalData: () => globalData,
    getCurrentUser: () => currentUser,
    
    // Actions utilisateur
    showAuthPrompt: showAuthPrompt,
    signOut: signOut,
    
    // Rendus
    renderAll: renderAll,
    
    // Navigation
    showTab: showTab,
    showNotification: showNotification,
    
    // Gestion des cookies
    initCookieConsent: initCookieConsent,
    showCookieModal: showCookieModal,
    resetCookieConsent: resetCookieConsent,
    isCookieAllowed: isCookieAllowed,
    getCookieConsent: getCookieConsent
};

// Test manuel - à appeler depuis la console navigateur
window.debugCookies = function() {
    console.log('🔍 DEBUG COOKIES:');
    console.log('- Modal exists:', !!document.getElementById('cookie-consent-modal'));
    console.log('- Accept button:', !!document.getElementById('cookie-accept-all'));
    console.log('- Reject button:', !!document.getElementById('cookie-reject-all'));
    console.log('- Save button:', !!document.getElementById('cookie-save-preferences'));
    console.log('- Consent:', getCookieConsent());
    
    // Test des écouteurs
    const acceptBtn = document.getElementById('cookie-accept-all');
    if (acceptBtn) {
        const listeners = getEventListeners(acceptBtn);
        console.log('- Accept button listeners:', listeners);
    }
};

// Exposer les fonctions pour les appels HTML
window.showTab = showTab;
window.showNotification = showNotification;
window.showCookieModal = showCookieModal;
window.resetCookieConsent = resetCookieConsent;

console.log('✅ app.js: Prêt - Version FirebaseUI, Collections Métier et Cookies RGPD chargée');