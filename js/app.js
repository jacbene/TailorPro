// js/app.js - VERSION OPTIMISÉE AVEC PRÉ-CHARGEMENT
console.log('🚀 app.js: Chargement - Version Pré-chargement');

// Variables globales
let isAppInitialized = false;
let isDataPreloaded = false;
let currentUser = null;
let globalData = {
    creations: [],
    clients: [],
    orders: [],
};

// --- GESTION DU CHARGEMENT GLOBAL ---

function showAppLoader(message = 'Chargement de votre espace de travail...') {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.querySelector('p').textContent = message;
        loader.style.display = 'flex';
    }
}

function hideAppLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// --- INITIALISATION ---

function initPublic() {
    if (isAppInitialized) return;
    console.log('🚀 app.js: Initialisation fonctionnalités PUBLIQUES...');
    setupEventListeners();
    if (typeof window.modalManager?.init === 'function') window.modalManager.init();
    showTab('dashboard');
    isAppInitialized = true;
    console.log('✅ app.js: Fonctionnalités publiques initialisées');
}

async function initPremium(user) {
    console.log('⭐ app.js: Initialisation fonctionnalités PREMIUM pour:', user.email);
    currentUser = user;

    showAppLoader(); // AFFICHER L'ÉCRAN DE CHARGEMENT

    await initializeBusinessData();
    
    if (!isDataPreloaded) {
        await preloadAllData();
    }
    
    enablePremiumFeatures();
    updateUIForUser(user);
    await renderDashboard(); // Le premier rendu du dashboard

    hideAppLoader(); // MASQUER L'ÉCRAN DE CHARGEMENT
}

async function initializeBusinessData() {
    if (!currentUser) return;
    try {
        console.log('🏗️ app.js: Initialisation données métier...');
        if (window.firebaseServices?.initializeBusinessCollections) {
            await window.firebaseServices.initializeBusinessCollections(currentUser);
        }
    } catch (error) {
        console.error('❌ app.js: Erreur initialisation données métier:', error);
        showNotification('Erreur d\'initialisation des services', 'error');
    }
}

// --- PRÉ-CHARGEMENT DES DONNÉES ---

async function preloadAllData() {
    if (isDataPreloaded || !currentUser) return;
    console.log('⏳ app.js: Pré-chargement de toutes les données métier...');

    try {
        await Promise.all([
            loadCreationsData(),
            loadClientsData(),
            loadOrdersData()
        ]);
        isDataPreloaded = true;
        console.log('✅ app.js: Toutes les données ont été pré-chargées.');
    } catch (error) {
        console.error('❌ app.js: Erreur lors du pré-chargement des données:', error);
        showNotification('Erreur critique lors du chargement des données.', 'error');
    }
}

// --- CHARGEMENT INDIVIDUEL (Fallback) ---

async function loadCreationsData() {
    if (!currentUser || !window.firebaseServices?.creations) return;
    try {
        globalData.creations = await window.firebaseServices.creations.getCreations();
    } catch (error) { console.error('Erreur chargement créations:', error); }
}

async function loadClientsData() {
    if (!currentUser || !window.firebaseServices?.clients) return;
    try {
        globalData.clients = await window.firebaseServices.clients.getClients();
    } catch (error) { console.error('Erreur chargement clients:', error); }
}

async function loadOrdersData() {
    if (!currentUser || !window.firebaseServices?.orders) return;
    try {
        globalData.orders = await window.firebaseServices.orders.getOrders();
    } catch (error) { console.error('Erreur chargement commandes:', error); }
}

// --- GESTION DE L'INTERFACE ---

function enablePremiumFeatures() {
    document.getElementById('premium-sections').style.display = 'block';
    document.getElementById('public-content').style.display = 'none';
    updateUserMenu();
}

function disablePremiumFeatures() {
    currentUser = null;
    isDataPreloaded = false;
    Object.keys(globalData).forEach(key => globalData[key] = []);
    document.getElementById('premium-sections').style.display = 'none';
    document.getElementById('public-content').style.display = 'block';
    renderPublicContent();
}

function isPremiumSection(sectionName) {
    return ['clients', 'orders', 'creations', 'gallery', 'measurements', 'finances', 'settings'].includes(sectionName);
}

function showTab(tabName) {
    console.log('📱 app.js: Affichage onglet:', tabName);

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('nav-active'));

    const targetSection = document.getElementById(`${tabName}-section`);
    const targetLink = document.querySelector(`nav a[data-section="${tabName}"]`);

    if (targetSection && targetLink) {
        targetSection.classList.add('active');
        targetLink.classList.add('nav-active');

        if (currentUser || !isPremiumSection(tabName)) {
            // Les données sont déjà chargées, on ne fait que rendre
            switch(tabName) {
                case 'dashboard': renderDashboard(); break;
                case 'clients': renderClients(); break;
                case 'orders': renderOrders(); break;
                case 'creations': renderCreations('creations-grid', { showActions: true }); break;
                case 'gallery': renderCreations('gallery-grid', { showDescription: false, showPrice: false, showActions: false }); break;
                case 'measurements': if (typeof renderMeasurements === 'function') renderMeasurements(); break;
                case 'finances': if (typeof renderFinancialDashboard === 'function') renderFinancialDashboard(); break;
            }
        }
    } else {
        console.error('❌ app.js: Section ou lien non trouvé pour:', tabName);
    }
}

function updateUIForUser(user) {
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.innerHTML = `<span>${user.email}</span> <button onclick="app.signOut()" class="logout-btn">Déconnexion</button>`;
    }
}

function updateUserMenu() {}

function showAuthPrompt(message = 'Connectez-vous pour accéder à cette fonctionnalité') {
    showNotification(message, 'info');
    setTimeout(() => app.showAuthModal(), 1500);
}

// --- ÉCOUTEURS D'ÉVÉNEMENTS ---

function setupEventListeners() {
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionName = link.getAttribute('data-section');
            if (!sectionName) return;

            if (isPremiumSection(sectionName) && !currentUser) {
                showAuthPrompt(`Connectez-vous pour accéder à ${link.textContent.trim()}`);
                return;
            }
            showTab(sectionName);
        });
    });
}

// --- RENDU ---

function renderPublicContent() {
    const publicSection = document.getElementById('public-content');
    if (publicSection) {
        publicSection.innerHTML = `
            <div class="public-welcome">
                <h1>Bienvenue sur TailorPro</h1>
                <p>Gérez votre activité d'artisan de manière simple et professionnelle.</p>
                <div class="auth-cta">
                    <button onclick="app.showAuthModal()" class="btn-primary">Connexion / Inscription</button>
                </div>
            </div>
        `;
    }
}

async function renderDashboard() { if (typeof window.renderDashboard === 'function') window.renderDashboard(globalData); }
async function renderClients() { if (typeof window.renderClients === 'function') window.renderClients(globalData.clients); }
async function renderOrders() { if (typeof window.renderOrders === 'function') window.renderOrders(globalData.orders); }

// --- AUTHENTIFICATION ---

function handleAuthSuccess(user) {
    hideAuthModal();
    initPremium(user);
}

async function signOut() {
    try {
        if (window.firebaseServices?.signOut) await window.firebaseServices.signOut();
        disablePremiumFeatures();
        showNotification('Vous avez été déconnecté.', 'success');
        showTab('dashboard');
    } catch (error) {
        console.error('❌ app.js: Erreur déconnexion:', error);
        showNotification('Erreur lors de la déconnexion', 'error');
    }
}

// --- NOTIFICATIONS ---

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// --- EXPOSITION GLOBALE ---

window.app = {
    init: initPublic,
    initPremium,
    showTab,
    showAuthModal: () => document.getElementById('auth-modal').style.display = 'flex',
    hideAuthModal: () => document.getElementById('auth-modal').style.display = 'none',
    handleAuthSuccess,
    signOut,
    showAuthPrompt,
    showNotification,
};

window.showTab = showTab;

console.log('✅ app.js: Prêt - Version Pré-chargement chargée.');