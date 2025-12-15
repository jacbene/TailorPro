// js/ui/measurements.js - Gestion de l'interface pour les mesures
console.log('📐 measurements.js: Chargement');

/**
 * Affiche le formulaire pour ajouter ou modifier une fiche de mesures.
 * @param {object} [measurement] - La fiche de mesures à modifier (laisser vide pour un ajout).
 * @param {Array} clients - La liste des clients pour le sélecteur.
 */
function showMeasurementForm(measurement, clients) {
    const modal = document.getElementById('form-modal');
    if (!modal) return;

    const isEditing = !!measurement;
    const title = isEditing ? 'Modifier la fiche de mesures' : 'Nouvelle fiche de mesures';
    const buttonText = isEditing ? 'Mettre à jour' : 'Enregistrer';

    // Créer les options pour le sélecteur de client
    const clientOptions = clients
        .map(c => `<option value="${c.id}" ${isEditing && measurement.clientId === c.id ? 'selected' : ''}>${c.firstName} ${c.lastName}</option>`)
        .join('');

    // Définir les champs de mesures
    const measureFields = [
        'tourDePoitrine', 'tourDeTaille', 'tourDeHanches', 'longueurEpaule', 
        'longueurManche', 'tourDeBras', 'longueurDos', 'longueurPantalon', 
        'tourDeCuisse', 'tourDeGenou', 'tourDeCheville'
    ];
    
    // Générer les inputs pour chaque mesure
    const measureInputs = measureFields.map(field => `
        <div class="form-group">
            <label for="measurement-${field}">${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
            <input type="number" id="measurement-${field}" name="${field}" value="${isEditing && measurement.measures ? (measurement.measures[field] || '') : ''}" class="form-control" placeholder="cm">
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn" onclick="window.app.hideFormModal()">&times;</span>
            <h2>${title}</h2>
            <form id="measurement-form">
                <input type="hidden" id="measurement-id" value="${isEditing ? measurement.id : ''}">
                
                <div class="form-group">
                    <label for="measurement-client">Client</label>
                    <select id="measurement-client" name="clientId" class="form-control" ${isEditing ? 'disabled' : ''}>
                        <option value="">Sélectionner un client</option>
                        ${clientOptions}
                    </select>
                </div>

                <div class="measurements-grid">
                    ${measureInputs}
                </div>
                
                <div class="form-group">
                    <label for="measurement-notes">Notes</label>
                    <textarea id="measurement-notes" name="notes" class="form-control">${isEditing ? (measurement.notes || '') : ''}</textarea>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">${buttonText}</button>
                    <button type="button" class="btn btn-secondary" onclick="window.app.hideFormModal()">Annuler</button>
                </div>
            </form>
        </div>
    `;

    modal.style.display = 'block';

    // Attacher le gestionnaire de soumission
    document.getElementById('measurement-form').addEventListener('submit', handleMeasurementFormSubmit);
}

/**
 * Gère la soumission du formulaire de mesures.
 * @param {Event} event - L'événement de soumission.
 */
async function handleMeasurementFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const id = form.querySelector('#measurement-id').value;
    const isEditing = !!id;

    const measures = {};
    const measureInputs = form.querySelectorAll('.measurements-grid input');
    measureInputs.forEach(input => {
        if (input.value) {
            measures[input.name] = parseFloat(input.value);
        }
    });

    const data = {
        clientId: form.querySelector('#measurement-client').value,
        notes: form.querySelector('#measurement-notes').value,
        measures: measures,
        // La date est ajoutée côté service pour la création
    };

    if (!data.clientId) {
        window.app.showNotification('Veuillez sélectionner un client.', 'error');
        return;
    }

    try {
        const user = window.firebaseServices.auth.currentUser;
        if (!user) throw new Error("Utilisateur non authentifié.");

        if (isEditing) {
            await window.firebaseServices.measurements.updateDocument(user.uid, id, data);
            window.app.showNotification('Fiche de mesures mise à jour avec succès.', 'success');
        } else {
            await window.firebaseServices.measurements.addDocument(user.uid, data);
            window.app.showNotification('Fiche de mesures ajoutée avec succès.', 'success');
        }
        
        window.app.hideFormModal();
        window.app.showTab('measurements'); // Recharger l'onglet pour voir les changements

    } catch (error) {
        console.error('❌ Erreur sauvegarde fiche mesures:', error);
        window.app.showNotification('Erreur lors de la sauvegarde.', 'error');
    }
}

/**
 * Affiche les détails d'une fiche de mesures.
 * @param {object} measurement - La fiche de mesures à afficher.
 * @param {object} client - Le client associé.
 */
function showMeasurementDetails(measurement, client) {
    const modal = document.getElementById('details-modal');
    if (!modal) return;
    
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Client inconnu';
    const date = measurement.createdAt ? new Date(measurement.createdAt.seconds * 1000).toLocaleDateString() : 'Date inconnue';

    const measuresList = Object.entries(measurement.measures || {})
        .map(([key, value]) => `<li><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${value} cm</li>`)
        .join('');

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn" onclick="window.app.hideDetailsModal()">&times;</span>
            <h2>Détails des Mesures</h2>
            <div class="details-content">
                <p><strong>Client :</strong> ${clientName}</p>
                <p><strong>Date :</strong> ${date}</p>
                <h3>Mesures :</h3>
                <ul class="measures-detail-list">
                    ${measuresList || '<li>Aucune mesure renseignée.</li>'}
                </ul>
                <h3>Notes :</h3>
                <p>${measurement.notes || 'Aucune note.'}</p>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

/**
 * Gère les actions sur les fiches de mesures (voir, modifier, supprimer).
 * @param {Event} event - L'événement de clic.
 */
async function handleMeasurementActions(event) {
    const action = event.target.dataset.action;
    const type = event.target.dataset.type;

    if (type !== 'measurement') return;

    const user = window.firebaseServices.auth.currentUser;
    if (!user) return;

    const measurementId = event.target.dataset.id;

    try {
        if (action === 'delete') {
            const confirmed = await window.uiComponents.showConfirmation({
                title: 'Supprimer la fiche ?',
                message: 'Cette action est irréversible.',
                confirmText: 'Supprimer',
                type: 'danger'
            });
            if (confirmed) {
                await window.firebaseServices.measurements.deleteDocument(user.uid, measurementId);
                window.app.showNotification('Fiche de mesures supprimée.', 'success');
                window.app.showTab('measurements');
            }
        } else if (action === 'edit' || action === 'view') {
            const [measurement, clients] = await Promise.all([
                window.firebaseServices.measurements.getDocument(user.uid, measurementId),
                window.firebaseServices.clients.getAllDocuments(user.uid)
            ]);

            if (action === 'edit') {
                showMeasurementForm(measurement, clients);
            } else {
                const client = clients.find(c => c.id === measurement.clientId);
                showMeasurementDetails(measurement, client);
            }
        } else if (action === 'add') {
             const clients = await window.firebaseServices.clients.getAllDocuments(user.uid);
             showMeasurementForm(null, clients);
        }
    } catch (error) {
        console.error(`❌ Erreur action '${action}' sur fiche mesures:`, error);
        window.app.showNotification('Une erreur est survenue.', 'error');
    }
}

// Exposer les fonctions nécessaires
window.measurementsUI = {
    showMeasurementForm,
    handleMeasurementActions,
    showMeasurementDetails
};

console.log('✅ measurements.js: Prêt');