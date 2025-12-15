// render.js - Fonctions de rendu pour l'interface utilisateur avec Firebase

// Rendu du tableau de bord
async function renderDashboard() {
    try {
        // Récupérer les données depuis Firebase
        const [orders, clients, creations] = await Promise.all([
            getOrders(),
            getClients(),
            getCreations()
        ]);
        
        // Calcul des statistiques
        const activeOrders = orders.filter(order => order.status === 'pending' || order.status === 'in_progress');
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyRevenue = orders
            .filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
            })
            .reduce((sum, order) => sum + (order.amountPaid || 0), 0);
        
        const totalDue = orders.reduce((sum, order) => {
            const remaining = order.remainingAmount || (order.totalAmount - (order.amountPaid || 0));
            return sum + Math.max(0, remaining);
        }, 0);
        
        // Mise à jour des statistiques
        document.getElementById('orders-count').textContent = activeOrders.length;
        document.getElementById('month-revenue').textContent = formatCurrency(monthlyRevenue);
        document.getElementById('amounts-due').textContent = formatCurrency(totalDue);
        document.getElementById('clients-count').textContent = clients.length;
        
        // Commandes récentes (5 dernières)
        const recentOrders = orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        renderRecentOrders(recentOrders, clients, creations);
        
    } catch (error) {
        console.error('❌ render.js: Erreur rendu dashboard:', error);
        showNotification('Erreur lors du chargement du tableau de bord', 'error');
    }
}

// Rendu des commandes récentes
function renderRecentOrders(orders, clients, creations) {
    const tbody = document.getElementById('recent-orders');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center empty-state">
                    <div class="premium-placeholder">
                        <p>Aucune commande récente</p>
                        <button onclick="app.showSection('orders')" class="btn-secondary">
                            Créer votre première commande
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const client = clients.find(c => c.id === order.clientId);
        const creation = creations.find(c => c.id === order.creationId);
        const remaining = order.remainingAmount || (order.totalAmount - (order.amountPaid || 0));
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client ? client.fullName : 'Client inconnu'}</td>
            <td>${creation ? creation.name : 'Création inconnue'}</td>
            <td>${formatCurrency(order.totalAmount)}</td>
            <td>${formatCurrency(order.amountPaid || 0)}</td>
            <td class="${remaining > 0 ? 'text-warning' : 'text-success'}">${formatCurrency(remaining)}</td>
            <td><span class="status-badge status-${getStatusClass(order.status)}">${getStatusText(order.status)}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Rendu de la grille des créations
async function renderCreations() {
    try {
        const creations = await getCreations();
        const grid = document.getElementById('creations-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (creations.length === 0) {
            grid.innerHTML = `
                <div class="premium-placeholder">
                    <h3>👗 Votre catalogue de créations</h3>
                    <p>Ajoutez vos modèles et créations pour les proposer à vos clients</p>
                    <button onclick="app.openModal('creation')" class="btn-primary">
                        Ajouter votre première création
                    </button>
                </div>
            `;
            return;
        }
        
        creations.forEach(creation => {
            const creationCard = document.createElement('div');
            creationCard.className = 'creation-card';
            creationCard.innerHTML = `
                <div class="creation-image">
                    ${creation.imageUrl ? 
                        `<img src="${creation.imageUrl}" alt="${creation.name}" loading="lazy" data-image="${creation.imageUrl}">` : 
                        '<div class="no-image">👗</div>'
                    }
                </div>
                <div class="creation-info">
                    <h4>${creation.name}</h4>
                    <p class="creation-description">${creation.description || 'Aucune description'}</p>
                    <div class="creation-category">${creation.category || 'Non catégorisé'}</div>
                    <div class="creation-price">${formatCurrency(creation.totalCost || creation.baseCost)}</div>
                </div>
                <div class="creation-actions">
                    <button class="btn btn-sm btn-outline edit-creation" data-id="${creation.id}">Modifier</button>
                    <button class="btn btn-sm btn-danger delete-creation" data-id="${creation.id}">Supprimer</button>
                </div>
            `;
            grid.appendChild(creationCard);
        });
        
        // Ajout des écouteurs d'événements pour les images
        attachImagePreviewListeners();
        
    } catch (error) {
        console.error('❌ render.js: Erreur rendu créations:', error);
        showNotification('Erreur lors du chargement des créations', 'error');
    }
}

// Rendu de la liste des clients
async function renderClients() {
    try {
        const clients = await getClients();
        const tbody = document.getElementById('clients-list');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center empty-state">
                        <div class="premium-placeholder">
                            <p>Aucun client enregistré</p>
                            <button onclick="app.openModal('client')" class="btn-secondary">
                                Ajouter votre premier client
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        clients.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.lastName || ''}</td>
                <td>${client.firstName || ''}</td>
                <td>${client.phone || 'Non renseigné'}</td>
                <td>${client.email || 'Non renseigné'}</td>
                <td>
                    <button class="btn btn-sm btn-outline edit-client" data-id="${client.id}">Modifier</button>
                    <button class="btn btn-sm btn-danger delete-client" data-id="${client.id}">Supprimer</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('❌ render.js: Erreur rendu clients:', error);
        showNotification('Erreur lors du chargement des clients', 'error');
    }
}

// Rendu de la liste des commandes
async function renderOrders() {
    try {
        const [orders, clients, creations] = await Promise.all([
            getOrders(),
            getClients(),
            getCreations()
        ]);
        
        const tbody = document.getElementById('orders-list');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center empty-state">
                        <div class="premium-placeholder">
                            <p>Aucune commande enregistrée</p>
                            <button onclick="app.openModal('order')" class="btn-secondary">
                                Créer votre première commande
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Tri par date (plus récent en premier)
        const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        sortedOrders.forEach(order => {
            const client = clients.find(c => c.id === order.clientId);
            const creation = creations.find(c => c.id === order.creationId);
            const remaining = order.remainingAmount || (order.totalAmount - (order.amountPaid || 0));
            const formattedDate = formatDate(order.createdAt);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client ? client.fullName : 'Client inconnu'}</td>
                <td>${creation ? creation.name : 'Création inconnue'}</td>
                <td>${formattedDate}</td>
                <td>${formatCurrency(order.totalAmount)}</td>
                <td>${formatCurrency(order.amountPaid || 0)}</td>
                <td class="${remaining > 0 ? 'text-warning' : 'text-success'}">${formatCurrency(remaining)}</td>
                <td><span class="status-badge status-${getStatusClass(order.status)}">${getStatusText(order.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline add-payment" data-id="${order.id}">Paiement</button>
                    <button class="btn btn-sm btn-outline edit-order" data-id="${order.id}">Modifier</button>
                    <button class="btn btn-sm btn-danger delete-order" data-id="${order.id}">Supprimer</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('❌ render.js: Erreur rendu commandes:', error);
        showNotification('Erreur lors du chargement des commandes', 'error');
    }
}

// Rendu des options clients pour les sélecteurs
async function renderClientOptions(selectElement) {
    if (!selectElement) return;
    
    try {
        const clients = await getClients();
        selectElement.innerHTML = '<option value="">Sélectionner un client</option>';
        
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.firstName} ${client.lastName} - ${client.phone || 'Sans téléphone'}`;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('❌ render.js: Erreur rendu options clients:', error);
        selectElement.innerHTML = '<option value="">Erreur chargement clients</option>';
    }
}

// Rendu des options créations pour les sélecteurs
async function renderCreationOptions(selectElement) {
    if (!selectElement) return;
    
    try {
        const creations = await getCreations();
        selectElement.innerHTML = '<option value="">Sélectionner une création</option>';
        
        creations.forEach(creation => {
            const option = document.createElement('option');
            option.value = creation.id;
            option.textContent = `${creation.name} - ${formatCurrency(creation.totalCost || creation.baseCost)}`;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('❌ render.js: Erreur rendu options créations:', error);
        selectElement.innerHTML = '<option value="">Erreur chargement créations</option>';
    }
}

// Rendu du statut cloud
function renderCloudStatus(connected, message = '') {
    const statusElement = document.getElementById('cloud-status');
    const statusText = document.getElementById('cloud-status-text');
    
    if (!statusElement || !statusText) return;
    
    if (connected) {
        statusElement.className = 'cloud-status cloud-connected';
        statusText.textContent = message || 'Connecté au cloud';
    } else {
        statusElement.className = 'cloud-status cloud-disconnected';
        statusText.textContent = message || 'Déconnecté du cloud';
    }
}

// Rendu des informations de sauvegarde
function renderBackupInfo(lastBackup) {
    const backupInfo = document.getElementById('backup-info');
    if (!backupInfo) return;
    
    if (lastBackup) {
        const date = new Date(lastBackup);
        backupInfo.textContent = `Dernier snapshot: ${date.toLocaleString('fr-FR')}`;
    } else {
        backupInfo.textContent = 'Aucun snapshot créé';
    }
}

// Rendu du statut des collections métier
function renderCollectionsStatus(collectionsReady = false) {
    const statusPanel = document.getElementById('collections-status-panel');
    const headerStatus = document.getElementById('collections-status');
    
    if (!statusPanel || !headerStatus) return;
    
    if (collectionsReady) {
        headerStatus.style.display = 'block';
        statusPanel.innerHTML = `
            <div class="collection-status">
                <span class="status-indicator active"></span>
                <span>Collection Clients</span>
                <span class="status-badge status-completed">Active</span>
            </div>
            <div class="collection-status">
                <span class="status-indicator active"></span>
                <span>Collection Créations</span>
                <span class="status-badge status-completed">Active</span>
            </div>
            <div class="collection-status">
                <span class="status-indicator active"></span>
                <span>Collection Commandes</span>
                <span class="status-badge status-completed">Active</span>
            </div>
        `;
    } else {
        headerStatus.style.display = 'none';
        statusPanel.innerHTML = `
            <div class="collection-status">
                <span class="status-indicator"></span>
                <span>Collection Clients</span>
                <span class="status-badge status-pending">En attente</span>
            </div>
            <div class="collection-status">
                <span class="status-indicator"></span>
                <span>Collection Créations</span>
                <span class="status-badge status-pending">En attente</span>
            </div>
            <div class="collection-status">
                <span class="status-indicator"></span>
                <span>Collection Commandes</span>
                <span class="status-badge status-pending">En attente</span>
            </div>
        `;
    }
}

/**
 * Rendu des mesures client
 */
async function renderMeasurements(clientId = null) {
    try {
        if (!window.measurementsManager) {
            console.warn('⚠️ render.js: Module mesures non disponible');
            return;
        }
        
        const measurements = clientId ? 
            await window.measurementsManager.getClientMeasurements(clientId) : 
            await this.getAllMeasurements();
            
        const container = document.getElementById('measurements-container');
        if (!container) return;
        
        if (measurements.length === 0) {
            container.innerHTML = `
                <div class="premium-placeholder">
                    <h3>📏 Aucune mesure enregistrée</h3>
                    <p>Commencez par prendre les mesures de vos clients</p>
                    <button onclick="modalManager.openMeasurementModal('${clientId || ''}')" class="btn-primary">
                        Prendre les premières mesures
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = measurements.map(measurement => `
            <div class="measurement-card">
                <div class="measurement-header">
                    <h4>${measurement.name}</h4>
                    <span class="measurement-date">${formatDate(measurement.createdAt)}</span>
                </div>
                <div class="measurement-content">
                    <div class="measurement-preview">
                        ${Object.entries(measurement.measurements).slice(0, 5).map(([key, value]) => `
                            <div class="measurement-item">
                                <span class="measurement-label">${window.measurementsManager?.getStandardMeasurements()[key] || key}:</span>
                                <span class="measurement-value">${value} cm</span>
                            </div>
                        `).join('')}
                        ${Object.keys(measurement.measurements).length > 5 ? 
                            `<div class="more-measurements">+${Object.keys(measurement.measurements).length - 5} autres mesures</div>` : ''}
                    </div>
                    ${measurement.notes ? `
                        <div class="measurement-notes">
                            <strong>Notes:</strong> ${measurement.notes}
                        </div>
                    ` : ''}
                </div>
                <div class="measurement-actions">
                    <button class="btn btn-sm btn-outline" onclick="modalManager.editMeasurement('${measurement.id}')">
                        Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="modalManager.deleteMeasurement('${measurement.id}')">
                        Supprimer
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ render.js: Erreur rendu mesures:', error);
    }
}

/**
 * Rendu du tableau de bord financier
 */
async function renderFinancialDashboard() {
    try {
        if (!window.billingManager) {
            console.warn('⚠️ render.js: Module facturation non disponible');
            return;
        }
        
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const report = await window.billingManager.getFinancialReport(
            firstDayOfMonth.toISOString(),
            lastDayOfMonth.toISOString()
        );
        
        const container = document.getElementById('finances-section');
        if (!container) return;
        
        container.innerHTML = `
            <div class="financial-overview">
                <div class="financial-stats">
                    <div class="stat-card revenue">
                        <div class="stat-label">Revenu du mois</div>
                        <div class="stat-number">${formatCurrency(report.summary.totalRevenue)}</div>
                    </div>
                    <div class="stat-card orders">
                        <div class="stat-label">Commandes</div>
                        <div class="stat-number">${report.summary.totalOrders}</div>
                    </div>
                    <div class="stat-card pending">
                        <div class="stat-label">En attente</div>
                        <div class="stat-number">${formatCurrency(report.summary.totalPending)}</div>
                    </div>
                    <div class="stat-card average">
                        <div class="stat-label">Moyenne/commande</div>
                        <div class="stat-number">${formatCurrency(report.summary.averageOrderValue)}</div>
                    </div>
                </div>
                
                <div class="financial-actions">
                    <button class="btn-primary" onclick="generateMonthlyReport()">
                        📊 Rapport détaillé
                    </button>
                    <button class="btn-secondary" onclick="viewAllInvoices()">
                        🧾 Voir les factures
                    </button>
                </div>
                
                <div class="revenue-breakdown">
                    <h4>Répartition par statut</h4>
                    <div class="status-breakdown">
                        ${Object.entries(report.ordersByStatus).map(([status, count]) => `
                            <div class="status-item">
                                <span class="status-label">${getStatusText(status)}:</span>
                                <span class="status-count">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ render.js: Erreur rendu dashboard financier:', error);
    }
}

// Nouvelle fonction pour obtenir toutes les mesures
async function getAllMeasurements() {
    if (!window.measurementsManager) return [];
    
    // Implémentation simplifiée - dans une vraie app, il faudrait paginer
    const allClients = await getClients();
    let allMeasurements = [];
    
    for (const client of allClients) {
        const clientMeasurements = await window.measurementsManager.getClientMeasurements(client.id);
        allMeasurements = allMeasurements.concat(clientMeasurements);
    }
    
    return allMeasurements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Fonctions utilitaires de formatage
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    } catch (error) {
        return 'Date invalide';
    }
}

function getStatusClass(status) {
    const statusClasses = {
        'pending': 'pending',
        'in_progress': 'progress',
        'completed': 'completed',
        'delivered': 'delivered',
        'paid': 'completed',
        'cancelled': 'cancelled'
    };
    return statusClasses[status] || 'pending';
}

function getStatusText(status) {
    const statusTexts = {
        'pending': 'En attente',
        'in_progress': 'En cours',
        'completed': 'Terminée',
        'delivered': 'Livrée',
        'paid': 'Payée',
        'cancelled': 'Annulée'
    };
    return statusTexts[status] || status;
}

// Attacher les écouteurs d'événements pour l'aperçu des images
function attachImagePreviewListeners() {
    document.querySelectorAll('.creation-image img').forEach(img => {
        img.addEventListener('click', function() {
            const fullSizeImage = document.getElementById('full-size-image');
            const imageModal = document.getElementById('image-modal');
            
            if (fullSizeImage && imageModal) {
                fullSizeImage.src = this.getAttribute('data-image') || this.src;
                imageModal.style.display = 'block';
            }
        });
    });
}

// Fonctions de récupération des données via Firebase Services
async function getOrders() {
    if (!window.firebaseServices) {
        console.warn('⚠️ render.js: Firebase services non disponibles');
        return [];
    }
    
    try {
        return await window.firebaseServices.orders.getOrders() || [];
    } catch (error) {
        console.error('❌ render.js: Erreur récupération commandes:', error);
        return [];
    }
}

async function getClients() {
    if (!window.firebaseServices) {
        console.warn('⚠️ render.js: Firebase services non disponibles');
        return [];
    }
    
    try {
        return await window.firebaseServices.clients.getClients() || [];
    } catch (error) {
        console.error('❌ render.js: Erreur récupération clients:', error);
        return [];
    }
}

async function getCreations() {
    if (!window.firebaseServices) {
        console.warn('⚠️ render.js: Firebase services non disponibles');
        return [];
    }
    
    try {
        return await window.firebaseServices.creations.getCreations() || [];
    } catch (error) {
        console.error('❌ render.js: Erreur récupération créations:', error);
        return [];
    }
}

/**
 * Affiche une notification (toast) à l'écran.
 * @param {string} message Le message à afficher.
 * @param {string} type Le type de notification ('success', 'error', 'info').
 */
function showNotification(message, type = 'info') {
    // Crée un conteneur pour les notifications s'il n'existe pas
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    
    // Styles par défaut et par type
    let backgroundColor, borderColor, textColor;
    switch (type) {
        case 'success':
            backgroundColor = '#d4edda';
            borderColor = '#c3e6cb';
            textColor = '#155724';
            break;
        case 'error':
            backgroundColor = '#f8d7da';
            borderColor = '#f5c6cb';
            textColor = '#721c24';
            break;
        default: // 'info'
            backgroundColor = '#d1ecf1';
            borderColor = '#bee5eb';
            textColor = '#0c5460';
            break;
    }

    notification.style.cssText = `
        background-color: ${backgroundColor};
        border: 1px solid ${borderColor};
        color: ${textColor};
        padding: 15px;
        border-radius: 8px;
        min-width: 250px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transform: translateX(100%);
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    
    notification.innerHTML = `
        <span>${message}</span>
        <button style="background:none; border:none; font-size:1.2em; cursor:pointer; color:inherit; margin-left:auto; padding:0 5px;" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(notification);

    // Animation d'apparition
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Disparition et suppression automatiques après 5 secondes
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Export des fonctions pour une utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderDashboard,
        renderRecentOrders,
        renderCreations,
        renderClients,
        renderOrders,
        renderClientOptions,
        renderCreationOptions,
        renderCloudStatus,
        renderBackupInfo,
        renderCollectionsStatus,
        formatCurrency,
        formatDate,
        getStatusClass,
        getStatusText,
        showNotification,
        getOrders,
        getClients,
        getCreations
    };
}

console.log('✅ render.js: Module de rendu initialisé avec Firebase');