// js/debug-auth.js - SCRIPT DE DEBUG
console.log('🐛 debug-auth.js: Script de debug pour l\'authentification');

function debugAuthModal() {
    console.group('🐛 DEBUG MODALE AUTH');
    
    // Vérifier les éléments critiques
    const criticalElements = [
        'auth-modal',
        'firebaseui-view',
        'native-auth-view',
        'firebaseui-auth-container',
        'show-native-auth-btn',
        'login-view',
        'register-view',
        'reset-view'
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${element ? '✅' : '❌'} ${id}: ${element ? 'PRÉSENT' : 'MANQUANT'}`);
        
        if (element) {
            console.log(`   - Display: ${element.style.display}`);
            console.log(`   - Visible: ${element.offsetParent !== null}`);
        }
    });
    
    // Vérifier Firebase Services
    console.log('🔍 Firebase Services:', {
        firebaseServices: !!window.firebaseServices,
        authManager: !!window.authManager,
        AuthManager: !!window.AuthManager
    });
    
    console.groupEnd();
}

// Tester l'ouverture de la modale
window.testAuthModal = function() {
    console.log('🧪 Test ouverture modale auth');
    debugAuthModal();
    
    if (window.authManager && typeof window.authManager.showAuthModal === 'function') {
        window.authManager.showAuthModal();
    } else if (window.app && typeof window.app.showAuthModal === 'function') {
        window.app.showAuthModal();
    } else {
        console.error('❌ Aucune méthode showAuthModal trouvée');
        // Fallback manuel
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'flex';
            console.log('✅ Modale affichée manuellement');
        }
    }
};

// Exécuter le debug au chargement
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🔍 Vérification automatique de la modale auth...');
        debugAuthModal();
    }, 2000);
});

console.log('✅ debug-auth.js: Script de debug chargé');

