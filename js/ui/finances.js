// js/ui/finances.js - Gestion de l'interface pour les finances
console.log('💰 finances.js: Chargement');

/**
 * Affiche le formulaire pour une transaction.
 * @param {object} [transaction] - La transaction à modifier.
 */
function showTransactionForm(transaction) {
    const modal = document.getElementById('form-modal');
    if (!modal) return;

    const isEditing = !!transaction;
    const title = isEditing ? 'Modifier la transaction' : 'Nouvelle transaction';
    const buttonText = isEditing ? 'Mettre à jour' : 'Enregistrer';

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn" onclick="window.app.hideFormModal()">&times;</span>
            <h2>${title}</h2>
            <form id="transaction-form">
                <input type="hidden" id="transaction-id" value="${isEditing ? transaction.id : ''}">
                
                <div class="form-group">
                    <label for="transaction-type">Type</label>
                    <select id="transaction-type" name="type" class="form-control">
                        <option value="revenu" ${isEditing && transaction.type === 'revenu' ? 'selected' : ''}>Revenu</option>
                        <option value="depense" ${isEditing && transaction.type === 'depense' ? 'selected' : ''}>Dépense</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="transaction-description">Description</label>
                    <input type="text" id="transaction-description" name="description" value="${isEditing ? transaction.description : ''}" class="form-control" required>
                </div>

                <div class="form-group">
                    <label for="transaction-amount">Montant</label>
                    <input type="number" id="transaction-amount" name="amount" value="${isEditing ? transaction.amount : ''}" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="transaction-date">Date</label>
                    <input type="date" id="transaction-date" name="date" value="${isEditing ? new Date(transaction.date.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" class="form-control" required>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">${buttonText}</button>
                    <button type="button" class="btn btn-secondary" onclick="window.app.hideFormModal()">Annuler</button>
                </div>
            </form>
        </div>
    `;

    modal.style.display = 'block';
    document.getElementById('transaction-form').addEventListener('submit', handleTransactionFormSubmit);
}

/**
 * Gère la soumission du formulaire de transaction.
 * @param {Event} event - L'événement de soumission.
 */
async function handleTransactionFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const id = form.querySelector('#transaction-id').value;
    const isEditing = !!id;
    const user = window.firebaseServices.auth.currentUser;

    if (!user) {
        window.app.showNotification('Vous devez être connecté.', 'error');
        return;
    }

    const data = {
        type: form.querySelector('#transaction-type').value,
        description: form.querySelector('#transaction-description').value,
        amount: parseFloat(form.querySelector('#transaction-amount').value),
        date: new Date(form.querySelector('#transaction-date').value)
    };

    try {
        if (isEditing) {
            await window.firebaseServices.transactions.updateDocument(user.uid, id, data);
            window.app.showNotification('Transaction mise à jour.', 'success');
        } else {
            await window.firebaseServices.transactions.addDocument(user.uid, data);
            window.app.showNotification('Transaction ajoutée.', 'success');
        }
        window.app.hideFormModal();
        window.app.showTab('finances');
    } catch (error) {
        console.error('❌ Erreur sauvegarde transaction:', error);
        window.app.showNotification('Erreur lors de la sauvegarde.', 'error');
    }
}

/**
 * Gère les actions sur les transactions (modifier, supprimer).
 * @param {Event} event - L'événement de clic.
 */
async function handleFinanceActions(event) {
    const { action, type, id } = event.target.dataset;
    if (type !== 'transaction' && type !== 'finance') return;

    const user = window.firebaseServices.auth.currentUser;
    if (!user) return;

    try {
        if (action === 'add' && type === 'finance') {
            showTransactionForm(null);
        } else if (action === 'edit' && id) {
            const transaction = await window.firebaseServices.transactions.getDocument(user.uid, id);
            showTransactionForm(transaction);
        } else if (action === 'delete' && id) {
            const confirmed = await window.uiComponents.showConfirmation({
                title: 'Supprimer la transaction ?',
                message: 'Cette action est irréversible.',
                confirmText: 'Supprimer',
                type: 'danger'
            });
            if (confirmed) {
                await window.firebaseServices.transactions.deleteDocument(user.uid, id);
                window.app.showNotification('Transaction supprimée.', 'success');
                window.app.showTab('finances');
            }
        }
    } catch (error) {
        console.error(`❌ Erreur action finance '${action}':`, error);
        window.app.showNotification('Une erreur est survenue.', 'error');
    }
}


// Exposer les fonctions
window.financesUI = {
    showTransactionForm,
    handleFinanceActions
};

console.log('✅ finances.js: Prêt');