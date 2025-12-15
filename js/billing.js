// js/billing.js - MODULE COMPLET DE FACTURATION
console.log('💰 billing.js: Chargement du module de facturation');

class BillingManager {
    constructor() {
        this.invoiceCounter = 1;
        this.taxRate = 0.00; // À configurer selon la région
        console.log('✅ BillingManager initialisé');
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
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
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
            
            // Sauvegarder la facture
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
        // Récupérer les informations de l'entreprise depuis les paramètres
        // Pour l'instant, valeurs par défaut
        return {
            name: "Votre Entreprise",
            address: "Adresse à configurer",
            phone: "",
            email: "",
            siret: "" // Numéro SIRET pour la France
        };
    }

    async getInvoice(invoiceId) {
        try {
            const user = await window.firebaseServices.requireAuth('accéder à une facture');
            const db = window.firebaseServices.getFirestore();
            
            const doc = await db.collection('users').doc(user.uid)
                .collection('invoices').doc(invoiceId)
                .get();
                
            return doc.exists ? doc.data() : null;
            
        } catch (error) {
            console.error('❌ Erreur récupération facture:', error);
            throw error;
        }
    }

    async getInvoices(filters = {}) {
        try {
            const user = await window.firebaseServices.requireAuth('accéder aux factures');
            const db = window.firebaseServices.getFirestore();
            
            let query = db.collection('users').doc(user.uid)
                .collection('invoices');
                
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters.clientId) {
                query = query.where('clientId', '==', filters.clientId);
            }
            
            query = query.orderBy('date', 'desc');
            
            const snapshot = await query.get();
            const invoices = snapshot.docs.map(doc => doc.data());
            
            console.log(`✅ ${invoices.length} factures trouvées`);
            return invoices;
            
        } catch (error) {
            console.error('❌ Erreur récupération factures:', error);
            return [];
        }
    }

    async getFinancialReport(startDate, endDate) {
        try {
            const user = await window.firebaseServices.requireAuth('générer un rapport');
            const orders = await window.firebaseServices.orders.getOrders();
            
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
            });
            
            const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            const totalPaid = filteredOrders.reduce((sum, order) => sum + order.amountPaid, 0);
            const totalPending = filteredOrders.reduce((sum, order) => sum + order.remainingAmount, 0);
            
            const report = {
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
                revenueByMonth: this.groupRevenueByMonth(filteredOrders),
                topClients: this.getTopClients(filteredOrders)
            };
            
            console.log('✅ Rapport financier généré');
            return report;
            
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
            const month = new Date(order.createdAt).toISOString().substring(0, 7); // YYYY-MM
            acc[month] = (acc[month] || 0) + order.totalAmount;
            return acc;
        }, {});
    }

    getTopClients(orders) {
        const clientRevenue = orders.reduce((acc, order) => {
            acc[order.clientId] = (acc[order.clientId] || 0) + order.totalAmount;
            return acc;
        }, {});
        
        return Object.entries(clientRevenue)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([clientId, revenue]) => ({ clientId, revenue }));
    }

    renderInvoice(invoice) {
        if (!invoice) return '<div class="error">Facture non trouvée</div>';
        
        return `
            <div class="invoice">
                <div class="invoice-header">
                    <div class="invoice-title">
                        <h2>FACTURE</h2>
                        <strong>${invoice.id}</strong>
                    </div>
                    <div class="invoice-dates">
                        <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Échéance:</strong> ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
                
                <div class="invoice-parties">
                    <div class="business-info">
                        <h4>${invoice.businessInfo.name}</h4>
                        <p>${invoice.businessInfo.address}</p>
                        ${invoice.businessInfo.phone ? `<p>Tél: ${invoice.businessInfo.phone}</p>` : ''}
                        ${invoice.businessInfo.email ? `<p>Email: ${invoice.businessInfo.email}</p>` : ''}
                        ${invoice.businessInfo.siret ? `<p>SIRET: ${invoice.businessInfo.siret}</p>` : ''}
                    </div>
                    
                    <div class="client-info">
                        <h4>Facturé à</h4>
                        <p><strong>${invoice.clientInfo.name}</strong></p>
                        ${invoice.clientInfo.phone ? `<p>Tél: ${invoice.clientInfo.phone}</p>` : ''}
                        ${invoice.clientInfo.email ? `<p>Email: ${invoice.clientInfo.email}</p>` : ''}
                        ${invoice.clientInfo.address ? `
                            <p>${invoice.clientInfo.address.street || ''}</p>
                            <p>${invoice.clientInfo.address.zipCode || ''} ${invoice.clientInfo.address.city || ''}</p>
                        ` : ''}
                    </div>
                </div>
                
                <table class="invoice-items">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantité</th>
                            <th>Prix Unitaire</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-right">${this.formatCurrency(item.unitPrice)}</td>
                                <td class="text-right">${this.formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="invoice-totals">
                    <div class="total-row">
                        <span>Sous-total:</span>
                        <span>${this.formatCurrency(invoice.subtotal)}</span>
                    </div>
                    ${invoice.tax > 0 ? `
                    <div class="total-row">
                        <span>Taxe (${(this.taxRate * 100)}%):</span>
                        <span>${this.formatCurrency(invoice.tax)}</span>
                    </div>
                    ` : ''}
                    <div class="total-row total">
                        <span><strong>Total:</strong></span>
                        <span><strong>${this.formatCurrency(invoice.total)}</strong></span>
                    </div>
                    <div class="total-row">
                        <span>Déjà payé:</span>
                        <span>${this.formatCurrency(invoice.amountPaid)}</span>
                    </div>
                    <div class="total-row balance">
                        <span><strong>Reste à payer:</strong></span>
                        <span><strong>${this.formatCurrency(invoice.balanceDue)}</strong></span>
                    </div>
                </div>
                
                ${invoice.notes ? `
                <div class="invoice-notes">
                    <h4>Notes</h4>
                    <p>${invoice.notes}</p>
                </div>
                ` : ''}
                
                <div class="invoice-status">
                    <span class="status-badge status-${invoice.status}">
                        ${invoice.status === 'paid' ? 'Payée' : 'En attente'}
                    </span>
                </div>
            </div>
        `;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Nouvelle méthode pour marquer une facture comme payée
    async markInvoiceAsPaid(invoiceId, paymentData = {}) {
        try {
            const user = await window.firebaseServices.requireAuth('mettre à jour une facture');
            const db = window.firebaseServices.getFirestore();
            
            const invoiceRef = db.collection('users').doc(user.uid)
                .collection('invoices').doc(invoiceId);
                
            await invoiceRef.update({
                status: 'paid',
                amountPaid: paymentData.amount || firebase.firestore.FieldValue.increment(paymentData.amount),
                balanceDue: 0,
                updatedAt: new Date().toISOString()
            });
            
            console.log('✅ Facture marquée comme payée:', invoiceId);
            return await this.getInvoice(invoiceId);
            
        } catch (error) {
            console.error('❌ Erreur mise à jour facture:', error);
            throw error;
        }
    }
}

// Initialisation et exposition
window.billingManager = new BillingManager();

// Intégration avec firebaseServices
if (window.firebaseServices) {
    window.firebaseServices.billing = window.billingManager;
    console.log('✅ billing.js: Intégré avec firebaseServices');
} else {
    console.warn('⚠️ billing.js: firebaseServices non disponible');
}

console.log('✅ billing.js: Module de facturation initialisé');

