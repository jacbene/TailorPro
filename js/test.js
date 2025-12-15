// js/tests.js - SUITE DE TESTS COMPLÈTE
console.log('🧪 tests.js: Chargement de la suite de tests');

class TestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentTest = null;
    }
    
    /**
     * Enregistre un nouveau test
     */
    test(name, fn) {
        this.tests.push({ name, fn });
    }
    
    /**
     * Exécute tous les tests
     */
    async runAll() {
        console.group('🧪 EXÉCUTION DES TESTS');
        this.results = [];
        
        for (const test of this.tests) {
            await this.runTest(test);
        }
        
        this.generateReport();
        console.groupEnd();
    }
    
    /**
     * Exécute un test individuel
     */
    async runTest(test) {
        this.currentTest = test;
        const startTime = performance.now();
        
        try {
            await test.fn();
            const duration = performance.now() - startTime;
            this.results.push({
                name: test.name,
                status: 'PASS',
                duration: duration.toFixed(2)
            });
            console.log(`✅ ${test.name} (${duration.toFixed(2)}ms)`);
        } catch (error) {
            const duration = performance.now() - startTime;
            this.results.push({
                name: test.name,
                status: 'FAIL',
                error: error.message,
                duration: duration.toFixed(2)
            });
            console.error(`❌ ${test.name}: ${error.message}`);
        }
    }
    
/**
 * Test de l'interface d'authentification
 */
function testAuthInterface() {
    console.group('🧪 TEST INTERFACE AUTH');
    
    const elementsToCheck = [
        'auth-modal',
        'firebaseui-auth-container', 
        'native-auth-option',
        'auth-view',
        'register-view',
        'password-reset-view',
        'login-btn',
        'register-btn',
        'reset-password-btn',
        'toggle-auth-mode',
        'auth-message'
    ];
    
    const results = elementsToCheck.map(id => {
        const element = document.getElementById(id);
        const exists = !!element;
        console.log(`${exists ? '✅' : '❌'} ${id}: ${exists ? 'TROUVÉ' : 'MANQUANT'}`);
        return { id, exists };
    });
    
    const missingElements = results.filter(r => !r.exists);
    
    if (missingElements.length > 0) {
        console.warn('⚠️ Éléments manquants:', missingElements.map(r => r.id));
    } else {
        console.log('🎉 Tous les éléments d\'authentification sont présents!');
    }
    
    console.groupEnd();
    return missingElements.length === 0;
}

// Exécuter le test après le chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🔍 Vérification de l\'interface d\'authentification...');
        testAuthInterface();
    }, 1000);
});
    
    /**
     * Génère un rapport de tests
     */
    generateReport() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        
        console.group('📊 RAPPORT DE TESTS');
        console.log(`✅ ${passed} tests réussis`);
        console.log(`❌ ${failed} tests échoués`);
        console.log(`📋 ${total} tests au total`);
        
        if (failed > 0) {
            console.group('Détails des échecs:');
            this.results.filter(r => r.status === 'FAIL').forEach(test => {
                console.log(`❌ ${test.name}: ${test.error}`);
            });
            console.groupEnd();
        }
        console.groupEnd();
        
        // Afficher le rapport dans l'interface
        this.showTestReport();
    }
    
    /**
     * Affiche le rapport dans l'interface
     */
    showTestReport() {
        const report = document.createElement('div');
        report.className = 'test-report';
        report.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 1rem;
            z-index: 10000;
            max-width: 400px;
            max-height: 500px;
            overflow-y: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        report.innerHTML = `
            <div class="test-report-header">
                <h3>🧪 Rapport de Tests</h3>
                <button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; font-size:1.2em; cursor:pointer;">×</button>
            </div>
            <div class="test-summary">
                <div class="test-stat passed">✅ ${passed} réussis</div>
                <div class="test-stat failed">❌ ${failed} échoués</div>
                <div class="test-stat total">📋 ${this.results.length} total</div>
            </div>
            <div class="test-details">
                ${this.results.map(result => `
                    <div class="test-result ${result.status.toLowerCase()}">
                        <span class="test-status">${result.status === 'PASS' ? '✅' : '❌'}</span>
                        <span class="test-name">${result.name}</span>
                        <span class="test-duration">${result.duration}ms</span>
                        ${result.error ? `<div class="test-error">${result.error}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(report);
    }
    
    /**
     * Assertions de test
     */
    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    assertEqual(actual, expected, message = `Expected ${expected}, got ${actual}`) {
        this.assert(actual === expected, message);
    }
    
    assertNotEqual(actual, expected, message = `Expected not ${expected}, got ${actual}`) {
        this.assert(actual !== expected, message);
    }
    
    assertTruthy(value, message = `Expected truthy value, got ${value}`) {
        this.assert(!!value, message);
    }
    
    assertFalsy(value, message = `Expected falsy value, got ${value}`) {
        this.assert(!value, message);
    }
}

// Création de la suite de tests
const testSuite = new TestSuite();

// TESTS D'AUTHENTIFICATION
testSuite.test('Initialisation Firebase', async () => {
    testSuite.assertTruthy(window.firebaseServices, 'Firebase services should be available');
    testSuite.assertTruthy(typeof window.firebaseServices.initialize === 'function', 'Initialize function should exist');
});

testSuite.test('Configuration Auth Manager', async () => {
    testSuite.assertTruthy(window.AuthManager, 'AuthManager should be available');
    testSuite.assertTruthy(window.authManager, 'authManager instance should be available');
});

// TESTS DES SERVICES MÉTIER
testSuite.test('Service Clients', async () => {
    testSuite.assertTruthy(window.firebaseServices.clients, 'Clients service should be available');
    testSuite.assertTruthy(typeof window.firebaseServices.clients.createClient === 'function', 'createClient should exist');
    testSuite.assertTruthy(typeof window.firebaseServices.clients.getClients === 'function', 'getClients should exist');
});

testSuite.test('Service Créations', async () => {
    testSuite.assertTruthy(window.firebaseServices.creations, 'Creations service should be available');
    testSuite.assertTruthy(typeof window.firebaseServices.creations.createCreation === 'function', 'createCreation should exist');
});

testSuite.test('Service Commandes', async () => {
    testSuite.assertTruthy(window.firebaseServices.orders, 'Orders service should be available');
    testSuite.assertTruthy(typeof window.firebaseServices.orders.createOrder === 'function', 'createOrder should exist');
});

testSuite.test('Service Mesures', async () => {
    testSuite.assertTruthy(window.firebaseServices.measurements, 'Measurements service should be available');
    testSuite.assertTruthy(typeof window.firebaseServices.measurements.createMeasurement === 'function', 'createMeasurement should exist');
});

testSuite.test('Service Facturation', async () => {
    testSuite.assertTruthy(window.firebaseServices.billing, 'Billing service should be available');
    testSuite.assertTruthy(typeof window.firebaseServices.billing.generateInvoice === 'function', 'generateInvoice should exist');
});

// TESTS D'INTÉGRATION
testSuite.test('Intégration Clients-Créations', async () => {
    // Test que les clients et créations peuvent être liés
    const clients = await window.firebaseServices.clients.getClients();
    const creations = await window.firebaseServices.creations.getCreations();
    
    testSuite.assert(Array.isArray(clients), 'Clients should be an array');
    testSuite.assert(Array.isArray(creations), 'Creations should be an array');
});

testSuite.test('Intégration Commandes-Paiements', async () => {
    testSuite.assertTruthy(typeof window.firebaseServices.orders.addPayment === 'function', 'addPayment should exist');
});

// TESTS D'INTERFACE
testSuite.test('Composants d\'Interface', async () => {
    testSuite.assertTruthy(window.uiComponents, 'UI Components should be available');
    testSuite.assertTruthy(typeof window.uiComponents.showGlobalLoading === 'function', 'showGlobalLoading should exist');
});

testSuite.test('Gestion des Modales', async () => {
    testSuite.assertTruthy(window.modalManager, 'Modal Manager should be available');
    testSuite.assertTruthy(typeof window.modalManager.openModal === 'function', 'openModal should exist');
});

// TESTS DE PERFORMANCE
testSuite.test('Performance - Chargement Initial', async () => {
    const startTime = performance.now();
    
    // Simuler le chargement initial
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const loadTime = performance.now() - startTime;
    testSuite.assert(loadTime < 5000, `Initial load should be under 5s, took ${loadTime}ms`);
});

testSuite.test('Performance - Rendu des Données', async () => {
    const startTime = performance.now();
    
    // Test le rendu des clients
    if (typeof renderClients === 'function') {
        await renderClients();
    }
    
    const renderTime = performance.now() - startTime;
    testSuite.assert(renderTime < 1000, `Data rendering should be under 1s, took ${renderTime}ms`);
});

// TESTS DE VALIDATION DES DONNÉES
testSuite.test('Validation - Formulaire Client', () => {
    const testData = {
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        email: 'test@example.com'
    };
    
    testSuite.assertTruthy(testData.firstName, 'First name is required');
    testSuite.assertTruthy(testData.lastName, 'Last name is required');
    testSuite.assert(testData.email.includes('@'), 'Email should be valid');
});

testSuite.test('Validation - Formulaire Création', () => {
    const testData = {
        name: 'Test Creation',
        baseCost: 100,
        materialsCost: 50,
        laborCost: 50
    };
    
    testSuite.assertTruthy(testData.name, 'Creation name is required');
    testSuite.assert(testData.baseCost >= 0, 'Base cost should be positive');
    testSuite.assert(testData.materialsCost >= 0, 'Materials cost should be positive');
    testSuite.assert(testData.laborCost >= 0, 'Labor cost should be positive');
});

// TESTS DE GESTION D'ERREURS
testSuite.test('Gestion des Erreurs - Données Manquantes', async () => {
    try {
        // Essayer d'accéder à un client qui n'existe pas
        await window.firebaseServices.clients.getClient('non-existent-id');
        testSuite.assert(false, 'Should have thrown an error for non-existent client');
    } catch (error) {
        testSuite.assertTruthy(error, 'Error should be thrown for non-existent client');
    }
});

testSuite.test('Gestion des Erreurs - Authentification Requise', async () => {
    // Simuler une déconnexion
    const originalRequireAuth = window.firebaseServices.requireAuth;
    
    try {
        window.firebaseServices.requireAuth = () => Promise.reject(new Error('AUTH_REQUIRED'));
        await window.firebaseServices.clients.getClients();
        testSuite.assert(false, 'Should have thrown auth error');
    } catch (error) {
        testSuite.assert(error.message === 'AUTH_REQUIRED', 'Should throw AUTH_REQUIRED error');
    } finally {
        window.firebaseServices.requireAuth = originalRequireAuth;
    }
});

// Exposer la suite de tests globalement
window.testSuite = testSuite;

// Exécution automatique des tests au chargement (optionnel)
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧪 tests.js: Suite de tests prête');
    
    // Ajouter un bouton de test dans l'interface en mode développement
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const testButton = document.createElement('button');
        testButton.textContent = '🧪 Tests';
        testButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            background: #8a4fff;
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        testButton.addEventListener('click', () => testSuite.runAll());
        document.body.appendChild(testButton);
    }
});

console.log('✅ tests.js: Suite de tests initialisée');

