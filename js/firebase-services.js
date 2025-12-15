// js/firebase-services.js - SERVICES MÉTIER COMPLETS POUR FIREBASE
console.log('🔥 firebase-services.js: Chargement des services métier Firebase');

class FirebaseBusinessServices {
    constructor() {
        this.initialized = false;
        this.services = {};
        console.log('✅ FirebaseBusinessServices instancié');
    }

    /**
     * Initialise tous les services métier
     */
    async initialize() {
        if (this.initialized) {
            console.log('✅ firebase-services.js: Déjà initialisé');
            return;
        }

        try {
            console.log('🏗️ firebase-services.js: Initialisation des services métier...');

            // Vérifier que Firebase est disponible
            if (!window.firebaseServices) {
                throw new Error('Firebase services non disponibles');
            }

            // Initialiser tous les managers
            this.services = {
                creations: new CreationsManager(),
                clients: new ClientsManager(),
                orders: new OrdersManager(),
                measurements: new MeasurementsManager(),
                billing: new BillingManager()
            };

            this.initialized = true;
            console.log('✅ firebase-services.js: Tous les services métier initialisés');

            // Émettre un événement de ready
            document.dispatchEvent(new CustomEvent('firebase-business-services-ready'));

        } catch (error) {
            console.error('❌ firebase-services.js: Erreur initialisation services:', error);
            throw error;
        }
    }

    /**
     * Récupère un service métier spécifique
     */
    getService(serviceName) {
        if (!this.initialized) {
            throw new Error('Services métier non initialisés');
        }
        return this.services[serviceName];
    }

    /**
     * Vérifie si un service est disponible
     */
    isServiceAvailable(serviceName) {
        return this.initialized && this.services[serviceName];
    }

    /**
     * Récupère tous les services
     */
    getAllServices() {
        return this.services;
    }
}

// ==================== MANAGERS MÉTIER ====================

/**
 * Gestion des Créations
 */
class CreationsManager {
    constructor() {
        console.log('🎨 CreationsManager initialisé');
    }

    async createCreation(creationData) {
        try {
            const user = await window.firebaseServices.requireAuth('créer une création');
            const db = window.firebaseServices.getFirestore();
            const creationId = db.collection('_').doc().id;
            
            const totalCost = (parseFloat(creationData.baseCost) || 0) + 
                            (parseFloat(creationData.materialsCost) || 0) + 
                            (parseFloat(creationData.laborCost) || 0);
            
            const creation = {
                id: creationId,
                name: creationData.name,
                description: creationData.description || '',
                category: creationData.category || 'général',
                baseCost: parseFloat(creationData.baseCost) || 0,
                materialsCost: parseFloat(creationData.materialsCost) || 0,
                laborCost: parseFloat(creationData.laborCost) || 0,
                totalCost: totalCost,
                imageUrl: creationData.imageUrl || '',
                tags: creationData.tags || [],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.uid
            };
            
            await db.collection('users').doc(user.uid)
                .collection('creations').doc(creationId)
                .set(creation);
            
            console.log('✅ Création ajoutée:', creationId);
            return creation;
            
        } catch (error) {
            console.error('❌ Erreur création:', error);
            throw error;
        }
    }

    async getCreation(creationId) {
        try {
            const user = await window.firebaseServices.requireAuth('accéder à une création');
            const db = window.firebaseServices.getFirestore();
            
            const doc = await db.collection('users').doc(user.uid)
                .collection('creations').doc(creationId)
                .get();
                
            return doc.exists ? doc.data() : null;
            
        } catch (error) {
            console.error('❌ Erreur récupération création:', error);
            throw error;
        }
    }

    async getCreations(filters = {}) {
        try {
            const user = await window.firebaseServices.requireAuth('accéder aux créations');
            const db = window.firebaseServices.getFirestore();
            
            let query = db.collection('users').doc(user.uid)
                .collection('creations');
            
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            if (filters.isActive !== undefined) {
                query = query.where('isActive', '==', filters.isActive);
            }
            
            query = query.orderBy('createdAt', 'desc');
            
            const snapshot = await query.get();
            const creations = snapshot.docs.map(doc => doc.data());
            
            console.log(`✅ ${creations.length} créations récupérées`);
            return creations;
            
        } catch (error) {
            console.error('❌ Erreur récupération créations:', error);
            return [];
        }
    }

    async updateCreation(creationId, updates) {
        try {
            const user = await window.firebaseServices.requireAuth('modifier une création');
            const db = window.firebaseServices.getFirestore();
            
            // Recalculer le coût total si nécessaire
            if (updates.baseCost || updates.materialsCost || updates.laborCost) {
                const existing = await this.getCreation(creationId);
                updates.totalCost = (updates.baseCost || existing.baseCost) + 
                                  (updates.materialsCost || existing.materialsCost) + 
                                  (updates.laborCost || existing.laborCost);
            }
            
            await db.collection('users').doc(user.uid)
                .collection('creations').doc(creationId)
                .update({
                    ...updates,
                    updatedAt: new Date().toISOString()
                });
            
            console.log('✅ Création mise à jour:', creationId);
            return await this.getCreation(creationId);
            
        } catch (error) {
            console.error('❌ Erreur mise à jour création:', error);
            throw error;
        }
    }

    async deleteCreation(creationId) {
        try {
            const user = await window.firebaseServices.requireAuth('supprimer une création');
            const db = window.firebaseServices.getFirestore();
            
            await db.collection('users').doc(user.uid)
                .collection('creations').doc(creationId)
                .delete();
            
            console.log('✅ Création supprimée:', creationId);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur suppression création:', error);
            throw error;
        }
    }
}

/**
 * Gestion des Clients
 */
class ClientsManager {
    constructor() {
        console.log('👥 ClientsManager initialisé');
    }

    async createClient(clientData) {
        try {
            const user = await window.firebaseServices.requireAuth('créer un client');
            const db = window.firebaseServices.getFirestore();
            const clientId = db.collection('_').doc().id;
            
            const client = {
                id: clientId,
                firstName: clientData.firstName,
                lastName: clientData.lastName,
                fullName: `${clientData.firstName} ${clientData.lastName}`.trim(),
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
            
            await db.collection('users').doc(user.uid)
                .collection('clients').doc(clientId)
                .set(client);
            
            console.log('✅ Client ajouté:', clientId);
            return client;
            
        } catch (error) {
            console.error('❌ Erreur création client:', error);
            throw error;
        }
    }

    async getClient(clientId) {
        try {
            const user = await window.firebaseServices.requireAuth('accéder à un client');
            const db = window.firebaseServices.getFirestore();
            
            const doc = await db.collection('users').doc(user.uid)
                .collection('clients').doc(clientId)
                .get();
                
            return doc.exists ? doc.data() : null;
            
        } catch (error) {
            console.error('❌ Erreur récupération client:', error);
            throw error;
        }
    }

    async getClients(filters = {}) {
        try {
            const user = await window.firebaseServices.requireAuth('accéder aux clients');
            const db = window.firebaseServices.getFirestore();
            
            let query = db.collection('users').doc(user.uid)
                .collection('clients');
            
            if (filters.isActive !== undefined) {
                query = query.where('isActive', '==', filters.isActive);
            }
            
            query = query.orderBy('createdAt', 'desc');
            
            const snapshot = await query.get();
            const clients = snapshot.docs.map(doc => doc.data());
            
            console.log(`✅ ${clients.length} clients récupérés`);
            return clients;
            
        } catch (error) {
            console.error('❌ Erreur récupération clients:', error);
            return [];
        }
    }

    async updateClient(clientId, updates) {
        try {
            const user = await window.firebaseServices.requireAuth('modifier un client');
            const db = window.firebaseServices.getFirestore();
            
            // Mettre à jour le nom complet si le prénom ou nom change
            if (updates.firstName || updates.lastName) {
                const existing = await this.getClient(clientId);
                updates.fullName = `${updates.firstName || existing.firstName} ${updates.lastName || existing.lastName}`.trim();
            }
            
            await db.collection('users').doc(user.uid)
                .collection('clients').doc(clientId)
                .update({
                    ...updates,
                    updatedAt: new Date().toISOString()
                });
            
            console.log('✅ Client mis à jour:', clientId);
            return await this.getClient(clientId);
            
        } catch (error) {
            console.error('❌ Erreur mise à jour client:', error);
            throw error;
        }
    }

    async deleteClient(clientId) {
        try {
            const user = await window.firebaseServices.requireAuth('supprimer un client');
            const db = window.firebaseServices.getFirestore();
            
            await db.collection('users').doc(user.uid)
                .collection('clients').doc(clientId)
                .delete();
            
            console.log('✅ Client supprimé:', clientId);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur suppression client:', error);
            throw error;
        }
    }

    async updateClientStats(clientId, orderAmount) {
        try {
            const user = await window.firebaseServices.requireAuth('mettre à jour les stats client');
            const db = window.firebaseServices.getFirestore();
            
            await db.collection('users').doc(user.uid)
                .collection('clients').doc(clientId)
                .update({
                    totalOrders: firebase.firestore.FieldValue.increment(1),
                    totalSpent: firebase.firestore.FieldValue.increment(orderAmount),
                    updatedAt: new Date().toISOString()
                });
            
            console.log('✅ Stats client mises à jour:', clientId);
            
        } catch (error) {
            console.error('❌ Erreur mise à jour stats client:', error);
            throw error;
        }
    }
}

/**
 * Gestion des Commandes
 */
class OrdersManager {
    constructor() {
        console.log('📦 OrdersManager initialisé');
    }

    async createOrder(orderData) {
        try {
            const user = await window.firebaseServices.requireAuth('créer une commande');
            const db = window.firebaseServices.getFirestore();
            const orderId = db.collection('_').doc().id;
            
            // Récupérer la création et le client
            const creation = await window.firebaseBusinessServices.getService('creations').getCreation(orderData.creationId);
            const client = await window.firebaseBusinessServices.getService('clients').getClient(orderData.clientId);
            
            if (!creation) throw new Error('Création non trouvée');
            if (!client) throw new Error('Client non trouvé');
            
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
                status: remainingAmount === 0 ? 'paid' : 'pending',
                priority: orderData.priority || 'medium',
                notes: orderData.notes || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.uid
            };
            
            await db.collection('users').doc(user.uid)
                .collection('orders').doc(orderId)
                .set(order);
            
            // Mettre à jour les stats du client
            await window.firebaseBusinessServices.getService('clients').updateClientStats(client.id, totalAmount);
            
            console.log('✅ Commande créée:', orderId);
            return order;
            
        } catch (error) {
            console.error('❌ Erreur création commande:', error);
            throw error;
        }
    }

    async getOrder(orderId) {
        try {
            const user = await window.firebaseServices.requireAuth('accéder à une commande');
            const db = window.firebaseServices.getFirestore();
            
            const doc = await db.collection('users').doc(user.uid)
                .collection('orders').doc(orderId)
                .get();
                
            return doc.exists ? doc.data() : null;
            
        } catch (error) {
            console.error('❌ Erreur récupération commande:', error);
            throw error;
        }
    }

    async getOrders(filters = {}) {
        try {
            const user = await window.firebaseServices.requireAuth('accéder aux commandes');
            const db = window.firebaseServices.getFirestore();
            
            let query = db.collection('users').doc(user.uid)
                .collection('orders');
            
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters.priority) {
                query = query.where('priority', '==', filters.priority);
            }
            
            query = query.orderBy('createdAt', 'desc');
            
            const snapshot = await query.get();
            const orders = snapshot.docs.map(doc => doc.data());
            
            console.log(`✅ ${orders.length} commandes récupérées`);
            return orders;
            
        } catch (error) {
            console.error('❌ Erreur récupération commandes:', error);
            return [];
        }
    }

    async addPayment(orderId, paymentData) {
        try {
            const user = await window.firebaseServices.requireAuth('ajouter un paiement');
            const db = window.firebaseServices.getFirestore();
            
            const order = await this.getOrder(orderId);
            if (!order) throw new Error('Commande non trouvée');
            
            const newAmountPaid = order.amountPaid + parseFloat(paymentData.amount);
            const newRemainingAmount = order.totalAmount - newAmountPaid;
            const newStatus = newRemainingAmount === 0 ? 'paid' : 'pending';
            
            // Enregistrer le paiement
            const paymentId = db.collection('_').doc().id;
            await db.collection('users').doc(user.uid)
                .collection('orders').doc(orderId)
                .collection('payments').doc(paymentId)
                .set({
                    id: paymentId,
                    amount: parseFloat(paymentData.amount),
                    paymentMethod: paymentData.paymentMethod || 'cash',
                    paymentDate: new Date().toISOString(),
                    notes: paymentData.notes || '',
                    createdAt: new Date().toISOString()
                });
            
            // Mettre à jour la commande
            await db.collection('users').doc(user.uid)
                .collection('orders').doc(orderId)
                .update({
                    amountPaid: newAmountPaid,
                    remainingAmount: newRemainingAmount,
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                });
            
            console.log('✅ Paiement ajouté à la commande:', orderId);
            return await this.getOrder(orderId);
            
        } catch (error) {
            console.error('❌ Erreur ajout paiement:', error);
            throw error;
        }
    }

    async updateOrder(orderId, updates) {
        try {
            const user = await window.firebaseServices.requireAuth('modifier une commande');
            const db = window.firebaseServices.getFirestore();
            
            await db.collection('users').doc(user.uid)
                .collection('orders').doc(orderId)
                .update({
                    ...updates,
                    updatedAt: new Date().toISOString()
                });
            
            console.log('✅ Commande mise à jour:', orderId);
            return await this.getOrder(orderId);
            
        } catch (error) {
            console.error('❌ Erreur mise à jour commande:', error);
            throw error;
        }
    }

    async deleteOrder(orderId) {
        try {
            const user = await window.firebaseServices.requireAuth('supprimer une commande');
            const db = window.firebaseServices.getFirestore();
            
            await db.collection('users').doc(user.uid)
                .collection('orders').doc(orderId)
                .delete();
            
            console.log('✅ Commande supprimée:', orderId);
            return true;
            
        } catch (error) {
            console.error("❌ Erreur suppression commande:", error);
            throw error;
        }
    }
}

/**
 * Gestion des Mesures (version améliorée)


    async getClientMeasurements(clientId) {
        try {
            const user = await window.firebaseServices.requireAuth('accéder aux mesures');
            const db = window.firebaseServices.getFirestore();
            
            const snapshot = await db.collection('users').doc(user.uid)
                .collection('measurements')
                .where('clientId', '==', clientId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const measurements = snapshot.docs.map(doc => doc.data());
            console.log(`✅ ${measurements.length} mesures trouvées pour client ${clientId}`);
            return measurements;
            
        } catch (error) {
            console.error('❌ Erreur récupération mesures:', error);
            return [];
        }
    }

    getStandardMeasurements() {
        return this.standardMeasurements;
    }
}
 */

/**
 * Gestion de la Facturation (version améliorée)

class BillingManager {
    constructor() {
        this.invoiceCounter = 1;
        this.taxRate = 0.00;
        console.log('💰 BillingManager initialisé');
    }

    async generateInvoice(order, client, creation) {
        try {
            const user = await window.firebaseServices.requireAuth('générer une facture');
            const db = window.firebaseServices.getFirestore();
            
            const invoiceId = `INV-${new Date().getFullYear()}-${this.invoiceCounter.toString().padStart(4, '0')}`;
            
            const invoice = {
                id: invoiceId,
                orderId: order.id,
                clientId: client.id,
                date: new Date().toISOString(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        description: creation.name,
                        quantity: 1,
                        unitPrice: order.totalAmount,
                        total: order.totalAmount
                    }
                ],
                subtotal: order.totalAmount,
                tax: order.totalAmount * this.taxRate,
                total: order.totalAmount * (1 + this.taxRate),
                amountPaid: order.amountPaid,
                balanceDue: order.remainingAmount,
                status: order.remainingAmount > 0 ? 'pending' : 'paid',
                clientInfo: {
                    name: client.fullName,
                    phone: client.phone,
                    email: client.email,
                    address: client.address
                },
                businessInfo: await this.getBusinessInfo(),
                notes: order.notes || ''
            };
            
            this.invoiceCounter++;
            
            await db.collection('users').doc(user.uid)
                .collection('invoices').doc(invoiceId)
                .set(invoice);
            
            console.log('✅ Facture générée:', invoiceId);
            return invoice;
            
        } catch (error) {
            console.error('❌ Erreur génération facture:', error);
            throw error;
        }
    }

    async getBusinessInfo() {
        // À implémenter avec les paramètres utilisateur
        return {
            name: "Votre Entreprise",
            address: "Adresse à configurer",
            phone: "",
            email: ""
        };
    }

    async getFinancialReport(startDate, endDate) {
        try {
            const user = await window.firebaseServices.requireAuth('générer un rapport');
            const orders = await window.firebaseBusinessServices.getService('orders').getOrders();
            
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
            });
            
            const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            const totalPaid = filteredOrders.reduce((sum, order) => sum + order.amountPaid, 0);
            const totalPending = filteredOrders.reduce((sum, order) => sum + order.remainingAmount, 0);
            
            return {
                period: { 
                    startDate: new Date(startDate).toLocaleDateString('fr-FR'),
                    endDate: new Date(endDate).toLocaleDateString('fr-FR')
                },
                summary: {
                    totalOrders: filteredOrders.length,
                    totalRevenue,
                    totalPaid,
                    totalPending,
                    averageOrderValue: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0
                },
                ordersByStatus: this.groupOrdersByStatus(filteredOrders),
                revenueByMonth: this.groupRevenueByMonth(filteredOrders)
            };
            
        } catch (error) {
            console.error('❌ Erreur génération rapport:', error);
            throw error;
        }
    }

    groupOrdersByStatus(orders) {
        return orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});
    }

    groupRevenueByMonth(orders) {
        return orders.reduce((acc, order) => {
            const month = new Date(order.createdAt).toISOString().substring(0, 7);
            acc[month] = (acc[month] || 0) + order.totalAmount;
            return acc;
        }, {});
    }
}
 */
// ==================== INITIALISATION ET EXPOSITION ====================

// Créer l'instance principale
const firebaseBusinessServices = new FirebaseBusinessServices();

// Exposition globale
window.firebaseBusinessServices = firebaseBusinessServices;

// Initialisation automatique lorsque Firebase est prêt
document.addEventListener('firebase-services-ready', async () => {
    console.log('🎯 firebase-services.js: Firebase prêt - initialisation des services métier');
    
    try {
        await firebaseBusinessServices.initialize();
        
        // Intégration avec firebaseServices existant pour compatibilité
        if (window.firebaseServices) {
            window.firebaseServices.creations = firebaseBusinessServices.getService('creations');
            window.firebaseServices.clients = firebaseBusinessServices.getService('clients');
            window.firebaseServices.orders = firebaseBusinessServices.getService('orders');
            window.firebaseServices.measurements = firebaseBusinessServices.getService('measurements');
            window.firebaseServices.billing = firebaseBusinessServices.getService('billing');
            
            console.log('✅ firebase-services.js: Services intégrés avec firebaseServices existant');
        }
        
    } catch (error) {
        console.error('❌ firebase-services.js: Erreur initialisation services métier:', error);
    }
});

// Fallback: initialisation manuelle
window.initializeFirebaseBusinessServices = async () => {
    return await firebaseBusinessServices.initialize();
};

console.log('✅ firebase-services.js: Services métier Firebase prêts pour initialisation');
