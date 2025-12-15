// js/ui/settings.js - Gestion de l'interface pour les paramètres
console.log('⚙️ settings.js: Chargement');

/**
 * Affiche le formulaire des paramètres utilisateur.
 * @param {object} user - L'objet utilisateur Firebase.
 */
function showSettingsForm(user) {
    const settingsSection = document.getElementById('settings-content');
    if (!settingsSection) return;

    settingsSection.innerHTML = `
        <div class="settings-container">
            
            <!-- Section Profil -->
            <div class="card settings-card">
                <div class="card-body">
                    <h3 class="card-title">Profil Utilisateur</h3>
                    <form id="profile-settings-form">
                        <div class="form-group">
                            <label for="display-name">Nom d'affichage</label>
                            <input type="text" id="display-name" class="form-control" value="${user.displayName || ''}" placeholder="Entrez votre nom">
                        </div>
                        <div class="form-group">
                            <label for="user-email">Email</label>
                            <input type="email" id="user-email" class="form-control" value="${user.email}" disabled>
                        </div>
                        <button type="submit" class="btn btn-primary">Mettre à jour le profil</button>
                    </form>
                </div>
            </div>

            <!-- Section Sécurité & MFA -->
            <div class="card settings-card">
                <div class="card-body">
                    <h3 class="card-title">Sécurité</h3>
                    <div id="mfa-settings-container"></div>
                </div>
            </div>

        </div>
    `;

    // Écouteur pour la mise à jour du profil
    document.getElementById('profile-settings-form').addEventListener('submit', handleUpdateProfile);

    // Afficher la section MFA
    renderMfaSettings(user);
}

/**
 * Gère la mise à jour du profil utilisateur.
 * @param {Event} event - L'événement de soumission du formulaire.
 */
async function handleUpdateProfile(event) {
    event.preventDefault();
    const newDisplayName = document.getElementById('display-name').value;
    const user = window.app.getCurrentUser();

    if (!user) {
        window.app.showNotification('Utilisateur non trouvé.', 'error');
        return;
    }

    try {
        await window.firebaseServices.auth.updateProfile({ displayName: newDisplayName });
        window.app.showNotification('Profil mis à jour avec succès !', 'success');
        // Optionnel: Mettre à jour l'affichage du nom dans le header ou ailleurs
        const userGreeting = document.querySelector('.dashboard-header h3');
        if(userGreeting) userGreeting.textContent = `Bonjour, ${newDisplayName} !`;

    } catch (error) {
        console.error('❌ Erreur de mise à jour du profil:', error);
        window.app.showNotification('Erreur lors de la mise à jour du profil.', 'error');
    }
}

/**
 * Affiche les paramètres d'authentification multifacteur (MFA).
 * @param {object} user - L'objet utilisateur Firebase.
 */
async function renderMfaSettings(user) {
    const mfaContainer = document.getElementById('mfa-settings-container');
    if (!mfaContainer) return;

    const hasMfa = user.enrolledFactors && user.enrolledFactors.length > 0;

    let mfaContent = `
        <h4>Authentification à deux facteurs (A2F)</h4>
        <p>Protégez votre compte avec une couche de sécurité supplémentaire.</p>
    `;

    if (hasMfa) {
        mfaContent += `
            <div class="mfa-status mfa-enabled">
                <p><strong>Statut :</strong> Activée</p>
                <p>L'A2F est actuellement active sur votre compte.</p>
                <button id="disable-mfa-btn" class="btn btn-danger">Désactiver l'A2F</button>
            </div>
        `;
    } else {
        mfaContent += `
            <div class="mfa-status mfa-disabled">
                <p><strong>Statut :</strong> Désactivée</p>
                <p>Activez l'A2F pour renforcer la sécurité de votre compte.</p>
                <button id="enable-mfa-btn" class="btn btn-success">Activer l'A2F</button>
            </div>
        `;
    }

    mfaContainer.innerHTML = mfaContent;

    // Attacher les écouteurs d'événements
    if (hasMfa) {
        document.getElementById('disable-mfa-btn').addEventListener('click', async () => {
            try {
                await window.mfa.unenrollMfa(); 
                window.app.showNotification('A2F désactivée avec succès !', 'success');
                renderMfaSettings(window.app.getCurrentUser()); // Re-render
            } catch(error) {
                window.app.showNotification(error.message, 'error');
            }
        });
    } else {
        document.getElementById('enable-mfa-btn').addEventListener('click', async () => {
            try {
                await window.mfa.enrollMfa();
                // Le réaffichage se fera après la vérification réussie
            } catch(error) {
                window.app.showNotification(error.message, 'error');
            }
        });
    }
}

// Exposer la fonction principale de rendu pour cette section
window.settingsUI = {
    showSettingsForm
};

console.log('✅ settings.js: Prêt');