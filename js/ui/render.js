// render.js - Fonctions de rendu pour l'interface utilisateur (version optimisée)

// Rendu du tableau de bord (avec données pré-chargées)
function renderDashboard(data) {
    const { orders = [], clients = [], creations = [] } = data;
    try {
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

        document.getElementById('orders-count').textContent = activeOrders.length;
        document.getElementById('month-revenue').textContent = formatCurrency(monthlyRevenue);
        document.getElementById('amounts-due').textContent = formatCurrency(totalDue);
        document.getElementById('clients-count').textContent = clients.length;

        const recentOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        renderRecentOrders(recentOrders, clients, creations);

    } catch (error) {
        console.error('❌ render.js: Erreur rendu dashboard:', error);
    }
}

// Rendu des commandes récentes
function renderRecentOrders(orders, clients, creations) {
    const tbody = document.getElementById('recent-orders');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center empty-state"><div class="premium-placeholder"><p>Aucune commande récente</p><button onclick="app.showTab('orders')" class="btn-secondary">Créer une commande</button></div></td></tr>`;
        return;
    }
    orders.forEach(order => {
        const client = clients.find(c => c.id === order.clientId);
        const creation = creations.find(c => c.id === order.creationId);
        const remaining = order.remainingAmount || (order.totalAmount - (order.amountPaid || 0));
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client ? `${client.firstName} ${client.lastName}` : 'Client inconnu'}</td>
            <td>${creation ? creation.name : 'Création inconnue'}</td>
            <td>${formatCurrency(order.totalAmount)}</td>
            <td>${formatCurrency(order.amountPaid || 0)}</td>
            <td class="${remaining > 0 ? 'text-warning' : 'text-success'}">${formatCurrency(remaining)}</td>
            <td><span class="status-badge status-${getStatusClass(order.status)}">${getStatusText(order.status)}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Rendu de la grille des créations (avec données pré-chargées)
function renderCreations(containerId, options = {}, creations = []) {
    const grid = document.getElementById(containerId);
    if (!grid) {
        console.error(`❌ render.js: Conteneur '${containerId}' non trouvé.`);
        return;
    }
    grid.innerHTML = '';
    if (creations.length === 0) {
        grid.innerHTML = `<div class="premium-placeholder"><h3>👗 Votre catalogue est vide</h3><p>Ajoutez vos modèles pour les proposer à vos clients.</p><button onclick="window.modalManager.openModal('creation')" class="btn-primary">Ajouter une création</button></div>`;
        return;
    }
    const finalOptions = { showDescription: true, showPrice: true, showActions: true, ...options };
    creations.forEach(creation => {
        const creationCard = document.createElement('div');
        creationCard.className = 'creation-card';
        creationCard.innerHTML = `
            <div class="creation-image">${creation.imageUrl ? `<img src="${creation.imageUrl}" alt="${creation.name}" loading="lazy" data-image="${creation.imageUrl}">` : '<div class="no-image">👗</div>'}</div>
            <div class="creation-info">
                <h4>${creation.name}</h4>
                ${finalOptions.showDescription ? `<p class="creation-description">${creation.description || 'Aucune description'}</p>` : ''}
                <div class="creation-category">${creation.category || 'Non catégorisé'}</div>
                ${finalOptions.showPrice ? `<div class="creation-price">${formatCurrency(creation.totalCost || creation.baseCost)}</div>` : ''}
            </div>
            ${finalOptions.showActions ? `<div class="creation-actions"><button class="btn btn-sm btn-outline edit-creation" data-id="${creation.id}">Modifier</button><button class="btn btn-sm btn-danger delete-creation" data-id="${creation.id}">Supprimer</button></div>` : ''}
        `;
        grid.appendChild(creationCard);
    });
    attachImagePreviewListeners();
}

// Rendu de la liste des clients (avec données pré-chargées)
function renderClients(clients = []) {
    const tbody = document.getElementById('clients-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center empty-state"><div class="premium-placeholder"><p>Aucun client enregistré</p><button onclick="window.modalManager.openModal('client')" class="btn-secondary">Ajouter un client</button></div></td></tr>`;
        return;
    }
    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.lastName || ''}</td>
            <td>${client.firstName || ''}</td>
            <td>${client.phone || 'Non renseigné'}</td>
            <td>${client.email || 'Non renseigné'}</td>
            <td><button class="btn btn-sm btn-outline edit-client" data-id="${client.id}">Modifier</button><button class="btn btn-sm btn-danger delete-client" data-id="${client.id}">Supprimer</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Rendu de la liste des commandes (avec données pré-chargées)
function renderOrders(data) {
    const { orders = [], clients = [], creations = [] } = data;
    const tbody = document.getElementById('orders-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center empty-state"><div class="premium-placeholder"><p>Aucune commande enregistrée</p><button onclick="window.modalManager.openModal('order')" class="btn-secondary">Créer une commande</button></div></td></tr>`;
        return;
    }
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    sortedOrders.forEach(order => {
        const client = clients.find(c => c.id === order.clientId);
        const creation = creations.find(c => c.id === order.creationId);
        const remaining = order.remainingAmount || (order.totalAmount - (order.amountPaid || 0));
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client ? `${client.firstName} ${client.lastName}` : 'Client inconnu'}</td>
            <td>${creation ? creation.name : 'Création inconnue'}</td>
            <td>${formatDate(order.createdAt)}</td>
            <td>${formatCurrency(order.totalAmount)}</td>
            <td>${formatCurrency(order.amountPaid || 0)}</td>
            <td class="${remaining > 0 ? 'text-warning' : 'text-success'}">${formatCurrency(remaining)}</td>
            <td><span class="status-badge status-${getStatusClass(order.status)}">${getStatusText(order.status)}</span></td>
            <td><button class="btn btn-sm btn-outline add-payment" data-id="${order.id}">Paiement</button><button class="btn btn-sm btn-outline edit-order" data-id="${order.id}">Modifier</button><button class="btn btn-sm btn-danger delete-order" data-id="${order.id}">Supprimer</button></td>
        `;
        tbody.appendChild(row);
    });
}

// --- Le reste des fonctions (utilitaires, options de select, etc.) reste inchangé pour le moment --- 

// NOTE: Les fonctions `renderClientOptions` et `renderCreationOptions` continuent de fetcher leurs propres données
// pour ne pas casser la logique des modales. Cela pourra être optimisé plus tard si nécessaire.

async function getFirebaseData(service) {
    if (!window.firebaseServices?.[service]?.[`get${service.charAt(0).toUpperCase() + service.slice(1)}s`]) return [];
    try {
        return await window.firebaseServices[service][`get${service.charAt(0).toUpperCase() + service.slice(1)}s`]() || [];
    } catch (error) {
        console.error(`❌ Erreur récupération ${service}:`, error);
        return [];
    }
}

async function renderClientOptions(selectElement) {
    if (!selectElement) return;
    try {
        const clients = await getFirebaseData('client');
        selectElement.innerHTML = '<option value="">Sélectionner un client</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.firstName} ${client.lastName}`;
            selectElement.appendChild(option);
        });
    } catch (error) {
        selectElement.innerHTML = '<option value="">Erreur chargement</option>';
    }
}

async function renderCreationOptions(selectElement) {
    if (!selectElement) return;
    try {
        const creations = await getFirebaseData('creation');
        selectElement.innerHTML = '<option value="">Sélectionner une création</option>';
        creations.forEach(creation => {
            const option = document.createElement('option');
            option.value = creation.id;
            option.textContent = `${creation.name} - ${formatCurrency(creation.totalCost || creation.baseCost)}`;
            selectElement.appendChild(option);
        });
    } catch (error) {
        selectElement.innerHTML = '<option value="">Erreur chargement</option>';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (e) { return 'Date invalide'; }
}

function getStatusClass(status) {
    const classes = { pending: 'pending', in_progress: 'progress', completed: 'completed', delivered: 'delivered', paid: 'completed', cancelled: 'cancelled' };
    return classes[status] || 'pending';
}

function getStatusText(status) {
    const texts = { pending: 'En attente', in_progress: 'En cours', completed: 'Terminée', delivered: 'Livrée', paid: 'Payée', cancelled: 'Annulée' };
    return texts[status] || status;
}

function attachImagePreviewListeners() {
    document.querySelectorAll('.creation-image img').forEach(img => {
        img.addEventListener('click', function() {
            const imageModal = document.getElementById('image-modal');
            const fullSizeImage = document.getElementById('full-size-image');
            if (imageModal && fullSizeImage) {
                fullSizeImage.src = this.dataset.image || this.src;
                imageModal.style.display = 'flex';
            }
        });
    });
}

function showNotification(message, type = 'info') {
    // ... (la fonction de notification reste la même)
}

console.log('✅ render.js: Module de rendu optimisé chargé.');