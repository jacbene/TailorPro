// js/auth.js - VERSION CORRIGÉE POUR MODALE NON VIDE
console.log('🔒 auth.js: Chargement - Version corrigée pour modale non vide');

class AuthManager {
    constructor() {
        console.log('🔒 auth.js: Constructeur AuthManager');
        
        // Services Firebase
        this.auth = window.firebaseServices ? window.firebaseServices.getAuth() : null;
        this.ui = null;
        this.isInitialized = false;
        
        console.log('🔍 auth.js: Services:', {
            auth: !!this.auth,
            firebaseServices: !!window.firebaseServices
        });
        
        this.initializeAuthManager();
    }
    
    /**
     * Initialise le gestionnaire d'authentification
     */
    async initializeAuthManager() {
        console.log('🔒 auth.js: Initialisation du gestionnaire d\'authentification...');
        
        try {
            // Configuration de base
            this.setupViewSwitching();
            
            // Initialisation des écouteurs
            const listenersReady = this.initEventListeners();
            
            if (listenersReady) {
                console.log('✅ auth.js: Écouteurs initialisés avec succès');
                
                // Démarrer la surveillance de l'authentification
                this.checkAuthState();
                this.isInitialized = true;
                
                console.log('✅ auth.js: Gestionnaire d\'authentification initialisé');
                
                // Émettre un événement de ready
                document.dispatchEvent(new CustomEvent('auth-manager-ready'));
            } else {
                console.warn('⚠️ auth.js: Réessai d\'initialisation dans 1s...');
                setTimeout(() => this.initializeAuthManager(), 1000);
            }
            
        } catch (error) {
            console.error('❌ auth.js: Erreur lors de l\'initialisation:', error);
        }
    }
    
    /**
     * Initialise les écouteurs d'événements - VERSION CORRIGÉE
     */
    initEventListeners() {
        console.log('🔒 auth.js: Configuration des écouteurs d\'événements...');
        
        try {
            // Écouteur pour basculer vers l'authentification native
            const showNativeAuthBtn = document.getElementById('show-native-auth-btn');
            if (showNativeAuthBtn) {
                showNativeAuthBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showNativeAuth();
                });
                console.log('✅ auth.js: Bouton auth native configuré');
            }
            
            // Écouteur pour revenir à FirebaseUI
            const backToFirebaseuiBtn = document.getElementById('back-to-firebaseui-btn');
            if (backToFirebaseuiBtn) {
                backToFirebaseuiBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showFirebaseUI();
                });
                console.log('✅ auth.js: Bouton retour FirebaseUI configuré');
            }
            
            // Écouteurs pour les formulaires
            this.setupFormListeners();
            
            // Configuration de la navigation entre les vues
            this.setupViewSwitching();
            
            console.log('✅ auth.js: Tous les écouteurs configurés avec succès');
            return true;
            
        } catch (error) {
            console.error('❌ auth.js: Erreur configuration écouteurs:', error);
            return false;
        }
    }
    
    /**
     * Configure les écouteurs pour les formulaires
     */
    setupFormListeners() {
        console.log('🔒 auth.js: Configuration écouteurs formulaires...');
        
        // Formulaire de connexion
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Formulaire d'inscription
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
        
        // Formulaire de réinitialisation
        const resetForm = document.getElementById('reset-form');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordReset();
            });
        }
        
        console.log('✅ auth.js: Écouteurs formulaires configurés');
    }
    
    /**
     * Configure le changement entre les vues d'authentification
     */
    setupViewSwitching() {
        console.log('🔒 auth.js: Configuration changement de vues...');
        
        // Navigation entre les vues auth native
        const setupLink = (id, view) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showAuthView(view);
                });
            }
        };
        
        setupLink('show-register-link', 'register');
        setupLink('show-reset-link', 'reset');
        setupLink('back-to-login-link', 'login');
        setupLink('back-to-login-from-reset', 'login');
        
        console.log('✅ auth.js: Navigation entre vues configurée');
    }
    
    /**
     * Affiche l'authentification FirebaseUI
     */
    showFirebaseUI() {
        console.log('🎨 auth.js: Affichage FirebaseUI');
        
        // Masquer l'authentification native
        const nativeAuthView = document.getElementById('native-auth-view');
        const firebaseUIView = document.getElementById('firebaseui-view');
        
        if (nativeAuthView) nativeAuthView.style.display = 'none';
        if (firebaseUIView) firebaseUIView.style.display = 'block';
        
        // Initialiser FirebaseUI
        this.initializeFirebaseUI();
        
        this.showMessage('Connectez-vous avec votre méthode préférée', 'info');
    }
    
    /**
     * Affiche l'authentification native
     */
    showNativeAuth() {
        console.log('🎨 auth.js: Affichage authentification native');
        
        // Masquer FirebaseUI
        const nativeAuthView = document.getElementById('native-auth-view');
        const firebaseUIView = document.getElementById('firebaseui-view');
        
        if (nativeAuthView) nativeAuthView.style.display = 'block';
        if (firebaseUIView) firebaseUIView.style.display = 'none';
        
        // Afficher la vue de connexion par défaut
        this.showAuthView('login');
        
        // Réinitialiser FirebaseUI
        if (window.firebaseServices && typeof window.firebaseServices.resetUI === 'function') {
            window.firebaseServices.resetUI();
        }
        
        this.showMessage('Utilisez votre email et mot de passe', 'info');
    }
    
    /**
     * Affiche une vue d'authentification spécifique
     */
    showAuthView(viewName) {
        console.log('🔒 auth.js: Affichage de la vue:', viewName);
        
        // Masquer toutes les vues natives
        const views = ['login', 'register', 'reset'];
        views.forEach(view => {
            const element = document.getElementById(`${view}-view`);
            if (element) element.style.display = 'none';
        });
        
        // Afficher la vue demandée
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.style.display = 'block';
            
            // Messages contextuels
            switch(viewName) {
                case 'login':
                    this.showMessage('Connectez-vous à votre compte', 'info');
                    break;
                case 'register':
                    this.showMessage('Créez votre compte TailorPro', 'info');
                    break;
                case 'reset':
                    this.showMessage('Réinitialisez votre mot de passe', 'info');
                    break;
            }
            
            console.log('✅ auth.js: Vue affichée:', viewName);
        } else {
            console.error('❌ auth.js: Vue non trouvée:', viewName);
        }
    }
    
    /**
     * Initialise FirebaseUI
     */
    initializeFirebaseUI() {
        console.log('🎨 auth.js: Initialisation FirebaseUI...');
        
        if (!window.firebaseServices) {
            console.warn('⚠️ auth.js: Services Firebase non disponibles');
            return;
        }
        
        try {
            const uiInitialized = window.firebaseServices.initializeUI('#firebaseui-auth-container');
            if (uiInitialized) {
                console.log('✅ auth.js: FirebaseUI initialisé avec succès');
            } else {
                console.warn('⚠️ auth.js: FirebaseUI non initialisé - affichage mode secours');
                this.showNativeAuth();
            }
        } catch (error) {
            console.error('❌ auth.js: Erreur initialisation FirebaseUI:', error);
            this.showNativeAuth();
        }
    }
    
    /**
     * Affiche la modale d'authentification - VERSION CORRIGÉE
     */
    showAuthModal() {
        console.log('🔐 auth.js: Affichage modale auth');
        
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'flex';
            
            // Afficher FirebaseUI par défaut
            this.showFirebaseUI();
            
            console.log('✅ auth.js: Modale auth affichée');
        } else {
            console.error('❌ auth.js: Modale auth non trouvée');
        }
    }
    
    /**
     * Masque la modale d'authentification
     */
    hideAuthModal() {
        console.log('🔐 auth.js: Masquage modale auth');
        
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'none';
        }
        
        // Réinitialiser FirebaseUI
        if (window.firebaseServices && typeof window.firebaseServices.resetUI === 'function') {
            window.firebaseServices.resetUI();
        }
    }
    
    /**
     * Vérifie l'état d'authentification
     */
    checkAuthState() {
        console.log('🎯 auth.js: checkAuthState()');
        
        if (!this.auth) {
            console.error('❌ auth.js: Auth non disponible');
            
            // Réessayer après un délai
            setTimeout(() => {
                this.auth = window.firebaseServices ? window.firebaseServices.getAuth() : null;
                if (this.auth) {
                    this.checkAuthState();
                }
            }, 1000);
            return;
        }
        
        // Observateur d'état d'authentification
        this.unsubscribeAuth = this.auth.onAuthStateChanged(
            async (user) => {
                console.log('🎯 auth.js: >>> OBSERVATEUR AUTH DÉCLENCHÉ <<<');
                console.log('🔍 auth.js: User:', user ? user.email : 'null');
                
                try {
                    if (user) {
                        console.log('✅ auth.js: Utilisateur CONNECTÉ:', user.email);
                        
                        // Masquer la modale d'authentification
                        this.hideAuthModal();
                        
                        // Mettre à jour l'interface
                        this.updateUIForAuthState(user);
                        
                        // Émettre l'événement
                        this.dispatchAuthStateChanged(user);
                        
                    } else {
                        console.log('🚪 auth.js: Utilisateur DÉCONNECTÉ');
                        
                        // Mettre à jour l'interface
                        this.updateUIForAuthState(null);
                        
                        // Émettre l'événement
                        this.dispatchAuthStateChanged(null);
                    }
                    
                } catch (error) {
                    console.error('❌ auth.js: Erreur dans l\'observateur auth:', error);
                    this.dispatchAuthError(error);
                }
            },
            (error) => {
                console.error('❌ auth.js: Erreur observateur auth:', error);
                this.dispatchAuthError(error);
            }
        );
        
        console.log('✅ auth.js: Observateur d\'authentification configuré');
    }

    /**
     * Émet un événement d'état d'authentification changé
     */
    dispatchAuthStateChanged(user) {
        try {
            const authEvent = new CustomEvent('auth-state-changed', {
                detail: { 
                    user,
                    timestamp: new Date().toISOString(),
                    collectionsReady: !!user,
                    source: 'auth-manager'
                }
            });
            document.dispatchEvent(authEvent);
            console.log('📡 auth.js: Événement auth-state-changed émis');
        } catch (eventError) {
            console.error('❌ auth.js: Erreur lors de l\'émission de l\'événement:', eventError);
        }
    }

    /**
     * Émet un événement d'erreur d'authentification
     */
    dispatchAuthError(error) {
        try {
            const errorEvent = new CustomEvent('auth-error', {
                detail: { 
                    error: error.message,
                    code: error.code,
                    timestamp: new Date().toISOString()
                }
            });
            document.dispatchEvent(errorEvent);
        } catch (eventError) {
            console.error('❌ auth.js: Erreur lors de l\'émission de l\'événement d\'erreur:', eventError);
        }
    }
    
    /**
     * Met à jour l'UI en fonction de l'état d'authentification
     */
    updateUIForAuthState(user) {
        console.log('🔒 auth.js: updateUIForAuthState - User:', !!user);
        
        if (user) {
            this.showMessage(`Bienvenue ${user.email}!`, 'success');
            
            // Effacer le message après 3 secondes
            setTimeout(() => {
                this.showMessage('', 'info');
            }, 3000);
        }
    }
    
    /**
     * Gère la connexion
     */
    async handleLogin() {
        console.log('🔐 auth.js: Début de handleLogin');
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (!emailInput || !passwordInput) {
            this.showMessage("Les champs de connexion ne sont pas disponibles.", 'error');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validation
        if (!email || !password) {
            this.showMessage("Veuillez remplir tous les champs.", 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showMessage("Veuillez entrer une adresse email valide.", 'error');
            return;
        }

        console.log('🔐 auth.js: Tentative de connexion pour:', email);
        
        if (!this.auth) {
            this.showMessage("Les services d'authentification ne sont pas prêts.", 'error');
            return;
        }

        try {
            this.showLoading(true);
            this.showMessage('Connexion en cours...', 'info');
            
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ auth.js: Connexion réussie:', userCredential.user.email);
            
            this.showMessage('Connexion réussie!', 'success');
            
        } catch (error) {
            console.error('❌ auth.js: Erreur de connexion Firebase:', error);
            this.showMessage(this.getErrorMessage(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Gère l'inscription
     */
    async handleRegister() {
        console.log('🔐 auth.js: Début de handleRegister');
        
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-password');
        
        if (!emailInput || !passwordInput) {
            this.showMessage("Les champs d'inscription ne sont pas disponibles.", 'error');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validation
        if (!email || !password) {
            this.showMessage("Veuillez remplir tous les champs.", 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showMessage("Veuillez entrer une adresse email valide.", 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage("Le mot de passe doit comporter au moins 6 caractères.", 'error');
            return;
        }

        console.log('🔐 auth.js: Tentative d\'inscription pour:', email);
        
        if (!this.auth) {
            this.showMessage("Les services d'authentification ne sont pas prêts.", 'error');
            return;
        }

        try {
            this.showLoading(true);
            this.showMessage('Création du compte en cours...', 'info');
            
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            console.log('✅ auth.js: Inscription réussie:', userCredential.user.email);
            
            this.showMessage('Compte créé avec succès!', 'success');
            
        } catch (error) {
            console.error('❌ auth.js: Erreur d\'inscription Firebase:', error);
            this.showMessage(this.getErrorMessage(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Gère la réinitialisation du mot de passe
     */
    async handlePasswordReset() {
        console.log('🔐 auth.js: Début de handlePasswordReset');
        
        const emailInput = document.getElementById('reset-email');
        
        if (!emailInput) {
            this.showMessage("Le champ email n'est pas disponible.", 'error');
            return;
        }
        
        const email = emailInput.value.trim();
        
        if (!email) {
            this.showMessage("Veuillez entrer votre adresse email.", 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showMessage("Veuillez entrer une adresse email valide.", 'error');
            return;
        }

        console.log('🔐 auth.js: Tentative de réinitialisation pour:', email);
        
        if (!this.auth) {
            this.showMessage("Les services d'authentification ne sont pas prêts.", 'error');
            return;
        }

        try {
            this.showLoading(true);
            this.showMessage('Envoi de l\'email de réinitialisation...', 'info');
            
            await this.auth.sendPasswordResetEmail(email);
            console.log('✅ auth.js: Email de réinitialisation envoyé');
            
            this.showMessage('Email envoyé! Vérifiez votre boîte mail.', 'success');
            
            // Revenir à la vue login après 3 secondes
            setTimeout(() => {
                this.showAuthView('login');
                emailInput.value = '';
            }, 3000);
            
        } catch (error) {
            console.error('❌ auth.js: Erreur réinitialisation mot de passe:', error);
            this.showMessage(this.getErrorMessage(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Valide le format d'email
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Affiche/masque le loading
     */
    showLoading(show) {
        const loadingElement = document.getElementById('auth-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Affiche un message dans le conteneur d'authentification.
     */
    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('auth-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `auth-message ${type}`;
            
            // Auto-effacement pour les messages de succès et d'info
            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    if (messageEl.textContent === message) {
                        messageEl.textContent = '';
                        messageEl.className = 'auth-message';
                    }
                }, type === 'success' ? 5000 : 3000);
            }
        }
    }

    /**
     * Traduit les codes d'erreur Firebase en messages clairs.
     */
    getErrorMessage(error) {
        console.error('🔐 auth.js: Erreur Firebase:', error.code, error.message);
        
        const errorMessages = {
            'auth/invalid-email': 'L\'adresse email n\'est pas valide.',
            'auth/user-disabled': 'Ce compte a été désactivé.',
            'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
            'auth/wrong-password': 'Mot de passe incorrect.',
            'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
            'auth/weak-password': 'Le mot de passe doit comporter au moins 6 caractères.',
            'auth/operation-not-allowed': 'L\'authentification par email/mot de passe n\'est pas activée.',
            'auth/network-request-failed': 'Erreur de connexion réseau. Vérifiez votre accès internet.',
            'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.'
        };

        return errorMessages[error.code] || `Erreur d'authentification: ${error.message}`;
    }

    /**
     * Déconnexion de l'utilisateur
     */
    async signOut() {
        console.log('🚪 auth.js: Déconnexion utilisateur');
        try {
            if (this.auth) {
                await this.auth.signOut();
                console.log('✅ auth.js: Déconnexion réussie');
                this.showMessage('Déconnexion réussie', 'success');
            }
        } catch (error) {
            console.error('❌ auth.js: Erreur déconnexion:', error);
            this.showMessage('Erreur lors de la déconnexion', 'error');
        }
    }

    /**
     * Nettoie les ressources
     */
    destroy() {
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
            console.log('✅ auth.js: Observateur d\'authentification désabonné');
        }
        
        this.isInitialized = false;
        console.log('✅ auth.js: Gestionnaire d\'authentification nettoyé');
    }
}

// Exposer la classe au scope global
window.AuthManager = AuthManager;

// Initialisation automatique lorsque le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔒 auth.js: DOM chargé - Initialisation AuthManager');
    
    if (typeof AuthManager !== 'undefined') {
        window.authManager = new AuthManager();
    } else {
        console.error('❌ auth.js: AuthManager non disponible');
    }
});

console.log('✅ auth.js: Prêt. AuthManager avec FirebaseUI est exposé.');