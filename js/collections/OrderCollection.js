// collections/OrderCollection.js - Gestion des commandes pour couturiers
class OrderCollection extends BaseCollection {
    constructor(options = {}) {
        super('orders', {
            autoSave: options.autoSave !== false,
            syncEnabled: options.syncEnabled !== false,
            requiredFields: ['clientId', 'creationId', 'amount', 'status'],
            validationRules: {
                clientId: {
                    validator: (value) => value && value > 0,
                    message: 'ID client requis'
                },
                creationId: {
                    validator: (value) => value && value > 0,
                    message: 'ID création requis'
                },
                amount: {
                    validator: (value) => !isNaN(value) && parseFloat(value) > 0,
                    message: 'Le montant doit être un nombre positif'
                },
                paid: {
                    validator: (value) => !value || (!isNaN(value) && parseFloat(value) >= 0),
                    message: 'Le montant payé doit être un nombre positif'
                },
                status: {
                    validator: (value) => ['en_attente', 'en_cours', 'terminee', 'livree', 'annulee'].includes(value),
                    message: 'Statut de commande non valide'
                },
                deadline: {
                    validator: (value) => !value || !isNaN(new Date(value).getTime()),
                    message: 'Date limite invalide'
                }
            },
            ...options
        });

        this.statuses = [
            { value: 'en_attente', label: '⏳ En attente', color: '#ff9800', progress: 0 },
            { value: 'en_cours', label: '✂️ En cours', color: '#2196f3', progress: 50 },
            { value: 'terminee', label: '✅ Terminée', color: '#4caf50', progress: 90 },
            { value: 'livree', label: '🎁 Livrée', color: '#009688', progress: 100 },
            { value: 'annulee', label: '❌ Annulée', color: '#f44336', progress: 0 }
        ];

        this.paymentMethods = [
            { value: 'especes', label: '💵 Espèces' },
            { value: 'mobile_money', label: '📱 Mobile Money' },
            { value: 'virement', label: '🏦 Virement' },
            { value: 'carte', label: '💳 Carte' },
            { value: 'cheque', label: '📄 Chèque' }
        ];

        this.initEventListeners();
    }

    /**
     * Initialisation des écouteurs d'événements
     */
    initEventListeners() {
        // Écouter les changements de statut des clients et créations
        this.on('add', (order) => this.onOrderAdded(order));
        this.on('update', (data) => this.onOrderUpdated(data));
        this.on('delete', (order) => this.onOrderDeleted(order));
    }

    /**
     * Ajouter une commande avec validation étendue
     */
    add(orderData) {
        // Nettoyage des données
        const cleanedData = this.cleanOrderData(orderData);
        
        // Validation métier supplémentaire
        this.validateBusinessRules(cleanedData);
        
        // Calculs automatiques
        const enhancedData = this.enhanceOrderData(cleanedData);
        
        return super.add(enhancedData);
    }

    /**
     * Mettre à jour une commande
     */
    update(id, updates) {
        const cleanedUpdates = this.cleanOrderData(updates);
        const enhancedUpdates = this.enhanceOrderData(cleanedUpdates, true);
        return super.update(id, enhancedUpdates);
    }

    /**
     * Nettoyer les données commande
     */
    cleanOrderData(orderData) {
        const cleaned = { ...orderData };
        
        // Nettoyage des chaînes de caractères
        if (cleaned.notes) cleaned.notes = cleaned.notes.trim();
        if (cleaned.specialInstructions) cleaned.specialInstructions = cleaned.specialInstructions.trim();
        
        // Conversion des nombres
        if (cleaned.amount) cleaned.amount = parseFloat(cleaned.amount);
        if (cleaned.paid) cleaned.paid = parseFloat(cleaned.paid);
        if (cleaned.deposit) cleaned.deposit = parseFloat(cleaned.deposit);
        
        // Valeurs par défaut
        if (!cleaned.status) cleaned.status = 'en_attente';
        if (!cleaned.priority) cleaned.priority = 'normal';
        if (!cleaned.paymentMethod) cleaned.paymentMethod = 'especes';
        if (!cleaned.paid) cleaned.paid = 0;
        if (!cleaned.deposit) cleaned.deposit = 0;
        
        // Dates
        if (!cleaned.date) cleaned.date = new Date().toISOString().split('T')[0];
        if (cleaned.deadline && typeof cleaned.deadline === 'string') {
            cleaned.deadline = cleaned.deadline.split('T')[0];
        }
        
        return cleaned;
    }

    /**
     * Enrichir les données commande
     */
    enhanceOrderData(orderData, isUpdate = false) {
        const enhanced = { ...orderData };
        
        // Calcul du solde restant
        enhanced.remaining = enhanced.amount - (enhanced.paid || 0);
        enhanced.isFullyPaid = enhanced.remaining <= 0;
        
        // Calcul de l'avancement du paiement
        enhanced.paymentProgress = enhanced.amount > 0 ? 
            Math.round((enhanced.paid / enhanced.amount) * 100) : 0;
        
        // Statut de paiement
        enhanced.paymentStatus = this.getPaymentStatus(enhanced.paid, enhanced.amount);
        
        // Délai
        if (enhanced.deadline) {
            enhanced.deadlineStatus = this.getDeadlineStatus(enhanced.deadline);
            enhanced.isOverdue = enhanced.deadlineStatus === 'overdue';
            enhanced.daysUntilDeadline = this.getDaysUntilDeadline(enhanced.deadline);
        }
        
        // Numéro de commande unique
        if (!isUpdate && !enhanced.orderNumber) {
            enhanced.orderNumber = this.generateOrderNumber();
        }
        
        return enhanced;
    }

    /**
     * Validation des règles métier
     */
    validateBusinessRules(orderData) {
        const errors = [];
        
        // Vérification du montant payé vs montant total
        if (orderData.paid > orderData.amount) {
            errors.push('Le montant payé ne peut pas dépasser le montant total');
        }
        
        // Vérification de la date limite
        if (orderData.deadline) {
            const deadline = new Date(orderData.deadline);
            const orderDate = new Date(orderData.date || new Date());
            
            if (deadline < orderDate) {
                errors.push('La date limite ne peut pas être antérieure à la date de commande');
            }
            
            // Limite à 1 an maximum
            const oneYearLater = new Date(orderDate);
            oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
            
            if (deadline > oneYearLater) {
                errors.push('La date limite ne peut pas dépasser 1 an');
            }
        }
        
        // Vérification de l'acompte
        if (orderData.deposit && orderData.deposit > orderData.amount) {
            errors.push('L\'acompte ne peut pas dépasser le montant total');
        }
        
        if (errors.length > 0) {
            throw new Error(`Règles métier non respectées: ${errors.join(', ')}`);
        }
    }

    /**
     * Générer un numéro de commande unique
     */
    generateOrderNumber() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `CMD-${timestamp}-${random}`;
    }

    /**
     * Obtenir le statut de paiement
     */
    getPaymentStatus(paid, amount) {
        if (paid === 0) return 'non_paye';
        if (paid < amount) return 'partiel';
        if (paid === amount) return 'paye';
        return 'surpaye';
    }

    /**
     * Obtenir le statut du délai
     */
    getDeadlineStatus(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'overdue';
        if (diffDays <= 2) return 'urgent';
        if (diffDays <= 7) return 'approaching';
        return 'normal';
    }

    /**
     * Obtenir le nombre de jours jusqu'à la date limite
     */
    getDaysUntilDeadline(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Recherche avancée de commandes
     */
    advancedSearch(criteria) {
        let results = this.getAll();
        
        // Filtre par terme de recherche
        if (criteria.searchTerm) {
            const searchFields = ['orderNumber', 'notes', 'specialInstructions'];
            results = this.search(criteria.searchTerm, searchFields);
        }
        
        // Filtre par statut
        if (criteria.status) {
            results = results.filter(order => order.status === criteria.status);
        }
        
        // Filtre par statut de paiement
        if (criteria.paymentStatus) {
            results = results.filter(order => order.paymentStatus === criteria.paymentStatus);
        }
        
        // Filtre par client
        if (criteria.clientId) {
            results = results.filter(order => order.clientId === criteria.clientId);
        }
        
        // Filtre par création
        if (criteria.creationId) {
            results = results.filter(order => order.creationId === criteria.creationId);
        }
        
        // Filtre par date
        if (criteria.startDate) {
            results = results.filter(order => new Date(order.date) >= new Date(criteria.startDate));
        }
        if (criteria.endDate) {
            results = results.filter(order => new Date(order.date) <= new Date(criteria.endDate));
        }
        
        // Filtre par montant
        if (criteria.minAmount) {
            results = results.filter(order => order.amount >= criteria.minAmount);
        }
        if (criteria.maxAmount) {
            results = results.filter(order => order.amount <= criteria.maxAmount);
        }
        
        // Filtre par commandes en retard
        if (criteria.overdueOnly) {
            results = results.filter(order => order.isOverdue);
        }
        
        // Tri
        if (criteria.sortBy) {
            results = this.sortOrders(results, criteria.sortBy, criteria.sortOrder);
        }
        
        return results;
    }

    /**
     * Trier les commandes
     */
    sortOrders(orders, sortBy = 'date', sortOrder = 'desc') {
        return orders.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            // Gestion des valeurs manquantes
            if (aValue === undefined || aValue === null) aValue = '';
            if (bValue === undefined || bValue === null) bValue = '';
            
            // Tri spécial pour les dates et nombres
            if (['date', 'deadline', 'createdAt', 'updatedAt'].includes(sortBy)) {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            } else if (['amount', 'paid', 'remaining', 'deposit'].includes(sortBy)) {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Obtenir les statistiques des commandes
     */
    getOrderStats(timeRange = 'all') {
        const orders = this.getAll();
        const stats = {
            total: orders.length,
            totalAmount: 0,
            totalPaid: 0,
            totalRemaining: 0,
            byStatus: {},
            byPaymentStatus: {},
            overdueCount: 0,
            recentOrders: 0,
            averageOrderValue: 0
        };
        
        let totalValue = 0;
        let valueCount = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        orders.forEach(order => {
            // Montants totaux
            stats.totalAmount += order.amount || 0;
            stats.totalPaid += order.paid || 0;
            stats.totalRemaining += order.remaining || 0;
            
            // Par statut
            const status = order.status || 'en_attente';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            
            // Par statut de paiement
            const paymentStatus = order.paymentStatus || 'non_paye';
            stats.byPaymentStatus[paymentStatus] = (stats.byPaymentStatus[paymentStatus] || 0) + 1;
            
            // Commandes en retard
            if (order.isOverdue) {
                stats.overdueCount++;
            }
            
            // Commandes récentes (30 derniers jours)
            if (new Date(order.createdAt || order.date) > thirtyDaysAgo) {
                stats.recentOrders++;
            }
            
            // Valeur moyenne des commandes
            if (order.amount) {
                totalValue += order.amount;
                valueCount++;
            }
        });
        
        stats.averageOrderValue = valueCount > 0 ? Math.round(totalValue / valueCount) : 0;
        
        return stats;
    }

    /**
     * Obtenir les commandes d'un client
     */
    getClientOrders(clientId) {
        return this.getAll()
            .filter(order => order.clientId === clientId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Obtenir les commandes pour une création
     */
    getCreationOrders(creationId) {
        return this.getAll()
            .filter(order => order.creationId === creationId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Obtenir les commandes en retard
     */
    getOverdueOrders() {
        return this.getAll()
            .filter(order => order.isOverdue && !['terminee', 'livree', 'annulee'].includes(order.status))
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }

    /**
     * Obtenir les commandes nécessitant une action
     */
    getActionRequiredOrders() {
        return this.getAll().filter(order => 
            order.status === 'en_attente' || 
            (order.paymentStatus === 'non_paye' && order.status !== 'annulee') ||
            order.isOverdue
        );
    }

    /**
     * Ajouter un paiement à une commande
     */
    addPayment(orderId, paymentData) {
        const order = this.get(orderId);
        if (!order) {
            throw new Error(`Commande non trouvée avec l'ID: ${orderId}`);
        }
        
        const payment = {
            id: Date.now(),
            amount: parseFloat(paymentData.amount),
            method: paymentData.method || 'especes',
            date: paymentData.date || new Date().toISOString(),
            notes: paymentData.notes || '',
            recordedBy: paymentData.recordedBy || 'system'
        };
        
        // Validation du paiement
        if (payment.amount <= 0) {
            throw new Error('Le montant du paiement doit être positif');
        }
        
        const newPaidAmount = (order.paid || 0) + payment.amount;
        
        if (newPaidAmount > order.amount) {
            throw new Error('Le paiement dépasse le montant total de la commande');
        }
        
        // Mettre à jour la commande
        const updates = {
            paid: newPaidAmount,
            lastPaymentDate: payment.date,
            paymentMethod: payment.method
        };
        
        // Ajouter au historique des paiements
        if (!order.payments) order.payments = [];
        updates.payments = [...order.payments, payment];
        
        return this.update(orderId, updates);
    }

    /**
     * Changer le statut d'une commande
     */
    changeStatus(orderId, newStatus, notes = '') {
        const order = this.get(orderId);
        if (!order) {
            throw new Error(`Commande non trouvée avec l'ID: ${orderId}`);
        }
        
        if (!this.statuses.find(s => s.value === newStatus)) {
            throw new Error(`Statut non valide: ${newStatus}`);
        }
        
        const updates = {
            status: newStatus,
            statusChangedAt: new Date().toISOString()
        };
        
        if (notes) {
            updates.statusNotes = notes;
        }
        
        // Historique des statuts
        if (!order.statusHistory) order.statusHistory = [];
        updates.statusHistory = [
            ...order.statusHistory,
            {
                from: order.status,
                to: newStatus,
                date: new Date().toISOString(),
                notes: notes
            }
        ];
        
        return this.update(orderId, updates);
    }

    /**
     * Obtenir l'historique d'une commande
     */
    getOrderHistory(orderId) {
        const order = this.get(orderId);
        if (!order) return [];
        
        const history = [];
        
        // Ajouter la création
        history.push({
            type: 'created',
            date: order.createdAt,
            description: 'Commande créée'
        });
        
        // Ajouter les changements de statut
        if (order.statusHistory) {
            order.statusHistory.forEach(change => {
                history.push({
                    type: 'status_change',
                    date: change.date,
                    description: `Statut changé de ${this.getStatusLabel(change.from)} à ${this.getStatusLabel(change.to)}`,
                    details: change.notes
                });
            });
        }
        
        // Ajouter les paiements
        if (order.payments) {
            order.payments.forEach(payment => {
                history.push({
                    type: 'payment',
                    date: payment.date,
                    description: `Paiement de ${this.formatCurrency(payment.amount)} (${this.getPaymentMethodLabel(payment.method)})`,
                    details: payment.notes
                });
            });
        }
        
        // Trier par date
        return history.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Obtenir le label d'un statut
     */
    getStatusLabel(statusValue) {
        const status = this.statuses.find(s => s.value === statusValue);
        return status ? status.label : '❓ Inconnu';
    }

    /**
     * Obtenir la couleur d'un statut
     */
    getStatusColor(statusValue) {
        const status = this.statuses.find(s => s.value === statusValue);
        return status ? status.color : '#9e9e9e';
    }

    /**
     * Obtenir le label d'une méthode de paiement
     */
    getPaymentMethodLabel(methodValue) {
        const method = this.paymentMethods.find(m => m.value === methodValue);
        return method ? method.label : '💵 Espèces';
    }

    /**
     * Formater une devise
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Générer un rapport financier
     */
    generateFinancialReport(startDate, endDate) {
        const orders = this.getAll().filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
        });
        
        const report = {
            period: { startDate, endDate },
            generatedAt: new Date().toISOString(),
            totalOrders: orders.length,
            totalRevenue: 0,
            totalCollected: 0,
            totalPending: 0,
            byStatus: {},
            byPaymentMethod: {},
            byMonth: {},
            topClients: []
        };
        
        const clientTotals = {};
        
        orders.forEach(order => {
            // Revenus totaux
            report.totalRevenue += order.amount || 0;
            report.totalCollected += order.paid || 0;
            report.totalPending += order.remaining || 0;
            
            // Par statut
            const status = order.status || 'en_attente';
            if (!report.byStatus[status]) {
                report.byStatus[status] = { count: 0, amount: 0 };
            }
            report.byStatus[status].count++;
            report.byStatus[status].amount += order.amount || 0;
            
            // Par méthode de paiement
            const method = order.paymentMethod || 'especes';
            if (!report.byPaymentMethod[method]) {
                report.byPaymentMethod[method] = { count: 0, amount: 0 };
            }
            report.byPaymentMethod[method].count++;
            report.byPaymentMethod[method].amount += order.paid || 0;
            
            // Par mois
            const month = new Date(order.date).toISOString().substring(0, 7);
            if (!report.byMonth[month]) {
                report.byMonth[month] = { count: 0, revenue: 0 };
            }
            report.byMonth[month].count++;
            report.byMonth[month].revenue += order.amount || 0;
            
            // Totaux par client
            if (order.clientId) {
                if (!clientTotals[order.clientId]) {
                    clientTotals[order.clientId] = { amount: 0, orders: 0 };
                }
                clientTotals[order.clientId].amount += order.amount || 0;
                clientTotals[order.clientId].orders++;
            }
        });
        
        // Top clients
        report.topClients = Object.entries(clientTotals)
            .sort(([,a], [,b]) => b.amount - a.amount)
            .slice(0, 10)
            .map(([clientId, data]) => ({
                clientId: parseInt(clientId),
                totalAmount: data.amount,
                orderCount: data.orders
            }));
        
        return report;
    }

    /**
     * Événement lors de l'ajout d'une commande
     */
    onOrderAdded(order) {
        console.log(`🆕 Nouvelle commande ajoutée: ${order.orderNumber}`);
        // Ici on pourrait notifier l'utilisateur ou synchroniser
    }

    /**
     * Événement lors de la mise à jour d'une commande
     */
    onOrderUpdated(data) {
        console.log(`✏️ Commande mise à jour: ${data.updated.orderNumber}`);
        
        // Notifier les changements importants
        if (data.original.status !== data.updated.status) {
            console.log(`🔄 Statut changé: ${data.original.status} → ${data.updated.status}`);
        }
        
        if (data.original.paid !== data.updated.paid) {
            console.log(`💰 Paiement mis à jour: ${data.original.paid} → ${data.updated.paid}`);
        }
    }

    /**
     * Événement lors de la suppression d'une commande
     */
    onOrderDeleted(order) {
        console.log(`🗑️ Commande supprimée: ${order.orderNumber}`);
    }

    /**
     * Synchronisation cloud spécifique aux commandes
     */
    async syncWithCloud() {
        if (!this.syncEnabled) {
            console.log('⚠️ Synchronisation cloud désactivée pour les commandes');
            return;
        }
        
        try {
            console.log('☁️ Synchronisation des commandes avec le cloud...');
            
            // Implémentation future avec Firebase Firestore
            // Pour l'instant, simulation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ Synchronisation commandes terminée');
            this.triggerEvent('sync', { success: true, timestamp: new Date().toISOString() });
            
        } catch (error) {
            console.error('❌ Erreur de synchronisation commandes:', error);
            this.triggerEvent('sync', { success: false, error: error.message });
            throw error;
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderCollection;
} else {
    window.OrderCollection = OrderCollection;
}

console.log('✅ OrderCollection chargée - Prête pour la gestion des commandes');

