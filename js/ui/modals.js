// modals.js - Gestion complète des modals avec Nouvelle Architecture Firebase
console.log('🔧 modals.js: Chargement - Version Nouvelle Architecture Firebase');

class ModalManager {
    constructor() {
        this.currentEditingId = null;
        this.init();
    }

    init() {
        console.log('🔧 modals.js: Initialisation Modal Manager');
        this.setupModalEvents();
        this.setupFirebaseListeners();
    }
    
    // 1. Configuration des événements de modals
    setupModalEvents() {
        console.log('🔧 modals.js: Configuration événements modals...');
        
        // Fermeture des modals
        document.addEventListener('click', (e) => {
            // Fermeture via bouton close
            if (e.target.classList.contains('close-modal')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id.replace('-modal', ''));
                }
            }
            
            // Fermeture de la modal d'image
            if (e.target.classList.contains('close-image-modal')) {
                this.closeModal('image');
            }
            
            // Fermeture en cliquant à l'extérieur
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id.replace('-modal', ''));
            }
            
            // Édition création
            if (e.target.classList.contains('edit-creation')) {
                const id = e.target.getAttribute('data-id');
                this.editCreation(id);
            }
            
            // Suppression création
            if (e.target.classList.contains('delete-creation')) {
                const id = e.target.getAttribute('data-id');
                this.deleteCreation(id);
            }
            
            // Édition client
            if (e.target.classList.contains('edit-client')) {
                const id = e.target.getAttribute('data-id');
                this.editClient(id);
            }
            
            // Suppression client
            if (e.target.classList.contains('delete-client')) {
                const id = e.target.getAttribute('data-id');
                this.deleteClient(id);
            }
            
            // Édition commande
            if (e.target.classList.contains('edit-order')) {
                const id = e.target.getAttribute('data-id');
                this.editOrder(id);
            }
            
            // Paiement commande
            if (e.target.classList.contains('add-payment')) {
                const id = e.target.getAttribute('data-id');
                this.addPayment(id);
            }
            
            // Suppression commande
            if (e.target.classList.contains('delete-order')) {
                const id = e.target.getAttribute('data-id');
                this.deleteOrder(id);
            }

            // Voir les détails
            if (e.target.classList.contains('view-details')) {
                const id = e.target.getAttribute('data-id');
                const type = e.target.getAttribute('data-type');
                this.viewDetails(id, type);
            }
        });

        // Événement pour le changement de création dans le modal commande
        const orderCreationSelect = document.getElementById('order-creation');
        if (orderCreationSelect) {
            orderCreationSelect.addEventListener('change', () => {
                this.updateOrderAmountFromCreation();
            });
        }

        // Événement pour le changement de client dans le modal commande
        const orderClientSelect = document.getElementById('order-client');
        if (orderClientSelect) {
            orderClientSelect.addEventListener('change', () => {
                this.updateClientInfo();
            });
        }

        // Écouteurs pour les calculs automatiques
        const costInputs = ['creation-base-cost', 'creation-materials-cost', 'creation-labor-cost'];
        costInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    this.updateCreationTotalCost();
                });
            }
        });

        const orderAmountInputs = ['order-amount', 'order-paid'];
        orderAmountInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    this.updateOrderCalculations();
                });
            }
        });
        
        // Gestionnaires de soumission de formulaires
        document.addEventListener('submit', (e) => {
            e.preventDefault();
            
            switch(e.target.id) {
                case 'creation-form':
                    this.handleCreationSubmit();
                    break;
                case 'client-form':
                    this.handleClientSubmit();
                    break;
                case 'order-form':
                    this.handleOrderSubmit();
                    break;
                case 'payment-form':
                    this.handlePaymentSubmit();
                    break;
            }
        });

        // Upload d'image
        const imageUpload = document.getElementById('creation-image-upload');
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => {
                this.handleImageUpload(e);
            });
        }

        console.log('✅ modals.js: Événements modals configurés');
    }

    // 2. Configuration des écouteurs Firebase
    setupFirebaseListeners() {
        console.log('🔧 modals.js: Configuration écouteurs Firebase...');
        
        document.addEventListener('auth-state-changed', (event) => {
            if (!event.detail.user) {
                // Utilisateur déconnecté - fermer tous les modals
                this.closeAllModals();
            } else {
                // Utilisateur connecté - rafraîchir les sélecteurs
                setTimeout(() => this.refreshAllSelects(), 5000);
            }
        });

        // Rafraîchir les sélecteurs quand les données changent
        document.addEventListener('data-updated', (event) => {
            if (event.detail && event.detail.type) {
                this.refreshAllSelects();
            }
        });
    }

    // Méthodes de soumission
    async handleCreationSubmit() {
        const formData = {
            name: document.getElementById('creation-name').value,
            description: document.getElementById('creation-description').value,
            category: document.getElementById('creation-category').value,
            baseCost: parseFloat(document.getElementById('creation-base-cost').value) || 0,
            materialsCost: parseFloat(document.getElementById('creation-materials-cost').value) || 0,
            laborCost: parseFloat(document.getElementById('creation-labor-cost').value) || 0
        };

        try {
            if (this.currentEditingId) {
                // Mise à jour
                await window.app.updateCreation(this.currentEditingId, formData);
                this.showMessage('Création mise à jour avec succès!', 'success');
            } else {
                // Création
                await window.app.createNewCreation(formData);
                this.showMessage('Création ajoutée avec succès!', 'success');
            }
            this.closeModal('creation');
        } catch (error) {
            console.error('Erreur sauvegarde création:', error);
            this.showMessage('Erreur lors de la sauvegarde de la création', 'error');
        }
    }

    async handleClientSubmit() {
        const formData = {
            firstName: document.getElementById('client-firstname').value,
            lastName: document.getElementById('client-lastname').value,
            phone: document.getElementById('client-phone').value,
            email: document.getElementById('client-email').value,
            address: {
                street: document.getElementById('client-address').value,
                city: document.getElementById('client-city').value,
                zipCode: document.getElementById('client-zipcode').value
            },
            notes: document.getElementById('client-notes').value
        };

        try {
            if (this.currentEditingId) {
                await window.app.updateClient(this.currentEditingId, formData);
                this.showMessage('Client mis à jour avec succès!', 'success');
            } else {
                await window.app.createNewClient(formData);
                this.showMessage('Client ajouté avec succès!', 'success');
            }
            this.closeModal('client');
        } catch (error) {
            console.error('Erreur sauvegarde client:', error);
            this.showMessage('Erreur lors de la sauvegarde du client', 'error');
        }
    }

    async handleOrderSubmit() {
        const formData = {
            clientId: document.getElementById('order-client').value,
            creationId: document.getElementById('order-creation').value,
            totalAmount: parseFloat(document.getElementById('order-amount').value) || 0,
            amountPaid: parseFloat(document.getElementById('order-paid').value) || 0,
            status: document.getElementById('order-status').value,
            priority: document.getElementById('order-priority').value,
            dueDate: document.getElementById('order-due-date').value,
            notes: document.getElementById('order-notes').value
        };

        try {
            if (this.currentEditingId) {
                await window.app.updateOrder(this.currentEditingId, formData);
                this.showMessage('Commande mise à jour avec succès!', 'success');
            } else {
                await window.app.createNewOrder(formData);
                this.showMessage('Commande créée avec succès!', 'success');
            }
            this.closeModal('order');
        } catch (error) {
            console.error('Erreur sauvegarde commande:', error);
            this.showMessage('Erreur lors de la sauvegarde de la commande', 'error');
        }
    }

    async handlePaymentSubmit() {
        const formData = {
            amount: parseFloat(document.getElementById('payment-amount').value) || 0,
            paymentMethod: document.getElementById('payment-method').value,
            notes: document.getElementById('payment-notes').value
        };

        try {
            const orderId = document.getElementById('payment-order-id').value;
            await window.app.addOrderPayment(orderId, formData);
            this.showMessage('Paiement enregistré avec succès!', 'success');
            this.closeModal('payment');
        } catch (error) {
            console.error('Erreur enregistrement paiement:', error);
            this.showMessage('Erreur lors de l\'enregistrement du paiement', 'error');
        }
    }

    // 3. Ouvrir un modal avec gestion Firebase
    async openModal(type, data = null) {
        console.log(`🔧 modals.js: Ouverture modal ${type}`, data);
        
        // Vérifier l'authentification pour les modals métier
        if (this.requiresAuth(type)) {
            try {
                await this.requireAuthForModal(type);
            } catch (error) {
                console.log(`🔐 modals.js: Auth requise pour ${type} - modal non ouvert`);
                return;
            }
        }

        const modal = document.getElementById(`${type}-modal`);
        if (!modal) {
            console.error(`❌ modals.js: Modal ${type} non trouvé`);
            return;
        }

        // Réinitialiser le formulaire
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            // Réinitialiser les champs cachés
            const hiddenId = form.querySelector('input[type="hidden"]');
            if (hiddenId) hiddenId.value = '';
        }

        // Actions spécifiques selon le type de modal
        switch(type) {
            case 'creation':
                await this.resetCreationModal(data);
                break;
            case 'client':
                await this.resetClientModal(data);
                break;
            case 'order':
                await this.resetOrderModal(data);
                break;
            case 'payment':
                await this.resetPaymentModal(data);
                break;
            case 'image':
                this.resetImageModal(data);
                break;
            case 'confirm':
                this.resetConfirmModal(data);
                break;
        }

        modal.style.display = 'block';
        modal.style.width = '100%';
        document.body.style.overflow = 'hidden'; // Empêcher le scroll
        this.currentEditingId = data?.id || null;

        console.log(`✅ modals.js: Modal ${type} ouvert`);
    }

    // 4. Fermer un modal
    closeModal(type) {
        const modal = document.getElementById(`${type}-modal`);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Rétablir le scroll
            this.currentEditingId = null;
            console.log(`🔧 modals.js: Modal ${type} fermé`);
        }
    }

    // 5. Fermer tous les modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = ''; // Rétablir le scroll
        this.currentEditingId = null;
        console.log('🔧 modals.js: Tous les modals fermés');
    }

    // 6. Réinitialisation spécifique du modal création
    async resetCreationModal(data = null) {
        console.log('🔧 modals.js: Réinitialisation modal création', data);
        
        const preview = document.getElementById('creation-image-preview');
        if (preview) {
            preview.style.display = 'none';
            preview.src = '';
        }

        if (data) {
            // Remplir le formulaire avec les données existantes
            document.getElementById('creation-id').value = data.id;
            document.getElementById('creation-name').value = data.name || '';
            document.getElementById('creation-description').value = data.description || '';
            document.getElementById('creation-category').value = data.category || '';
            document.getElementById('creation-base-cost').value = data.baseCost || '';
            document.getElementById('creation-materials-cost').value = data.materialsCost || '';
            document.getElementById('creation-labor-cost').value = data.laborCost || '';
            
            if (data.imageUrl) {
                preview.src = data.imageUrl;
                preview.style.display = 'block';
            }

            // Calculer et afficher le coût total
            this.updateCreationTotalCost();
        }
    }

    // 7. Réinitialisation spécifique du modal client
    async resetClientModal(data = null) {
        console.log('🔧 modals.js: Réinitialisation modal client', data);
        
        if (data) {
            document.getElementById('client-id').value = data.id;
            document.getElementById('client-firstname').value = data.firstName || '';
            document.getElementById('client-lastname').value = data.lastName || '';
            document.getElementById('client-phone').value = data.phone || '';
            document.getElementById('client-email').value = data.email || '';
            document.getElementById('client-address').value = data.address?.street || '';
            document.getElementById('client-city').value = data.address?.city || '';
            document.getElementById('client-zipcode').value = data.address?.zipCode || '';
            document.getElementById('client-notes').value = data.notes || '';
        }
    }

    // 8. Réinitialisation spécifique du modal commande
    async resetOrderModal(data = null) {
        console.log('🔧 modals.js: Réinitialisation modal commande', data);
        
        await this.renderClientOptions(document.getElementById('order-client'));
        await this.renderCreationOptions(document.getElementById('order-creation'));
        
        if (data) {
            document.getElementById('order-id').value = data.id;
            document.getElementById('order-client').value = data.clientId || '';
            document.getElementById('order-creation').value = data.creationId || '';
            document.getElementById('order-amount').value = data.totalAmount || '';
            document.getElementById('order-paid').value = data.amountPaid || '';
            document.getElementById('order-status').value = data.status || 'pending';
            document.getElementById('order-priority').value = data.priority || 'medium';
            document.getElementById('order-due-date').value = data.dueDate ? data.dueDate.split('T')[0] : '';
            document.getElementById('order-notes').value = data.notes || '';

            // Remplir les mesures client si disponibles
            if (data.clientMeasurements) {
                Object.keys(data.clientMeasurements).forEach(key => {
                    const input = document.getElementById(`measurement-${key}`);
                    if (input) {
                        input.value = data.clientMeasurements[key];
                    }
                });
            }

            this.updateOrderCalculations();
            this.updateClientInfo();
        } else {
            // Nouvelle commande - réinitialiser les valeurs
            document.getElementById('order-amount').value = '';
            document.getElementById('order-paid').value = '0';
            document.getElementById('order-status').value = 'pending';
            document.getElementById('order-priority').value = 'medium';
            document.getElementById('order-due-date').value = '';
            document.getElementById('order-notes').value = '';
        }
    }

    // 9. Réinitialisation spécifique du modal paiement
    async resetPaymentModal(data = null) {
        console.log('🔧 modals.js: Réinitialisation modal paiement', data);
        
        if (data) {
            document.getElementById('payment-order-id').value = data.orderId || data.id;
            document.getElementById('payment-amount').value = data.remainingAmount || '';
            document.getElementById('payment-method').value = data.paymentMethod || 'cash';
            document.getElementById('payment-notes').value = '';
            
            // Afficher les informations de la commande
            await this.displayOrderInfo(data.orderId || data.id);
        }
    }

    // 10. Réinitialisation spécifique du modal image
    resetImageModal(data = null) {
        const imageElement = document.getElementById('modal-image');
        if (imageElement && data) {
            imageElement.src = data.imageUrl;
            imageElement.alt = data.title || 'Image';
        }
    }

    // 11. Réinitialisation spécifique du modal confirmation
    resetConfirmModal(data = null) {
        const messageElement = document.getElementById('confirm-message');
        const confirmButton = document.getElementById('confirm-action');
        
        if (messageElement && data) {
            messageElement.textContent = data.message;
        }
        
        if (confirmButton && data) {
            confirmButton.onclick = data.confirmAction;
            confirmButton.textContent = data.confirmText || 'Confirmer';
        }
    }

    // 12. Mettre à jour le montant automatiquement quand une création est sélectionnée
    async updateOrderAmountFromCreation() {
        const creationSelect = document.getElementById('order-creation');
        const amountInput = document.getElementById('order-amount');
        
        if (creationSelect && amountInput && creationSelect.value) {
            const creationId = creationSelect.value;
            try {
                const creation = await this.getCreationById(creationId);
                
                if (creation) {
                    const totalCost = creation.totalCost || creation.baseCost;
                    amountInput.value = totalCost || '';
                    this.updateOrderCalculations();
                }
            } catch (error) {
                console.error('❌ modals.js: Erreur récupération création:', error);
            }
        }
    }

    // 13. Mettre à jour les informations client
    async updateClientInfo() {
        const clientSelect = document.getElementById('order-client');
        if (clientSelect && clientSelect.value) {
            const clientId = clientSelect.value;
            try {
                const client = await this.getClientById(clientId);
                
                if (client) {
                    // Afficher les informations client dans un élément dédié si disponible
                    const clientInfoElement = document.getElementById('order-client-info');
                    if (clientInfoElement) {
                        clientInfoElement.innerHTML = `
                            <div class="client-info">
                                <strong>${client.firstName} ${client.lastName}</strong><br>
                                ${client.phone ? `📞 ${client.phone}<br>` : ''}
                                ${client.email ? `📧 ${client.email}` : ''}
                            </div>
                        `;
                    }
                }
            } catch (error) {
                console.error('❌ modals.js: Erreur récupération client:', error);
            }
        }
    }

    // 14. Mettre à jour les calculs de commande
    updateOrderCalculations() {
        const amountInput = document.getElementById('order-amount');
        const paidInput = document.getElementById('order-paid');
        const remainingElement = document.getElementById('order-remaining');
        
        if (amountInput && paidInput && remainingElement) {
            const total = parseFloat(amountInput.value) || 0;
            const paid = parseFloat(paidInput.value) || 0;
            const remaining = total - paid;
            
            remainingElement.textContent = this.formatMoney(remaining);
            
            // Changer la couleur selon le montant restant
            if (remaining === 0) {
                remainingElement.style.color = '#27ae60';
            } else if (remaining > 0) {
                remainingElement.style.color = '#e67e22';
            } else {
                remainingElement.style.color = '#e74c3c';
            }
        }
    }

    // 15. Mettre à jour le coût total de création
    updateCreationTotalCost() {
        const baseCost = parseFloat(document.getElementById('creation-base-cost').value) || 0;
        const materialsCost = parseFloat(document.getElementById('creation-materials-cost').value) || 0;
        const laborCost = parseFloat(document.getElementById('creation-labor-cost').value) || 0;
        const totalCost = baseCost + materialsCost + laborCost;
        
        const totalElement = document.getElementById('creation-total-cost');
        if (totalElement) {
            totalElement.textContent = this.formatMoney(totalCost);
        }
    }

    // 16. Remplir les options clients
    async renderClientOptions(selectElement) {
        if (!selectElement) return;
        
        try {
            const clients = await this.getClients();
            selectElement.innerHTML = '<option value="">Sélectionner un client</option>';
            
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = `${client.firstName} ${client.lastName} - ${client.phone || 'Sans téléphone'}`;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('❌ modals.js: Erreur chargement clients:', error);
            selectElement.innerHTML = '<option value="">Erreur chargement clients</option>';
        }
    }

    // 17. Remplir les options créations
    async renderCreationOptions(selectElement) {
        if (!selectElement) return;
        
        try {
            const creations = await this.getCreations();
            selectElement.innerHTML = '<option value="">Sélectionner une création</option>';
            
            creations.forEach(creation => {
                const option = document.createElement('option');
                option.value = creation.id;
                option.textContent = `${creation.name} - ${this.formatMoney(creation.totalCost || creation.baseCost)}`;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('❌ modals.js: Erreur chargement créations:', error);
            selectElement.innerHTML = '<option value="">Erreur chargement créations</option>';
        }
    }

    // 18. Rafraîchir tous les sélecteurs
    async refreshAllSelects() {
        console.log('🔧 modals.js: Rafraîchissement des sélecteurs...');
        
        await this.renderClientOptions(document.getElementById('order-client'));
        await this.renderCreationOptions(document.getElementById('order-creation'));
    }

    // 19. Gestion de l'upload d'image
    handleImageUpload(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('creation-image-preview');
        
        if (!file || !preview) return;
        
        // Vérifications
        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('L\'image est trop volumineuse. Taille maximale: 5MB', 'error');
            event.target.value = '';
            return;
        }
        
        if (!file.type.match('image.*')) {
            this.showMessage('Veuillez sélectionner un fichier image valide', 'error');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.onerror = () => {
            this.showMessage('Erreur lors du chargement de l\'image', 'error');
        };
        reader.readAsDataURL(file);
    }

    // 20. Afficher les détails d'un élément
    async viewDetails(id, type) {
        console.log(`🔧 modals.js: Affichage détails ${type}`, id);
        
        try {
            const data = await this.getItemById(id, type);
            if (!data) {
                this.showMessage('Élément non trouvé', 'error');
                return;
            }

            this.openModal('details', { type, data });
        } catch (error) {
            console.error(`❌ modals.js: Erreur affichage détails ${type}:`, error);
            this.showMessage('Erreur lors du chargement des détails', 'error');
        }
    }

    // Helper methods - Firebase
    async getClients() {
        if (!window.firebaseServices) {
            throw new Error('Firebase services non disponibles');
        }
        return await window.firebaseServices.clients.getClients();
    }

    async getCreations() {
        if (!window.firebaseServices) {
            throw new Error('Firebase services non disponibles');
        }
        return await window.firebaseServices.creations.getCreations();
    }

    async getOrders() {
        if (!window.firebaseServices) {
            throw new Error('Firebase services non disponibles');
        }
        return await window.firebaseServices.orders.getOrders();
    }

    async getItemById(id, type) {
        if (!window.firebaseServices) {
            throw new Error('Firebase services non disponibles');
        }

        switch(type) {
            case 'creation':
                return await window.firebaseServices.creations.getCreation(id);
            case 'client':
                return await window.firebaseServices.clients.getClient(id);
            case 'order':
                return await window.firebaseServices.orders.getOrder(id);
            default:
                return null;
        }
    }

    async getCreationById(id) {
        return await this.getItemById(id, 'creation');
    }

    async getClientById(id) {
        return await this.getItemById(id, 'client');
    }

    async getOrderById(id) {
        return await this.getItemById(id, 'order');
    }

    async requireAuthForModal(modalType) {
        if (!window.firebaseServices) {
            throw new Error('Firebase services non disponibles');
        }
        
        try {
            await window.firebaseServices.requireAuth(this.getModalLabel(modalType));
            return true;
        } catch (error) {
            if (error.message === 'AUTH_REQUIRED') {
                throw error;
            }
            throw new Error(`Erreur d'authentification: ${error.message}`);
        }
    }
    
    /**
     * Gestion des mesures
     */
    async openMeasurementModal(clientId = null, measurementData = null) {
        console.log('📏 modals.js: Ouverture modal mesures');
        
        try {
            await this.requireAuthForModal('measurement');
            
            const modal = document.getElementById('measurement-modal');
            if (!modal) {
                this.createMeasurementModal();
            }
            
            // Rendre le formulaire de mesures
            const formContainer = document.getElementById('measurement-form-container');
            if (formContainer && window.measurementsManager) {
                formContainer.innerHTML = window.measurementsManager.renderMeasurementForm(clientId, measurementData);
                
                // Si pas de clientId spécifique, charger les options clients
                if (!clientId) {
                    await this.renderClientOptions(document.getElementById('measurement-client-select'));
                }
            }
            
            modal.style.display = 'block';
            this.currentEditingId = measurementData?.id || null;
            
        } catch (error) {
            console.error('❌ modals.js: Erreur ouverture modal mesures:', error);
            this.showAuthPrompt('Connectez-vous pour gérer les mesures');
        }
    }
    
    /**
     * Création du modal mesures
     */
    createMeasurementModal() {
        console.log('🔧 modals.js: Création modal mesures');
        
        const modal = document.createElement('div');
        modal.id = 'measurement-modal';
        modal.className = 'modal';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div class="modal-header">
                    <h3>📏 Gestion des Mesures</h3>
                </div>
                <div id="measurement-form-container"></div>
                <div class="modal-footer">
                    <button onclick="modalManager.saveMeasurement()" class="btn-primary">
                        💾 Enregistrer les mesures
                    </button>
                    <button onclick="modalManager.closeModal('measurement')" class="btn-secondary">
                        Annuler
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
    }
    
    /**
     * Sauvegarde des mesures
     */
    async saveMeasurement() {
        try {
            const formData = this.getMeasurementFormData();
            if (!formData) return;
            
            if (this.currentEditingId) {
                // Mise à jour
                await window.measurementsManager.updateMeasurement(this.currentEditingId, formData);
                this.showMessage('Mesures mises à jour avec succès!', 'success');
            } else {
                // Création
                await window.measurementsManager.createMeasurement(formData);
                this.showMessage('Mesures enregistrées avec succès!', 'success');
            }
            
            this.closeModal('measurement');
            
            // Rafraîchir l'affichage si on est dans la section mesures
            if (typeof renderMeasurements === 'function') {
                renderMeasurements();
            }
            
        } catch (error) {
            console.error('❌ modals.js: Erreur sauvegarde mesures:', error);
            this.showMessage('Erreur lors de l\'enregistrement des mesures', 'error');
        }
    }
    
    /**
     * Récupération des données du formulaire mesures
     */
    getMeasurementFormData() {
        const clientId = document.getElementById('measurement-client-id')?.value || 
                        document.getElementById('measurement-client-select')?.value;
        
        if (!clientId) {
            this.showMessage('Veuillez sélectionner un client', 'error');
            return null;
        }
        
        const name = document.getElementById('measurement-name')?.value;
        if (!name) {
            this.showMessage('Veuillez donner un nom à cette prise de mesures', 'error');
            return null;
        }
        
        const measurements = {};
        const standardMeasurements = window.measurementsManager?.getStandardMeasurements() || {};
        
        Object.keys(standardMeasurements).forEach(key => {
            const value = parseFloat(document.getElementById(`measurement-${key}`)?.value);
            if (!isNaN(value)) {
                measurements[key] = value;
            }
        });
        
        return {
            clientId,
            name,
            measurements,
            notes: document.getElementById('measurement-notes')?.value || ''
        };
    }
    
    // Ajouter dans les méthodes d'édition existantes
    async editMeasurement(id) {
        try {
            const measurement = await window.measurementsManager.getMeasurement(id);
            if (measurement) {
                this.openMeasurementModal(measurement.clientId, measurement);
            }
        } catch (error) {
            console.error('❌ modals.js: Erreur édition mesure:', error);
            this.showMessage('Erreur lors du chargement de la mesure', 'error');
        }
    }

    requiresAuth(modalType) {
        const authRequiredModals = ['creation', 'client', 'order', 'payment', 'measurement'];
        return authRequiredModals.includes(modalType);
    }

    getModalLabel(modalType) {
        const labels = {
            'creation': 'ajouter une création',
            'client': 'ajouter un client', 
            'order': 'créer une commande',
            'payment': 'enregistrer un paiement',
            'measurement': 'gérer les mesures'
        };
        return labels[modalType] || 'effectuer cette action';
    }

    showAuthPrompt(message) {
        if (window.app && typeof window.app.showAuthPrompt === 'function') {
            window.app.showAuthPrompt(message);
        } else {
            this.showMessage(message, 'info');
        }
    }

    showMessage(message, type = 'info') {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            console.log(`📢 [${type}]: ${message}`);
            // Fallback basique
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    formatMoney(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XAF'
        }).format(amount);
    }

    async displayOrderInfo(orderId) {
        try {
            const order = await this.getOrderById(orderId);
            const infoElement = document.getElementById('payment-order-info');
            
            if (infoElement && order) {
                const client = await this.getClientById(order.clientId);
                const creation = await this.getCreationById(order.creationId);
                
                infoElement.innerHTML = `
                    <div class="order-info">
                        <h4>Commande #${order.id.slice(-6)}</h4>
                        <p><strong>Client:</strong> ${client ? `${client.firstName} ${client.lastName}` : 'Non trouvé'}</p>
                        <p><strong>Création:</strong> ${creation ? creation.name : 'Non trouvée'}</p>
                        <p><strong>Total:</strong> ${this.formatMoney(order.totalAmount)}</p>
                        <p><strong>Déjà payé:</strong> ${this.formatMoney(order.amountPaid)}</p>
                        <p><strong>Reste à payer:</strong> ${this.formatMoney(order.totalAmount - order.amountPaid)}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ modals.js: Erreur affichage info commande:', error);
        }
    }

    // Méthodes d'édition
    async editCreation(id) {
        try {
            const creation = await this.getCreationById(id);
            if (creation) {
                this.openModal('creation', creation);
            }
        } catch (error) {
            console.error('❌ modals.js: Erreur édition création:', error);
            this.showMessage('Erreur lors du chargement de la création', 'error');
        }
    }

    async editClient(id) {
        try {
            const client = await this.getClientById(id);
            if (client) {
                this.openModal('client', client);
            }
        } catch (error) {
            console.error('❌ modals.js: Erreur édition client:', error);
            this.showMessage('Erreur lors du chargement du client', 'error');
        }
    }

    async editOrder(id) {
        try {
            const order = await this.getOrderById(id);
            if (order) {
                this.openModal('order', order);
            }
        } catch (error) {
            console.error('❌ modals.js: Erreur édition commande:', error);
            this.showMessage('Erreur lors du chargement de la commande', 'error');
        }
    }

    async addPayment(id) {
        try {
            const order = await this.getOrderById(id);
            if (order) {
                this.openModal('payment', order);
            }
        } catch (error) {
            console.error('❌ modals.js: Erreur ouverture modal paiement:', error);
            this.showMessage('Erreur lors du chargement de la commande', 'error');
        }
    }

    // Méthodes de suppression
    async deleteCreation(id) {
        this.showConfirmation(
            'Supprimer cette création ? Cette action est irréversible.',
            async () => {
                try {
                    await this.deleteCreation(id);
                    this.showMessage('Création supprimée avec succès', 'success');
                } catch (error) {
                    console.error('❌ modals.js: Erreur suppression création:', error);
                    this.showMessage('Erreur lors de la suppression', 'error');
                }
            },
            'Supprimer'
        );
    }

    async deleteClient(id) {
        this.showConfirmation(
            'Supprimer ce client ? Cette action est irréversible.',
            async () => {
                try {
                    await this.deleteClient(id);
                    await this.showMessage('Client supprimé avec succès', 'success');
                    await this.closeModal(type);
                } catch (error) {
                    console.error('❌ modals.js: Erreur suppression client:', error);
                    this.showMessage('Erreur lors de la suppression', 'error');
                }
            },
            'Supprimer'
        );
    }

    async deleteOrder(id) {
        this.showConfirmation(
            'Supprimer cette commande ? Cette action est irréversible.',
            async () => {
                try {
                    await window.app.deleteOrder(id);
                    this.showMessage('Commande supprimée avec succès', 'success');
                } catch (error) {
                    console.error('❌ modals.js: Erreur suppression commande:', error);
                    this.showMessage('Erreur lors de la suppression', 'error');
                }
            },
            'Supprimer'
        );
    }

    showConfirmation(message, confirmAction, confirmText = 'Confirmer') {
        this.openModal('confirm', {
            message,
            confirmAction,
            confirmText
        });
    }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 modals.js: DOM chargé - Initialisation Modal Manager');
    
    try {
        window.modalManager = new ModalManager();
        console.log('✅ modals.js: Modal Manager initialisé avec succès');
    } catch (error) {
        console.error('❌ modals.js: Erreur initialisation Modal Manager:', error);
    }
});

// Exposition pour compatibilité
window.setupModalEvents = () => window.modalManager?.setupModalEvents();
window.openModal = (type, data) => window.modalManager?.openModal(type, data);
window.closeModal = (type) => window.modalManager?.closeModal(type);
window.handleImageUpload = (event) => window.modalManager?.handleImageUpload(event);

console.log('✅ modals.js: Prêt - Version Nouvelle Architecture Firebase chargée');
