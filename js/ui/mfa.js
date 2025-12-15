// mfa.js - Version adaptée pour Firebase Authentication
class MFAManager {
    constructor() {
        this.isInitialized = false;
        this.errorCount = 0;
        this.maxErrors = 3;
        this.auth = null;
        console.log('🛡️ Gestionnaire MFA initialisé');
    }

    initialize() {
        if (this.isInitialized) {
            console.log('✅ MFA déjà initialisé');
            return;
        }

        try {
            // Récupérer l'instance auth de Firebase
            if (window.firebaseServices) {
                this.auth = window.firebaseServices.getAuth();
            }
            
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✅ MFA configuré avec succès avec Firebase');
        } catch (error) {
            this.handleError(error, 'initialization');
        }
    }

    setupEventListeners() {
        try {
            // Écouteurs sécurisés avec vérification d'existence
            this.setupSafeEventListener('mfa-verify-btn', 'click', (e) => this.handleMFAVerify(e));
            this.setupSafeEventListener('resend-mfa-code', 'click', (e) => this.handleResendCode(e));
            
            console.log('🎯 Écouteurs MFA configurés');
        } catch (error) {
            this.handleError(error, 'event-listeners');
        }
    }

    setupSafeEventListener(elementId, eventType, handler) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Élément ${elementId} non trouvé pour MFA`);
            return;
        }

        // Supprimer d'abord l'écouteur existant pour éviter les doublons
        element.removeEventListener(eventType, handler);
        element.addEventListener(eventType, handler);
    }

    async handleMFAVerify(event) {
        event.preventDefault();
        
        if (this.errorCount >= this.maxErrors) {
            this.showNotification('Trop de tentatives. Veuillez réessayer plus tard.', 'error');
            return;
        }

        try {
            const code = document.getElementById('mfa-code')?.value.trim();
            
            if (!code || code.length < 6) {
                this.showNotification('Veuillez entrer un code valide', 'error');
                return;
            }

            this.showNotification('Vérification en cours...', 'info');
            
            // Vérification avec Firebase si disponible
            const isValid = await this.verifyMFACode(code);
            
            if (isValid) {
                this.showNotification('Vérification réussie!', 'success');
                this.hideMFAView();
                this.errorCount = 0;
                
                // Émettre un événement de succès MFA
                document.dispatchEvent(new CustomEvent('mfa-verified', {
                    detail: { success: true }
                }));
            } else {
                this.errorCount++;
                const remainingAttempts = this.maxErrors - this.errorCount;
                this.showNotification(`Code invalide. Tentatives restantes: ${remainingAttempts}`, 'error');
                
                if (remainingAttempts <= 0) {
                    this.disableMFAForm();
                }
            }

        } catch (error) {
            this.handleError(error, 'mfa-verify');
        }
    }

    async handleResendCode(event) {
        event.preventDefault();
        
        try {
            this.showNotification('Envoi du code en cours...', 'info');
            
            // Envoi de code avec Firebase si disponible
            const success = await this.sendMFACode();
            
            if (success) {
                this.showNotification('Nouveau code envoyé! Vérifiez votre email.', 'success');
            } else {
                this.showNotification('Erreur lors de l\'envoi du code', 'error');
            }
            
        } catch (error) {
            this.handleError(error, 'resend-code');
        }
    }

    async verifyMFACode(code) {
        try {
            // Si Firebase est disponible, utiliser la vérification Firebase
            if (this.auth && this.auth.currentUser) {
                // Pour l'email verification (exemple)
                if (code === 'email_verification') {
                    await this.auth.currentUser.reload();
                    return this.auth.currentUser.emailVerified;
                }
                
                // Pour les codes de réinitialisation de mot de passe, etc.
                // À adapter selon vos besoins spécifiques
                return await this.verifyWithFirebase(code);
            }
            
            // Fallback: simulation pour le développement
            return await this.verifyWithSimulation(code);
            
        } catch (error) {
            console.error('❌ Erreur vérification MFA:', error);
            return false;
        }
    }

    async verifyWithFirebase(code) {
        // Implémentation spécifique à Firebase
        // Par exemple, pour la vérification d'email :
        try {
            // Cette partie dépend de votre implémentation spécifique
            // Pour l'instant, retourner une simulation
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(code === '123456'); // Code de test
                }, 1000);
            });
        } catch (error) {
            console.error('❌ Erreur Firebase MFA:', error);
            return false;
        }
    }

    async verifyWithSimulation(code) {
        // Simulation pour le développement
        return new Promise((resolve) => {
            setTimeout(() => {
                // Codes de test pour le développement
                const testCodes = ['123456', '000000', '999999'];
                resolve(testCodes.includes(code));
            }, 1000);
        });
    }

    async sendMFACode() {
        try {
            // Si Firebase est disponible, utiliser l'envoi Firebase
            if (this.auth && this.auth.currentUser) {
                // Exemple: renvoyer l'email de vérification
                await this.auth.currentUser.sendEmailVerification();
                return true;
            }
            
            // Fallback: simulation pour le développement
            return await this.sendWithSimulation();
            
        } catch (error) {
            console.error('❌ Erreur envoi code MFA:', error);
            return false;
        }
    }

    async sendWithSimulation() {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('📧 Code MFA envoyé (simulation)');
                resolve(true);
            }, 500);
        });
    }

    showMFAView() {
        try {
            this.hideAllAuthViews();
            const mfaView = document.getElementById('mfa-view');
            if (mfaView) {
                mfaView.style.display = 'block';
                this.enableMFAForm();
            }
        } catch (error) {
            this.handleError(error, 'show-mfa-view');
        }
    }

    hideMFAView() {
        try {
            const mfaView = document.getElementById('mfa-view');
            if (mfaView) {
                mfaView.style.display = 'none';
            }
        } catch (error) {
            this.handleError(error, 'hide-mfa-view');
        }
    }

    enableMFAForm() {
        const verifyBtn = document.getElementById('mfa-verify-btn');
        const codeInput = document.getElementById('mfa-code');
        const resendLink = document.getElementById('resend-mfa-code');
        
        if (verifyBtn) verifyBtn.disabled = false;
        if (codeInput) codeInput.disabled = false;
        if (resendLink) resendLink.style.pointerEvents = 'auto';
    }

    disableMFAForm() {
        const verifyBtn = document.getElementById('mfa-verify-btn');
        const codeInput = document.getElementById('mfa-code');
        const resendLink = document.getElementById('resend-mfa-code');
        
        if (verifyBtn) verifyBtn.disabled = true;
        if (codeInput) codeInput.disabled = true;
        if (resendLink) resendLink.style.pointerEvents = 'none';
        
        this.showNotification('Formulaire MFA désactivé temporairement pour sécurité', 'warning');
    }

    hideAllAuthViews() {
        const views = ['auth-view', 'register-view', 'password-reset-view', 'mfa-view'];
        views.forEach(viewId => {
            const view = document.getElementById(viewId);
            if (view) {
                view.style.display = 'none';
            }
        });
    }

    showNotification(message, type = 'info') {
        // Utiliser la notification globale si disponible
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }

        // Fallback simple
        console.log(`📢 MFA [${type}]: ${message}`);
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    handleError(error, context) {
        console.error(`❌ Erreur MFA (${context}):`, error);
        
        // Prévenir les boucles infinies
        if (this.errorCount < this.maxErrors) {
            this.errorCount++;
            this.showNotification(`Erreur de sécurité: ${error.message}`, 'error');
        } else {
            console.warn('🔒 Trop d\'erreurs MFA - Mode sans échec activé');
            this.showNotification('Mode sécurisé activé. Redémarrage...', 'warning');
            
            // Réinitialiser après un délai
            setTimeout(() => {
                this.errorCount = 0;
                this.isInitialized = false;
                this.initialize(); // Réessayer
            }, 10000);
        }
    }

    // Méthode pour gérer la vérification d'email Firebase
    async handleEmailVerification() {
        if (!this.auth || !this.auth.currentUser) {
            this.showNotification('Utilisateur non connecté', 'error');
            return false;
        }

        try {
            this.showNotification('Envoi de l\'email de vérification...', 'info');
            
            await this.auth.currentUser.sendEmailVerification();
            this.showNotification('Email de vérification envoyé! Vérifiez votre boîte mail.', 'success');
            
            return true;
        } catch (error) {
            console.error('❌ Erreur envoi email vérification:', error);
            this.showNotification('Erreur lors de l\'envoi de l\'email de vérification', 'error');
            return false;
        }
    }

    // Méthode pour vérifier si l'email est vérifié
    async checkEmailVerification() {
        if (!this.auth || !this.auth.currentUser) {
            return false;
        }

        try {
            await this.auth.currentUser.reload();
            return this.auth.currentUser.emailVerified;
        } catch (error) {
            console.error('❌ Erreur vérification email:', error);
            return false;
        }
    }

    reset() {
        this.isInitialized = false;
        this.errorCount = 0;
        console.log('🔄 MFA réinitialisé');
    }

    // Méthode pour mettre à jour l'instance auth
    updateAuth(authInstance) {
        this.auth = authInstance;
        console.log('🔄 Instance auth MFA mise à jour');
    }
}

// Initialisation sécurisée
let mfaManager = null;

function setupMFA() {
    try {
        if (mfaManager) {
            console.log('✅ MFA déjà configuré');
            return mfaManager;
        }

        mfaManager = new MFAManager();
        mfaManager.initialize();
        
        // Écouter les changements d'état d'authentification
        document.addEventListener('auth-state-changed', (event) => {
            if (mfaManager && event.detail.user) {
                mfaManager.updateAuth(window.firebaseServices?.getAuth());
            }
        });
        
        return mfaManager;
    } catch (error) {
        console.error('❌ Échec de la configuration MFA:', error);
        
        // Fallback - Ne pas bloquer l'application
        if (typeof showNotification === 'function') {
            showNotification('Fonctionnalité MFA temporairement indisponible', 'warning');
        }
        
        return null;
    }
}

// Fonction utilitaire pour afficher la vue MFA
function showMFAView() {
    const manager = setupMFA();
    if (manager) {
        manager.showMFAView();
    }
}

// Fonction utilitaire pour gérer la vérification d'email
async function sendEmailVerification() {
    const manager = setupMFA();
    if (manager) {
        return await manager.handleEmailVerification();
    }
    return false;
}

// Exporter pour une utilisation globale
window.MFAManager = MFAManager;
window.setupMFA = setupMFA;
window.showMFAView = showMFAView;
window.sendEmailVerification = sendEmailVerification;

console.log('✅ MFA Firebase adapté chargé - Prêt pour l\'initialisation sécurisée');