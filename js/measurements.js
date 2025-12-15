// js/measurements.js - MODULE COMPLET DE GESTION DES MESURES
console.log('📏 measurements.js: Chargement du module de mesures');

class MeasurementsManager {
    constructor() {
        this.standardMeasurements = {
            // Mesures corporelles standard
            'bust': 'Tour de poitrine',
            'waist': 'Tour de taille',
            'hips': 'Tour de hanches', 
            'shoulderWidth': 'Largeur d\'épaules',
            'armLength': 'Longueur de bras',
            'backWidth': 'Largeur de dos',
            'frontLength': 'Longueur devant',
            'sleeveLength': 'Longueur de manche',
            'collarSize': 'Tour de cou',
            'thigh': 'Tour de cuisse',
            'knee': 'Tour de genou',
            'ankle': 'Tour de cheville',
            'inseam': 'Longueur d\'entrejambe',
            'outseam': 'Longueur extérieure'
        };
        
        console.log('✅ MeasurementsManager initialisé avec', Object.keys(this.standardMeasurements).length, 'mesures standard');
    }

    async createMeasurement(measurementData) {
        try {
            const user = await window.firebaseServices.requireAuth('créer une mesure');
            const db = window.firebaseServices.getFirestore();
            const measurementId = db.collection('_').doc().id;
            
            const measurement = {
                id: measurementId,
                clientId: measurementData.clientId,
                name: measurementData.name || 'Nouvelle mesure',
                measurements: measurementData.measurements || {},
                notes: measurementData.notes || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.uid
            };
            
            await db.collection('users').doc(user.uid)
                .collection('measurements').doc(measurementId)
                .set(measurement);
                
            console.log('✅ Mesure créée:', measurementId);
            return measurement;
            
        } catch (error) {
            console.error('❌ Erreur création mesure:', error);
            throw error;
        }
    }

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

    async getMeasurement(measurementId) {
        try {
            const user = await window.firebaseServices.requireAuth('accéder à une mesure');
            const db = window.firebaseServices.getFirestore();
            
            const doc = await db.collection('users').doc(user.uid)
                .collection('measurements').doc(measurementId)
                .get();
                
            return doc.exists ? doc.data() : null;
            
        } catch (error) {
            console.error('❌ Erreur récupération mesure:', error);
            throw error;
        }
    }

    async updateMeasurement(measurementId, updates) {
        try {
            const user = await window.firebaseServices.requireAuth('modifier une mesure');
            const db = window.firebaseServices.getFirestore();
            
            await db.collection('users').doc(user.uid)
                .collection('measurements').doc(measurementId)
                .update({
                    ...updates,
                    updatedAt: new Date().toISOString()
                });
                
            console.log('✅ Mesure mise à jour:', measurementId);
            return await this.getMeasurement(measurementId);
            
        } catch (error) {
            console.error('❌ Erreur mise à jour mesure:', error);
            throw error;
        }
    }

    async deleteMeasurement(measurementId) {
        try {
            const user = await window.firebaseServices.requireAuth('supprimer une mesure');
            const db = window.firebaseServices.getFirestore();
            
            await db.collection('users').doc(user.uid)
                .collection('measurements').doc(measurementId)
                .delete();
                
            console.log('✅ Mesure supprimée:', measurementId);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur suppression mesure:', error);
            throw error;
        }
    }

    renderMeasurementForm(clientId = null, existingData = null) {
        const measurements = existingData?.measurements || {};
        
        return `
            <div class="measurement-form">
                <h3>📏 ${existingData ? 'Modifier les mesures' : 'Nouvelle prise de mesures'}</h3>
                <form id="measurement-form">
                    <input type="hidden" id="measurement-id" value="${existingData?.id || ''}">
                    ${clientId ? `<input type="hidden" id="measurement-client-id" value="${clientId}">` : ''}
                    
                    <div class="form-group">
                        <label for="measurement-name">Nom de la prise de mesures:</label>
                        <input type="text" id="measurement-name" value="${existingData?.name || ''}" 
                               placeholder="Ex: Robe de soirée, Costume sur mesure..." required>
                    </div>
                    
                    ${!clientId ? `
                    <div class="form-group">
                        <label for="measurement-client-select">Client:</label>
                        <select id="measurement-client-select" required>
                            <option value="">Sélectionner un client</option>
                        </select>
                    </div>
                    ` : ''}
                    
                    <div class="measurements-section">
                        <h4>Mesures Standard (en cm)</h4>
                        <div class="measurements-grid">
                            ${Object.entries(this.standardMeasurements).map(([key, label]) => `
                                <div class="measurement-input">
                                    <label for="measurement-${key}">${label}:</label>
                                    <input type="number" step="0.1" 
                                           id="measurement-${key}" 
                                           value="${measurements[key] || ''}"
                                           placeholder="0.0">
                                    <span>cm</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="measurement-notes">Notes supplémentaires:</label>
                        <textarea id="measurement-notes" placeholder="Notes sur les mesures, particularités...">${existingData?.notes || ''}</textarea>
                    </div>
                </form>
            </div>
        `;
    }

    getStandardMeasurements() {
        return this.standardMeasurements;
    }

    // Nouvelle méthode pour intégration avec les commandes
    async getLatestClientMeasurement(clientId) {
        const measurements = await this.getClientMeasurements(clientId);
        return measurements.length > 0 ? measurements[0] : null;
    }
}

// Initialisation et exposition
window.measurementsManager = new MeasurementsManager();

// Intégration avec firebaseServices
if (window.firebaseServices) {
    window.firebaseServices.measurements = window.measurementsManager;
    console.log('✅ measurements.js: Intégré avec firebaseServices');
} else {
    console.warn('⚠️ measurements.js: firebaseServices non disponible');
}

console.log('✅ measurements.js: Module de mesures initialisé');

