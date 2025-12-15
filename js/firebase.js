// js/firebase.js - VERSION "LAZY AUTH"
console.log('🔥 firebase.js: Chargement - Mode Accès Libre');

const firebaseConfig = {
    apiKey: "AIzaSyC8kEnAiUh5aYPwEztHhgM9s89hjLE3uP0",
    authDomain: "taylorpro-85369071-9db57.firebaseapp.com",
    projectId: "taylorpro-85369071-9db57",
    storageBucket: "taylorpro-85369071-9db57.firebasestorage.app",
    messagingSenderId: "609218281071",
    appId: "1:609218281071:web:026f1a985f80daddb7579a"
};

let auth = null;
let db = null;
let currentUser = null;
let firebaseInitialized = false;
let authObserverUnsubscribe = null;
let authObserverEnabled = false;

/**
 * Initialisation Firebase SANS observateur auth bloquant
 */
function initializeFirebase() {
    if (firebaseInitialized) {
        console.log('🔥 firebase.js: Déjà initialisé.');
        return;
    }
        
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialisé avec succès');
        } else {
            firebase.app();
            console.log('✅ Firebase déjà initialisé');
        }
        
        // Initialiser les services
        auth = firebase.auth();
        db = firebase.firestore();
        
        firebaseInitialized = true;
        console.log('✅ Services Firebase (Auth, Firestore) initialisés');
        
    } catch (error) {
        console.error('❌ Erreur initialisation Firebase:', error);
    }
}

// Configuration FirebaseUI
const uiConfig = {
    signInSuccessUrl: '/', // Redirection après connexion réussie
    signInOptions: [
        {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: true,
            signInMethod: firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD
        },
        {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            customParameters: {
                prompt: 'select_account'
            }
        },
        {
            provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            customParameters: {
                display: 'popup'
            }
        },
        firebase.auth.PhoneAuthProvider.PROVIDER_ID
    ],
    // Termes de service et politique de confidentialité
    tosUrl: 'terms-of-service.html',
    privacyPolicyUrl: 'privacy-policy.html',
    // Personnalisation
    credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
    callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            console.log('✅ FirebaseUI: Connexion réussie', authResult.user.email);
            
            // Gérer la redirection personnalisée
            if (window.app && typeof window.app.handleAuthSuccess === 'function') {
                window.app.handleAuthSuccess(authResult.user);
            }
            
            // Empêcher la redirection automatique pour gérer nous-mêmes
            return false;
        },
        signInFailure: function(error) {
            console.error('❌ FirebaseUI: Erreur de connexion', error);
            
            // Gérer les erreurs spécifiques
            if (error.code !== 'firebaseui/anonymous-upgrade-merge-conflict') {
                if (window.app && typeof window.app.showNotification === 'function') {
                    window.app.showNotification(
                        'Erreur de connexion: ' + getFirebaseUIErrorMessage(error), 
                        'error'
                    );
                }
            }
            return Promise.resolve();
        },
        uiShown: function() {
            console.log('🎨 FirebaseUI: Interface affichée');
        }
    },
    // Paramètres supplémentaires
    signInFlow: 'popup', // ou 'redirect'
    siteName: 'TailorPro - Business Management',
    queryParameterForSignInSuccessUrl: 'redirect',
    immediateFederatedRedirect: false
};

// Initialiser FirebaseUI
let ui = null;

function initializeFirebaseUI() {
    if (typeof firebaseui !== 'undefined') {
        ui = new firebaseui.auth.AuthUI(auth);
        console.log('✅ FirebaseUI initialisé');
        return ui;
    } else {
        console.error('❌ FirebaseUI non chargé');
        return null;
    }
}

// Fonction utilitaire pour les messages d'erreur FirebaseUI
function getFirebaseUIErrorMessage(error) {
    const errorMap = {
        'auth/invalid-email': 'Adresse email invalide',
        'auth/user-disabled': 'Compte désactivé',
        'auth/user-not-found': 'Aucun compte trouvé avec cet email',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/email-already-in-use': 'Email déjà utilisé',
        'auth/weak-password': 'Mot de passe trop faible',
        'auth/network-request-failed': 'Erreur réseau',
        'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard',
        'auth/account-exists-with-different-credential': 'Compte existant avec des identifiants différents'
    };
    
    return errorMap[error.code] || error.message;
}

/**
 * Active l'observateur d'authentification UNIQUEMENT quand nécessaire
 */
function enableAuthObserver() {
    if (authObserverEnabled) {
        console.log('🔐 firebase.js: Observateur auth déjà activé');
        return;
    }
    
    console.log('🔐 firebase.js: Activation observateur auth...');
    authObserverEnabled = true;
    
    authObserverUnsubscribe = auth.onAuthStateChanged(async (user) => {
        console.log('🎯 firebase.js: État auth changé - User:', user ? user.email : 'null');
        
        const previousUser = currentUser;
        currentUser = user;
        
        // Émettre l'événement seulement si l'observateur est activé
        document.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: { 
                user: currentUser, 
                previousUser: previousUser,
                observerEnabled: true 
            }
        }));
        
        if (user) {
            await checkAndCreateUserProfile(user);
        }
    });
    
    return authObserverUnsubscribe;
}

/**
 * Désactive l'observateur d'authentification
 */
function disableAuthObserver() {
    if (authObserverUnsubscribe) {
        authObserverUnsubscribe();
        authObserverUnsubscribe = null;
    }
    authObserverEnabled = false;
    console.log('🔐 firebase.js: Observateur auth désactivé');
}

/**
 * Vérifie l'état d'authentification de manière synchrone (sans bloquer)
 */
function getCurrentAuthState() {
    return {
        user: currentUser,
        isLoggedIn: !!currentUser,
        authReady: !!auth,
        observerEnabled: authObserverEnabled
    };
}

/**
 * Vérifie si l'utilisateur est connecté avant d'exécuter une action protégée
 */
async function requireAuth(actionName = 'cette action') {
    const authState = getCurrentAuthState();
    
    if (!authState.user) {
        console.log(`🔐 firebase.js: Auth requise pour: ${actionName}`);
        
        // Activer l'observateur pour détecter les futures connexions
        enableAuthObserver();
        
        // Émettre un événement pour demander la connexion
        document.dispatchEvent(new CustomEvent('auth-required', {
            detail: { 
                action: actionName,
                message: `Connectez-vous pour ${actionName}`
            }
        }));
        
        throw new Error('AUTH_REQUIRED');
    }
    
    // Vérifier si l'email est vérifié (optionnel selon vos besoins)
    if (!authState.user.emailVerified) {
        console.warn(`⚠️ firebase.js: Email non vérifié pour: ${actionName}`);
        // Vous pouvez choisir de bloquer ou non les emails non vérifiés
    }
    
    return authState.user;
}

/**
 * Connexion silencieuse - essaie de récupérer l'état sans bloquer
 */
async function checkExistingSession() {
    if (!auth) {
        console.log('🔐 firebase.js: Auth non disponible pour vérification de session');
        return null;
    }
    
    try {
        // Vérifier l'état actuel sans déclencher l'observateur
        const user = auth.currentUser;
        if (user) {
            console.log('🔐 firebase.js: Session existante détectée:', user.email);
            currentUser = user;
            return user;
        }
        return null;
    } catch (error) {
        console.warn('⚠️ firebase.js: Erreur vérification session:', error);
        return null;
    }
}

// --- Fonctions de Données Firestore (adaptées) ---

async function checkAndCreateUserProfile(user) {
    if (!db || !user) return;
    
    const profileRef = db.collection('users').doc(user.uid).collection('profile').doc('data');
    try {
        const doc = await profileRef.get();
        const now = new Date().toISOString();
        
        if (!doc.exists) {
            console.log(`👤 firebase.js: Création profil pour ${user.uid}`);
            const userProfile = {
                uid: user.uid, 
                email: user.email,
                createdAt: now, 
                lastLoginAt: now,
                emailVerified: user.emailVerified
            };
            await profileRef.set(userProfile);
        } else {
            await profileRef.update({ 
                lastLoginAt: now,
                emailVerified: user.emailVerified 
            });
        }
    } catch (error) {
        console.error("❌ firebase.js: Erreur checkAndCreateUserProfile:", error);
    }
}

async function saveDataToFirestore(collectionName, data) {
    // Vérifier l'authentification pour les opérations d'écriture
    const user = await requireAuth(`sauvegarder des données dans ${collectionName}`);
    
    const docId = data.id || db.collection('_').doc().id;
    const docRef = db.collection('users').doc(user.uid).collection(collectionName).doc(docId);
    await docRef.set({ ...data, id: docId }, { merge: true });
    return { ...data, id: docId };
}

async function loadDataFromFirestore(collectionName) {
    // Vérifier l'authentification pour les opérations de lecture protégées
    const user = await requireAuth(`accéder aux données de ${collectionName}`);
    
    const snapshot = await db.collection('users').doc(user.uid).collection(collectionName).get();
    return snapshot.docs.map(doc => doc.data());
}

/**
 * Chargement de données publiques (sans auth requise)
 */
async function loadPublicData(collectionName) {
    if (!db) {
        throw new Error("Firestore non initialisé");
    }
    
    try {
        const snapshot = await db.collection(collectionName).get();
        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error(`❌ firebase.js: Erreur chargement données publiques ${collectionName}:`, error);
        throw error;
    }
}

async function deleteFromFirestore(collectionName, docId) {
    // Vérifier l'authentification pour les suppressions
    const user = await requireAuth(`supprimer des données de ${collectionName}`);
    
    await db.collection('users').doc(user.uid).collection(collectionName).doc(docId).delete();
    return true;
}

// --- Gestion de la déconnexion ---

async function signOut() {
    try {
        if (auth) {
            await auth.signOut();
            currentUser = null;
            console.log('✅ firebase.js: Déconnexion réussie');
            
            // Émettre un événement de déconnexion
            document.dispatchEvent(new CustomEvent('auth-state-changed', {
                detail: { 
                    user: null, 
                    previousUser: currentUser,
                    observerEnabled: authObserverEnabled 
                }
            }));
            
            return true;
        }
    } catch (error) {
        console.error('❌ firebase.js: Erreur déconnexion:', error);
        throw error;
    }
}

// 🏗️ COLLECTIONS PAR DÉFAUT POUR VOTRE APPLICATION

/**
 * Initialise toutes les collections nécessaires pour un nouvel utilisateur
 */
async function initializeAppCollections(user) {
    if (!db || !user) return;
    
    try {
        console.log('🏗️ firebase.js: Initialisation des collections app pour', user.uid);
        
        // 1. COLLECTION PROFIL (obligatoire)
        await initializeUserProfile(user);
        
        // 2. COLLECTION NOTES (exemple basique)
        await initializeNotesCollection(user);
        
        // 3. COLLECTION TÂCHES (exemple plus complexe)
        await initializeTasksCollection(user);
        
        // 4. COLLECTION PARAMÈTRES
        await initializeSettingsCollection(user);
        
        // 5. COLLECTION DONNÉES PUBLIQUES
        await initializePublicCollections(user);
        
        console.log('✅ firebase.js: Toutes les collections initialisées');
        
    } catch (error) {
        console.error('❌ firebase.js: Erreur initialisation collections app:', error);
    }
}

/**
 * 1. COLLECTION PROFIL - Données utilisateur de base
 */
async function initializeUserProfile(user) {
    const profileRef = db.collection('users').doc(user.uid).collection('profile').doc('data');
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
        const userProfile = {
            // Infos de base
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            
            // Métadonnées
            emailVerified: user.emailVerified,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            accountStatus: 'active',
            
            // Profil utilisateur
            profile: {
                firstName: '',
                lastName: '',
                bio: '',
                location: '',
                website: '',
                phone: ''
            },
            
            // Statistiques
            stats: {
                notesCount: 0,
                tasksCount: 0,
                loginCount: 1,
                lastActive: new Date().toISOString()
            }
        };
        
        await profileRef.set(userProfile);
        console.log('✅ Profil utilisateur créé');
    } else {
        // Mettre à jour la dernière connexion
        await profileRef.update({
            lastLoginAt: new Date().toISOString(),
            'stats.lastActive': new Date().toISOString(),
            'stats.loginCount': firebase.firestore.FieldValue.increment(1)
        });
    }
}

/**
 * 2. COLLECTION NOTES - Pour des notes simples
 */
async function initializeNotesCollection(user) {
    const notesMetadataRef = db.collection('users').doc(user.uid).collection('collections').doc('metadata');
    const metadataDoc = await notesMetadataRef.get();
    
    let collectionsList = [];
    if (metadataDoc.exists) {
        collectionsList = metadataDoc.data().list || [];
    }
    
    // Ajouter 'notes' à la liste des collections
    if (!collectionsList.includes('notes')) {
        collectionsList.push('notes');
        await notesMetadataRef.set({ 
            list: collectionsList,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }
    
    // Note de bienvenue
    const welcomeNoteRef = db.collection('users').doc(user.uid).collection('notes').doc('welcome');
    const welcomeNote = await welcomeNoteRef.get();
    
    if (!welcomeNote.exists) {
        const welcomeData = {
            id: 'welcome',
            title: 'Bienvenue dans votre espace notes ! 📝',
            content: 'Cette est votre première note. Vous pouvez la modifier ou la supprimer.',
            category: 'général',
            tags: ['bienvenue', 'première-note'],
            color: 'blue',
            isPinned: false,
            isArchived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await welcomeNoteRef.set(welcomeData);
        console.log('✅ Note de bienvenue créée');
    }
}

/**
 * 3. COLLECTION TÂCHES - Pour gérer des todos
 */
async function initializeTasksCollection(user) {
    const collectionsRef = db.collection('users').doc(user.uid).collection('collections').doc('metadata');
    const metadataDoc = await collectionsRef.get();
    
    let collectionsList = [];
    if (metadataDoc.exists) {
        collectionsList = metadataDoc.data().list || [];
    }
    
    if (!collectionsList.includes('tasks')) {
        collectionsList.push('tasks');
        await collectionsRef.set({ 
            list: collectionsList,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }
    
    // Tâche d'exemple
    const exampleTaskRef = db.collection('users').doc(user.uid).collection('tasks').doc('example-task');
    const exampleTask = await exampleTaskRef.get();
    
    if (!exampleTask.exists) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const taskData = {
            id: 'example-task',
            title: 'Ma première tâche ✅',
            description: 'Cette est une tâche d\'exemple. Cochez-la quand elle est terminée !',
            status: 'pending', // pending, completed, cancelled
            priority: 'medium', // low, medium, high, urgent
            dueDate: tomorrow.toISOString(),
            category: 'personnel',
            tags: ['exemple', 'important'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        };
        
        await exampleTaskRef.set(taskData);
        console.log('✅ Tâche d\'exemple créée');
    }
}

/**
 * 4. COLLECTION PARAMÈTRES - Préférences utilisateur
 */
async function initializeSettingsCollection(user) {
    const settingsRef = db.collection('users').doc(user.uid).collection('settings').doc('general');
    const settingsDoc = await settingsRef.get();
    
    if (!settingsDoc.exists) {
        const defaultSettings = {
            // Apparence
            theme: 'light', // light, dark, auto
            language: 'fr',
            fontSize: 'medium',
            
            // Notifications
            emailNotifications: true,
            pushNotifications: true,
            dailyReminders: false,
            
            // Confidentialité
            profileVisible: true,
            dataSharing: false,
            
            // Préférences
            autoSave: true,
            spellCheck: true,
            compactMode: false,
            
            // Métadonnées
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await settingsRef.set(defaultSettings);
        console.log('✅ Paramètres par défaut créés');
    }
}

/**
 * 5. COLLECTIONS PUBLIQUES - Données partagées
 */
async function initializePublicCollections(user) {
    // Statistiques globales de l'app
    const appStatsRef = db.collection('public').doc('app').collection('stats').doc('global');
    const appStats = await appStatsRef.get();
    
    if (!appStats.exists) {
        const globalStats = {
            totalUsers: 1,
            totalNotes: 1,
            totalTasks: 1,
            lastUpdated: new Date().toISOString(),
            appVersion: '1.0.0'
        };
        
        await appStatsRef.set(globalStats);
        console.log('✅ Statistiques globales créées');
    } else {
        // Incrémenter le compteur d'utilisateurs
        await appStatsRef.update({
            totalUsers: firebase.firestore.FieldValue.increment(1),
            lastUpdated: new Date().toISOString()
        });
    }
}

// 🎯 FONCTIONS SPÉCIFIQUES POUR CHAQUE COLLECTION

/**
 * Gestion des notes
 */
const notesManager = {
    // Créer une note
    async createNote(noteData) {
        const user = await requireAuth('créer une note');
        const noteId = db.collection('_').doc().id;
        
        const note = {
            id: noteId,
            title: noteData.title || 'Sans titre',
            content: noteData.content || '',
            category: noteData.category || 'général',
            tags: noteData.tags || [],
            color: noteData.color || 'default',
            isPinned: noteData.isPinned || false,
            isArchived: noteData.isArchived || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.uid
        };
        
        await db.collection('users').doc(user.uid).collection('notes').doc(noteId).set(note);
        
        // Mettre à jour le compteur de notes
        await this.updateNotesCount(user.uid, 1);
        
        return note;
    },
    
    // Récupérer toutes les notes
    async getNotes(options = {}) {
        const user = await requireAuth('accéder aux notes');
        let query = db.collection('users').doc(user.uid).collection('notes');
        
        // Filtres optionnels
        if (options.category) {
            query = query.where('category', '==', options.category);
        }
        if (options.archived !== undefined) {
            query = query.where('isArchived', '==', options.archived);
        }
        
        // Tri
        query = query.orderBy('updatedAt', 'desc');
        
        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data());
    },
    
    // Récupérer une note spécifique
    async getNote(noteId) {
        const user = await requireAuth('accéder à une note');
        const doc = await db.collection('users').doc(user.uid).collection('notes').doc(noteId).get();
        return doc.exists ? doc.data() : null;
    },
    
    // Mettre à jour une note
    async updateNote(noteId, updates) {
        const user = await requireAuth('modifier une note');
        
        const noteRef = db.collection('users').doc(user.uid).collection('notes').doc(noteId);
        await noteRef.update({
            ...updates,
            updatedAt: new Date().toISOString()
        });
        
        return await this.getNote(noteId);
    },
    
    // Supprimer une note
    async deleteNote(noteId) {
        const user = await requireAuth('supprimer une note');
        await db.collection('users').doc(user.uid).collection('notes').doc(noteId).delete();
        
        // Mettre à jour le compteur
        await this.updateNotesCount(user.uid, -1);
        
        return true;
    },
    
    // Mettre à jour le compteur de notes
    async updateNotesCount(userId, increment = 1) {
        const profileRef = db.collection('users').doc(userId).collection('profile').doc('data');
        await profileRef.update({
            'stats.notesCount': firebase.firestore.FieldValue.increment(increment),
            'stats.lastActive': new Date().toISOString()
        });
    }
};

/**
 * Gestion des tâches
 */
const tasksManager = {
    // Créer une tâche
    async createTask(taskData) {
        const user = await requireAuth('créer une tâche');
        const taskId = db.collection('_').doc().id;
        
        const task = {
            id: taskId,
            title: taskData.title || 'Nouvelle tâche',
            description: taskData.description || '',
            status: 'pending',
            priority: taskData.priority || 'medium',
            dueDate: taskData.dueDate || null,
            category: taskData.category || 'personnel',
            tags: taskData.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null,
            createdBy: user.uid
        };
        
        await db.collection('users').doc(user.uid).collection('tasks').doc(taskId).set(task);
        
        // Mettre à jour le compteur de tâches
        await this.updateTasksCount(user.uid, 1);
        
        return task;
    },
    
    // Récupérer une tâche spécifique
    async getTask(taskId) {
        const user = await requireAuth('accéder à une tâche');
        const doc = await db.collection('users').doc(user.uid).collection('tasks').doc(taskId).get();
        return doc.exists ? doc.data() : null;
    },
    
    // Marquer une tâche comme terminée
    async completeTask(taskId) {
        const user = await requireAuth('modifier une tâche');
        
        const taskRef = db.collection('users').doc(user.uid).collection('tasks').doc(taskId);
        await taskRef.update({
            status: 'completed',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        return await this.getTask(taskId);
    },
    
    // Récupérer les tâches
    async getTasks(filters = {}) {
        const user = await requireAuth('accéder aux tâches');
        let query = db.collection('users').doc(user.uid).collection('tasks');
        
        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }
        if (filters.priority) {
            query = query.where('priority', '==', filters.priority);
        }
        
        query = query.orderBy('createdAt', 'desc');
        
        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data());
    },
    
    // Mettre à jour une tâche
    async updateTask(taskId, updates) {
        const user = await requireAuth('modifier une tâche');
        
        const taskRef = db.collection('users').doc(user.uid).collection('tasks').doc(taskId);
        await taskRef.update({
            ...updates,
            updatedAt: new Date().toISOString()
        });
        
        return await this.getTask(taskId);
    },
    
    // Mettre à jour le compteur de tâches
    async updateTasksCount(userId, increment = 1) {
        const profileRef = db.collection('users').doc(userId).collection('profile').doc('data');
        await profileRef.update({
            'stats.tasksCount': firebase.firestore.FieldValue.increment(increment),
            'stats.lastActive': new Date().toISOString()
        });
    }
};

// 🎨 COLLECTIONS MÉTIER - GESTION CRÉATIONS & COMMANDES

/**
 * Initialise les collections métier pour un nouvel utilisateur
 */
async function initializeBusinessCollections(user) {
    if (!db || !user) return;
    
    try {
        console.log('🏗️ firebase.js: Initialisation collections métier pour', user.uid);
        
        // 1. COLLECTION CRÉATIONS
        await initializeCreationsCollection(user);
        
        // 2. COLLECTION CLIENTS
        await initializeClientsCollection(user);
        
        // 3. COLLECTION COMMANDES
        await initializeOrdersCollection(user);
        
        // 4. COLLECTION STATISTIQUES
        await initializeStatsCollection(user);
        
        console.log('✅ firebase.js: Collections métier initialisées');
        
    } catch (error) {
        console.error('❌ firebase.js: Erreur initialisation collections métier:', error);
    }
}

/**
 * 1. COLLECTION CRÉATIONS - Modèles de produits
 */
async function initializeCreationsCollection(user) {
    const collectionsRef = db.collection('users').doc(user.uid).collection('collections').doc('metadata');
    const metadataDoc = await collectionsRef.get();
    
    let collectionsList = [];
    if (metadataDoc.exists) {
        collectionsList = metadataDoc.data().list || [];
    }
    
    if (!collectionsList.includes('creations')) {
        collectionsList.push('creations');
        await collectionsRef.set({ 
            list: collectionsList,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }
    
    // Création d'exemple
    const exampleCreationRef = db.collection('users').doc(user.uid).collection('creations').doc('example-creation');
    const exampleCreation = await exampleCreationRef.get();
    
    if (!exampleCreation.exists) {
        const creationData = {
            id: 'example-creation',
            name: 'Robe de soirée personnalisée',
            description: 'Robe élégante pour occasions spéciales',
            category: 'vêtements',
            baseCost: 150.00,
            materialsCost: 75.00,
            laborCost: 75.00,
            totalCost: 150.00,
            imageUrl: '', // URL de l'image stockée
            tags: ['soirée', 'personnalisé', 'luxe'],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.uid
        };
        
        await exampleCreationRef.set(creationData);
        console.log('✅ Création d\'exemple ajoutée');
    }
}

/**
 * 2. COLLECTION CLIENTS
 */
async function initializeClientsCollection(user) {
    const collectionsRef = db.collection('users').doc(user.uid).collection('collections').doc('metadata');
    const metadataDoc = await collectionsRef.get();
    
    let collectionsList = [];
    if (metadataDoc.exists) {
        collectionsList = metadataDoc.data().list || [];
    }
    
    if (!collectionsList.includes('clients')) {
        collectionsList.push('clients');
        await collectionsRef.set({ 
            list: collectionsList,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }
    
    // Client d'exemple
    const exampleClientRef = db.collection('users').doc(user.uid).collection('clients').doc('example-client');
    const exampleClient = await exampleClientRef.get();
    
    if (!exampleClient.exists) {
        const clientData = {
            id: 'example-client',
            firstName: 'Marie',
            lastName: 'Dupont',
            fullName: 'Marie Dupont',
            phone: '+33 1 23 45 67 89',
            email: 'marie.dupont@email.com',
            address: {
                street: '123 Avenue des Champs',
                city: 'Paris',
                zipCode: '75008',
                country: 'France'
            },
            notes: 'Client fidèle, aime les créations personnalisées',
            customerSince: new Date().toISOString(),
            totalOrders: 0,
            totalSpent: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.uid
        };
        
        await exampleClientRef.set(clientData);
        console.log('✅ Client d\'exemple ajouté');
    }
}

/**
 * 3. COLLECTION COMMANDES
 */
async function initializeOrdersCollection(user) {
    const collectionsRef = db.collection('users').doc(user.uid).collection('collections').doc('metadata');
    const metadataDoc = await collectionsRef.get();
    
    let collectionsList = [];
    if (metadataDoc.exists) {
        collectionsList = metadataDoc.data().list || [];
    }
    
    if (!collectionsList.includes('orders')) {
        collectionsList.push('orders');
        await collectionsRef.set({ 
            list: collectionsList,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }
}

/**
 * 4. COLLECTION STATISTIQUES
 */
async function initializeStatsCollection(user) {
    const statsRef = db.collection('users').doc(user.uid).collection('stats').doc('business');
    const statsDoc = await statsRef.get();
    
    if (!statsDoc.exists) {
        const statsData = {
            // Statistiques globales
            totalRevenue: 0,
            totalOrders: 0,
            totalClients: 0,
            averageOrderValue: 0,
            
            // Statistiques périodiques (seront mises à jour dynamiquement)
            monthlyRevenue: {},
            weeklyRevenue: {},
            dailyRevenue: {},
            
            // Métriques de performance
            conversionRate: 0,
            customerRetention: 0,
            
            // Dernière mise à jour
            lastUpdated: new Date().toISOString(),
            period: 'all-time' // all-time, monthly, weekly, daily
        };
        
        await statsRef.set(statsData);
        console.log('✅ Statistiques business initialisées');
    }
}

// 🎯 MANAGERS SPÉCIFIQUES MÉTIER

/**
 * Gestion des Créations
 */
const creationsManager = {
    // Créer une nouvelle création
    async createCreation(creationData) {
        const user = await requireAuth('créer une création');
        const creationId = db.collection('_').doc().id;
        
        const creation = {
            id: creationId,
            name: creationData.name,
            description: creationData.description || '',
            category: creationData.category || 'général',
            baseCost: parseFloat(creationData.baseCost) || 0,
            materialsCost: parseFloat(creationData.materialsCost) || 0,
            laborCost: parseFloat(creationData.laborCost) || 0,
            totalCost: (parseFloat(creationData.baseCost) || 0) + 
                      (parseFloat(creationData.materialsCost) || 0) + 
                      (parseFloat(creationData.laborCost) || 0),
            imageUrl: creationData.imageUrl || '',
            tags: creationData.tags || [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.uid
        };
        
        await db.collection('users').doc(user.uid).collection('creations').doc(creationId).set(creation);
        
        // Mettre à jour les statistiques
        await this.updateCreationsStats(user.uid, 1);
        
        return creation;
    },
    
    // Récupérer une création spécifique
    async getCreation(creationId) {
        const user = await requireAuth('accéder à une création');
        const doc = await db.collection('users').doc(user.uid).collection('creations').doc(creationId).get();
        return doc.exists ? doc.data() : null;
    },
    
    // Récupérer toutes les créations
    async getCreations(filters = {}) {
        const user = await requireAuth('accéder aux créations');
        let query = db.collection('users').doc(user.uid).collection('creations');
        
        if (filters.category) {
            query = query.where('category', '==', filters.category);
        }
        if (filters.isActive !== undefined) {
            query = query.where('isActive', '==', filters.isActive);
        }
        
        query = query.orderBy('createdAt', 'desc');
        
        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data());
    },
    
    // Mettre à jour une création
    async updateCreation(creationId, updates) {
        const user = await requireAuth('modifier une création');
        
        // Recalculer le coût total si les coûts changent
        if (updates.baseCost || updates.materialsCost || updates.laborCost) {
            const creationRef = db.collection('users').doc(user.uid).collection('creations').doc(creationId);
            const creationDoc = await creationRef.get();
            const existingData = creationDoc.data();
            
            updates.totalCost = (updates.baseCost || existingData.baseCost) + 
                              (updates.materialsCost || existingData.materialsCost) + 
                              (updates.laborCost || existingData.laborCost);
        }
        
        const creationRef = db.collection('users').doc(user.uid).collection('creations').doc(creationId);
        await creationRef.update({
            ...updates,
            updatedAt: new Date().toISOString()
        });
        
        return await this.getCreation(creationId);
    },
    
    // Mettre à jour les statistiques des créations
    async updateCreationsStats(userId, increment = 1) {
        const profileRef = db.collection('users').doc(userId).collection('profile').doc('data');
        await profileRef.update({
            'stats.creationsCount': firebase.firestore.FieldValue.increment(increment),
            'stats.lastActive': new Date().toISOString()
        });
    }
};

/**
 * Gestion des Clients
 */
const clientsManager = {
    // Créer un nouveau client
    async createClient(clientData) {
        const user = await requireAuth('créer un client');
        const clientId = db.collection('_').doc().id;
        
        const client = {
            id: clientId,
            firstName: clientData.firstName,
            lastName: clientData.lastName,
            fullName: `${clientData.firstName} ${clientData.lastName}`,
            phone: clientData.phone || '',
            email: clientData.email || '',
            address: clientData.address || {},
            notes: clientData.notes || '',
            customerSince: new Date().toISOString(),
            totalOrders: 0,
            totalSpent: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.uid
        };
        
        await db.collection('users').doc(user.uid).collection('clients').doc(clientId).set(client);
        
        // Mettre à jour les statistiques
        await this.updateClientsStats(user.uid, 1);
        
        return client;
    },
    
    // Récupérer un client spécifique
    async getClient(clientId) {
        const user = await requireAuth('accéder à un client');
        const doc = await db.collection('users').doc(user.uid).collection('clients').doc(clientId).get();
        return doc.exists ? doc.data() : null;
    },
    
    // Récupérer tous les clients
    async getClients(filters = {}) {
        const user = await requireAuth('accéder aux clients');
        let query = db.collection('users').doc(user.uid).collection('clients');
        
        if (filters.isActive !== undefined) {
            query = query.where('isActive', '==', filters.isActive);
        }
        
        query = query.orderBy('createdAt', 'desc');
        
        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data());
    },
    
    // Mettre à jour les statistiques d'un client après une commande
    async updateClientStats(clientId, orderAmount) {
        const user = await requireAuth('mettre à jour les stats client');
        const clientRef = db.collection('users').doc(user.uid).collection('clients').doc(clientId);
        
        await clientRef.update({
            totalOrders: firebase.firestore.FieldValue.increment(1),
            totalSpent: firebase.firestore.FieldValue.increment(orderAmount),
            updatedAt: new Date().toISOString()
        });
    },
    
    // Mettre à jour les statistiques globales des clients
    async updateClientsStats(userId, increment = 1) {
        const profileRef = db.collection('users').doc(userId).collection('profile').doc('data');
        await profileRef.update({
            'stats.clientsCount': firebase.firestore.FieldValue.increment(increment),
            'stats.lastActive': new Date().toISOString()
        });
    }
};

/**
 * Gestion des Commandes
 */
const ordersManager = {
    // Créer une nouvelle commande
    async createOrder(orderData) {
        const user = await requireAuth('créer une commande');
        const orderId = db.collection('_').doc().id;
        
        // Récupérer les données de la création et du client
        const creation = await this.getCreation(orderData.creationId);
        const client = await this.getClient(orderData.clientId);
        
        const totalAmount = creation.totalCost;
        const amountPaid = parseFloat(orderData.amountPaid) || 0;
        const remainingAmount = totalAmount - amountPaid;
        
        const order = {
            id: orderId,
            creationId: orderData.creationId,
            creationName: creation.name,
            creationCost: creation.totalCost,
            clientId: orderData.clientId,
            clientName: client.fullName,
            clientPhone: client.phone,
            clientEmail: client.email,
            clientMeasurements: orderData.clientMeasurements || {},
            totalAmount: totalAmount,
            amountPaid: amountPaid,
            remainingAmount: remainingAmount,
            dueDate: orderData.dueDate || null,
            status: remainingAmount === 0 ? 'paid' : 'pending', // paid, pending, cancelled, completed
            priority: orderData.priority || 'medium', // low, medium, high, urgent
            notes: orderData.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.uid
        };
        
        await db.collection('users').doc(user.uid).collection('orders').doc(orderId).set(order);
        
        // Mettre à jour les statistiques du client
        await clientsManager.updateClientStats(orderData.clientId, totalAmount);
        
        // Mettre à jour les statistiques globales
        await this.updateOrdersStats(user.uid, totalAmount, 1);
        
        return order;
    },
    
    // Récupérer une commande spécifique
    async getOrder(orderId) {
        const user = await requireAuth('accéder à une commande');
        const doc = await db.collection('users').doc(user.uid).collection('orders').doc(orderId).get();
        return doc.exists ? doc.data() : null;
    },
    
    // Récupérer toutes les commandes
    async getOrders(filters = {}) {
        const user = await requireAuth('accéder aux commandes');
        let query = db.collection('users').doc(user.uid).collection('orders');
        
        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }
        if (filters.priority) {
            query = query.where('priority', '==', filters.priority);
        }
        
        query = query.orderBy('createdAt', 'desc');
        
        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data());
    },
    
    // Ajouter un paiement à une commande
    async addPayment(orderId, paymentData) {
        const user = await requireAuth('ajouter un paiement');
        const orderRef = db.collection('users').doc(user.uid).collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        const order = orderDoc.data();
        
        const newAmountPaid = order.amountPaid + parseFloat(paymentData.amount);
        const newRemainingAmount = order.totalAmount - newAmountPaid;
        const newStatus = newRemainingAmount === 0 ? 'paid' : 'pending';
        
        // Enregistrer le paiement dans une sous-collection
        const paymentId = db.collection('_').doc().id;
        const paymentRef = db.collection('users').doc(user.uid).collection('orders').doc(orderId).collection('payments').doc(paymentId);
        
        const payment = {
            id: paymentId,
            amount: parseFloat(paymentData.amount),
            paymentMethod: paymentData.paymentMethod || 'cash',
            paymentDate: new Date().toISOString(),
            notes: paymentData.notes || '',
            createdAt: new Date().toISOString()
        };
        
        await paymentRef.set(payment);
        
        // Mettre à jour la commande
        await orderRef.update({
            amountPaid: newAmountPaid,
            remainingAmount: newRemainingAmount,
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
        
        // Mettre à jour les statistiques de revenus
        await this.updateRevenueStats(user.uid, parseFloat(paymentData.amount));
        
        return { order: await this.getOrder(orderId), payment };
    },
    
    // Récupérer les paiements d'une commande
    async getOrderPayments(orderId) {
        const user = await requireAuth('accéder aux paiements');
        const snapshot = await db.collection('users').doc(user.uid).collection('orders').doc(orderId).collection('payments')
            .orderBy('paymentDate', 'desc')
            .get();
        
        return snapshot.docs.map(doc => doc.data());
    },
    
    // Mettre à jour les statistiques des commandes
    async updateOrdersStats(userId, revenue = 0, orderCount = 1) {
        const profileRef = db.collection('users').doc(userId).collection('profile').doc('data');
        await profileRef.update({
            'stats.ordersCount': firebase.firestore.FieldValue.increment(orderCount),
            'stats.totalRevenue': firebase.firestore.FieldValue.increment(revenue),
            'stats.lastActive': new Date().toISOString()
        });
        
        // Mettre à jour les statistiques business détaillées
        await this.updateBusinessStats(userId, revenue, orderCount);
    },
    
    // Mettre à jour les statistiques de revenus
    async updateRevenueStats(userId, amount) {
        const statsRef = db.collection('users').doc(userId).collection('stats').doc('business');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        await statsRef.update({
            totalRevenue: firebase.firestore.FieldValue.increment(amount),
            [`dailyRevenue.${today}`]: firebase.firestore.FieldValue.increment(amount),
            lastUpdated: new Date().toISOString()
        });
    },
    
    // Mettre à jour les statistiques business détaillées
    async updateBusinessStats(userId, revenue, orderCount) {
        const statsRef = db.collection('users').doc(userId).collection('stats').doc('business');
        const statsDoc = await statsRef.get();
        const stats = statsDoc.data();
        
        const newTotalOrders = (stats.totalOrders || 0) + orderCount;
        const newTotalRevenue = (stats.totalRevenue || 0) + revenue;
        const newAverageOrderValue = newTotalOrders > 0 ? newTotalRevenue / newTotalOrders : 0;
        
        await statsRef.update({
            totalOrders: newTotalOrders,
            totalRevenue: newTotalRevenue,
            averageOrderValue: newAverageOrderValue,
            lastUpdated: new Date().toISOString()
        });
    }
};

// 🔍 FONCTIONS UTILITAIRES POUR LES STATISTIQUES

/**
 * Récupère les statistiques business
 */
async function getBusinessStats(period = 'all-time') {
    const user = await requireAuth('accéder aux statistiques');
    const statsRef = db.collection('users').doc(user.uid).collection('stats').doc('business');
    const statsDoc = await statsRef.get();
    
    if (!statsDoc.exists) {
        return null;
    }
    
    const stats = statsDoc.data();
    
    // Calculer les statistiques en temps réel
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Récupérer les commandes récentes pour calculs supplémentaires
    const recentOrders = await ordersManager.getOrders();
    const recentClients = await clientsManager.getClients();
    
    const weeklyOrders = recentOrders.filter(order => 
        new Date(order.createdAt) >= oneWeekAgo
    );
    
    const monthlyOrders = recentOrders.filter(order => 
        new Date(order.createdAt) >= oneMonthAgo
    );
    
    const newClientsThisMonth = recentClients.filter(client => 
        new Date(client.createdAt) >= oneMonthAgo
    );
    
    return {
        ...stats,
        realTimeStats: {
            weeklyRevenue: weeklyOrders.reduce((sum, order) => sum + order.totalAmount, 0),
            monthlyRevenue: monthlyOrders.reduce((sum, order) => sum + order.totalAmount, 0),
            newOrdersThisWeek: weeklyOrders.length,
            newOrdersThisMonth: monthlyOrders.length,
            newClientsThisMonth: newClientsThisMonth.length,
            pendingOrders: recentOrders.filter(order => order.status === 'pending').length,
            totalActiveClients: recentClients.filter(client => client.isActive).length
        }
    };
}

/**
 * Génère un rapport financier
 */
async function generateFinancialReport(startDate, endDate) {
    const user = await requireAuth('générer un rapport');
    const orders = await ordersManager.getOrders();
    
    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });
    
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalPaid = filteredOrders.reduce((sum, order) => sum + order.amountPaid, 0);
    const totalPending = filteredOrders.reduce((sum, order) => sum + order.remainingAmount, 0);
    
    const ordersByStatus = filteredOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {});
    
    return {
        period: { startDate, endDate },
        summary: {
            totalOrders: filteredOrders.length,
            totalRevenue,
            totalPaid,
            totalPending,
            averageOrderValue: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0
        },
        ordersByStatus,
        orders: filteredOrders
    };
}

// Service principal
const firebaseServices = {
    // Initialisation
    initialize: initializeFirebase,
    
    // FirebaseUI
    initializeUI: function(containerId = '#firebaseui-auth-container') {
        if (!ui) {
            initializeFirebaseUI();
        }
        
        if (ui) {
            try {
                ui.start(containerId, uiConfig);
                console.log('✅ FirebaseUI démarré dans:', containerId);
                return true;
            } catch (error) {
                console.error('❌ Erreur démarrage FirebaseUI:', error);
                return false;
            }
        }
        return false;
    },
    
    resetUI: function() {
        if (ui) {
            ui.reset();
            console.log('✅ FirebaseUI réinitialisé');
        }
    },
    
    // Nouvelles fonctions de collections
    initializeAppCollections: initializeAppCollections,
    // Collections métier
    initializeBusinessCollections: initializeBusinessCollections,
    
    // Managers spécifiques
    notes: notesManager,
    tasks: tasksManager,
    // Managers métier
    creations: creationsManager,
    clients: clientsManager,
    orders: ordersManager,
    
    // Statistiques et rapports
    getBusinessStats: getBusinessStats,
    generateFinancialReport: generateFinancialReport,
    
    // Gestion d'authentification à la demande
    enableAuthObserver: enableAuthObserver,
    disableAuthObserver: disableAuthObserver,
    getCurrentAuthState: getCurrentAuthState,
    requireAuth: requireAuth,
    checkExistingSession: checkExistingSession,
    signOut: signOut,
    
    // Données utilisateur
    getCurrentUser: () => currentUser,
    
    // Opérations de données (avec vérification d'auth)
    saveData: saveDataToFirestore,
    loadData: loadDataFromFirestore,
    loadPublicData: loadPublicData, // NOUVEAU: données sans auth
    deleteData: deleteFromFirestore,
    
    // Accès direct aux services Firebase (pour usage avancé)
    getAuth: () => auth,
    getFirestore: () => db,
    
    // Fonctions utilitaires
    getCurrentUserProfile: async () => {
        const user = await requireAuth('accéder au profil');
        const profileRef = db.collection('users').doc(user.uid).collection('profile').doc('data');
        const doc = await profileRef.get();
        return doc.exists ? doc.data() : null;
    },
    
    updateUserProfile: async (updates) => {
        const user = await requireAuth('modifier le profil');
        const profileRef = db.collection('users').doc(user.uid).collection('profile').doc('data');
        await profileRef.update({
            ...updates,
            updatedAt: new Date().toISOString()
        });
        return await this.getCurrentUserProfile();
    },
    
    getUserSettings: async () => {
        const user = await requireAuth('accéder aux paramètres');
        const settingsRef = db.collection('users').doc(user.uid).collection('settings').doc('general');
        const doc = await settingsRef.get();
        return doc.exists ? doc.data() : null;
    },
    
    updateUserSettings: async (updates) => {
        const user = await requireAuth('modifier les paramètres');
        const settingsRef = db.collection('users').doc(user.uid).collection('settings').doc('general');
        await settingsRef.update({
            ...updates,
            updatedAt: new Date().toISOString()
        });
        return await this.getUserSettings();
    },
    
    getCreation: async (creationId) => {
        const user = await requireAuth('accéder à une création');
        const doc = await db.collection('users').doc(user.uid).collection('creations').doc(creationId).get();
        return doc.exists ? doc.data() : null;
    },
    
    getClient: async (clientId) => {
        const user = await requireAuth('accéder à un client');
        const doc = await db.collection('users').doc(user.uid).collection('clients').doc(clientId).get();
        return doc.exists ? doc.data() : null;
    },
    
    getOrder: async (orderId) => {
        const user = await requireAuth('accéder à une commande');
        const doc = await db.collection('users').doc(user.uid).collection('orders').doc(orderId).get();
        return doc.exists ? doc.data() : null;
    }
};
// 🎯 CORRECTION DE L'EXPOSITION DES SERVICES
window.firebaseServices = {
    // Initialisation
    initialize: initializeFirebase,
    
    // FirebaseUI
    initializeUI: function(containerId = '#firebaseui-auth-container') {
        if (!ui) {
            initializeFirebaseUI();
        }
        
        if (ui) {
            try {
                ui.start(containerId, uiConfig);
                console.log('✅ FirebaseUI démarré dans:', containerId);
                return true;
            } catch (error) {
                console.error('❌ Erreur démarrage FirebaseUI:', error);
                return false;
            }
        }
        return false;
    },
    
    resetUI: function() {
        if (ui) {
            ui.reset();
            console.log('✅ FirebaseUI réinitialisé');
        }
    },
    
    // Collections et managers
    initializeAppCollections: initializeAppCollections,
    initializeBusinessCollections: initializeBusinessCollections,
    
    // MANAGERS MÉTIER (EXPOSITION CORRIGÉE)
   // measurements: MeasurementsManager,
    creations: creationsManager,
    clients: clientsManager,
    orders: ordersManager,
    
    // Nouveaux managers (à créer)
   // billing: billingManager, // Sera défini dans billing.js
    
    // Fonctions utilitaires d'accès direct
    getCreation: creationsManager.getCreation.bind(creationsManager),
    getClient: clientsManager.getClient.bind(clientsManager),
    getOrder: ordersManager.getOrder.bind(ordersManager),
    
    // Statistiques et rapports
    getBusinessStats: getBusinessStats,
    generateFinancialReport: generateFinancialReport,
    
    // Gestion d'authentification
    enableAuthObserver: enableAuthObserver,
    disableAuthObserver: disableAuthObserver,
    getCurrentAuthState: getCurrentAuthState,
    requireAuth: requireAuth,
    checkExistingSession: checkExistingSession,
    signOut: signOut,
    
    // Accès direct aux services Firebase
    getAuth: () => auth,
    getFirestore: () => db,
    getStorage: () => firebase.storage(), // À ajouter si nécessaire
    
    // Fonctions utilitaires
    getCurrentUser: () => currentUser,
    getCurrentUserProfile: async () => {
        const user = await requireAuth('accéder au profil');
        const profileRef = db.collection('users').doc(user.uid).collection('profile').doc('data');
        const doc = await profileRef.get();
        return doc.exists ? doc.data() : null;
    }
};

console.log('✅ firebase.js: Services Firebase avec UI prêts');