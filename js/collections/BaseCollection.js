// collections/BaseCollection.js - Classe de base pour les collections métier
class BaseCollection {
    constructor(collectionName, options = {}) {
        this.collectionName = collectionName;
        this.storageKey = `${collectionName}Collection`;
        this.data = [];
        this.nextId = 1;
        this.autoSave = options.autoSave !== false; // Sauvegarde auto par défaut
        this.syncEnabled = options.syncEnabled !== false; // Synchronisation par défaut
        
        // Options de validation
        this.validationRules = options.validationRules || {};
        this.requiredFields = options.requiredFields || [];
        
        // Événements
        this.eventListeners = {
            'add': [],
            'update': [],
            'delete': [],
            'save': [],
            'load': [],
            'error': []
        };
        
        // Initialisation
        this.initialize();
    }

    /**
     * Initialisation de la collection
     */
    initialize() {
        console.log(`🔄 Initialisation de la collection: ${this.collectionName}`);
        this.loadFromStorage();
        this.calculateNextId();
        
        // Écouter les événements de visibilité de page pour la sauvegarde auto
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.autoSave) {
                this.saveToStorage();
            }
        });
    }

    /**
     * Charger les données depuis le stockage local
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.data = parsed.data || [];
                this.nextId = parsed.nextId || 1;
                console.log(`📂 Données chargées pour ${this.collectionName}: ${this.data.length} éléments`);
                this.triggerEvent('load', this.data);
            } else {
                console.log(`🆕 Nouvelle collection créée: ${this.collectionName}`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors du chargement de ${this.collectionName}:`, error);
            this.triggerEvent('error', error);
            this.data = [];
            this.nextId = 1;
        }
    }

    /**
     * Sauvegarder les données dans le stockage local
     */
    saveToStorage() {
        try {
            const dataToSave = {
                data: this.data,
                nextId: this.nextId,
                lastSaved: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            console.log(`💾 Données sauvegardées pour ${this.collectionName}: ${this.data.length} éléments`);
            this.triggerEvent('save', this.data);
            
            // Synchronisation cloud si activée
            if (this.syncEnabled && typeof this.syncWithCloud === 'function') {
                this.syncWithCloud();
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Erreur lors de la sauvegarde de ${this.collectionName}:`, error);
            this.triggerEvent('error', error);
            return false;
        }
    }

    /**
     * Calculer le prochain ID
     */
    calculateNextId() {
        if (this.data.length === 0) {
            this.nextId = 1;
            return;
        }
        
        const maxId = Math.max(...this.data.map(item => item.id || 0));
        this.nextId = maxId + 1;
    }

    /**
     * Générer un ID unique
     */
    generateId() {
        return this.nextId++;
    }

    /**
     * Valider un élément avant ajout/mise à jour
     */
    validate(item, isUpdate = false) {
        const errors = [];
        
        // Vérifier les champs requis
        for (const field of this.requiredFields) {
            if (!item[field] && item[field] !== 0) {
                errors.push(`Le champ "${field}" est requis`);
            }
        }
        
        // Validation des règles spécifiques
        for (const [field, rule] of Object.entries(this.validationRules)) {
            if (item[field] !== undefined && rule.validator) {
                if (!rule.validator(item[field])) {
                    errors.push(rule.message || `Validation échouée pour ${field}`);
                }
            }
        }
        
        // Validation d'unicité si spécifiée
        if (this.validationRules.unique) {
            const uniqueFields = Array.isArray(this.validationRules.unique) 
                ? this.validationRules.unique 
                : [this.validationRules.unique];
                
            for (const field of uniqueFields) {
                const existing = this.data.find(existingItem => 
                    existingItem[field] === item[field] && 
                    (isUpdate ? existingItem.id !== item.id : true)
                );
                if (existing) {
                    errors.push(`${field} doit être unique`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Ajouter un élément à la collection
     */
    add(item) {
        // Générer un ID si non fourni
        if (!item.id) {
            item.id = this.generateId();
        }
        
        // Validation
        const validation = this.validate(item);
        if (!validation.isValid) {
            const error = new Error(`Validation échouée: ${validation.errors.join(', ')}`);
            this.triggerEvent('error', error);
            throw error;
        }
        
        // Ajouter les métadonnées
        const itemWithMetadata = {
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
        };
        
        this.data.push(itemWithMetadata);
        
        // Sauvegarde automatique
        if (this.autoSave) {
            this.saveToStorage();
        }
        
        console.log(`➕ Élément ajouté à ${this.collectionName}:`, itemWithMetadata);
        this.triggerEvent('add', itemWithMetadata);
        
        return itemWithMetadata;
    }

    /**
     * Récupérer un élément par son ID
     */
    get(id) {
        return this.data.find(item => item.id === id);
    }

    /**
     * Récupérer tous les éléments
     */
    getAll() {
        return [...this.data]; // Retourne une copie pour éviter les mutations directes
    }

    /**
     * Récupérer avec filtrage
     */
    find(predicate) {
        return this.data.filter(predicate);
    }

    /**
     * Récupérer le premier élément correspondant
     */
    findOne(predicate) {
        return this.data.find(predicate);
    }

    /**
     * Mettre à jour un élément
     */
    update(id, updates) {
        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) {
            const error = new Error(`Élément non trouvé avec l'ID: ${id}`);
            this.triggerEvent('error', error);
            throw error;
        }
        
        const originalItem = this.data[index];
        const updatedItem = {
            ...originalItem,
            ...updates,
            updatedAt: new Date().toISOString(),
            version: (originalItem.version || 1) + 1
        };
        
        // Validation
        const validation = this.validate(updatedItem, true);
        if (!validation.isValid) {
            const error = new Error(`Validation échouée: ${validation.errors.join(', ')}`);
            this.triggerEvent('error', error);
            throw error;
        }
        
        this.data[index] = updatedItem;
        
        // Sauvegarde automatique
        if (this.autoSave) {
            this.saveToStorage();
        }
        
        console.log(`✏️ Élément mis à jour dans ${this.collectionName}:`, updatedItem);
        this.triggerEvent('update', { original: originalItem, updated: updatedItem });
        
        return updatedItem;
    }

    /**
     * Supprimer un élément
     */
    delete(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) {
            const error = new Error(`Élément non trouvé avec l'ID: ${id}`);
            this.triggerEvent('error', error);
            throw error;
        }
        
        const deletedItem = this.data.splice(index, 1)[0];
        
        // Sauvegarde automatique
        if (this.autoSave) {
            this.saveToStorage();
        }
        
        console.log(`🗑️ Élément supprimé de ${this.collectionName}:`, deletedItem);
        this.triggerEvent('delete', deletedItem);
        
        return deletedItem;
    }

    /**
     * Vider la collection
     */
    clear() {
        const deletedCount = this.data.length;
        this.data = [];
        this.nextId = 1;
        
        if (this.autoSave) {
            this.saveToStorage();
        }
        
        console.log(`🧹 Collection ${this.collectionName} vidée: ${deletedCount} éléments supprimés`);
        return deletedCount;
    }

    /**
     * Compter les éléments
     */
    count() {
        return this.data.length;
    }

    /**
     * Compter avec condition
     */
    countWhere(predicate) {
        return this.data.filter(predicate).length;
    }

    /**
     * Trier la collection
     */
    sort(compareFunction) {
        return [...this.data].sort(compareFunction);
    }

    /**
     * Paginer les résultats
     */
    paginate(page = 1, pageSize = 10) {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = this.data.slice(startIndex, endIndex);
        
        return {
            data: paginatedData,
            currentPage: page,
            pageSize: pageSize,
            totalItems: this.data.length,
            totalPages: Math.ceil(this.data.length / pageSize),
            hasNext: endIndex < this.data.length,
            hasPrev: page > 1
        };
    }

    /**
     * Recherche textuelle
     */
    search(searchTerm, fieldsToSearch = []) {
        if (!searchTerm) return this.getAll();
        
        const term = searchTerm.toLowerCase();
        return this.data.filter(item => {
            return fieldsToSearch.some(field => {
                const value = item[field];
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    }

    /**
     * Exporter les données
     */
    export() {
        return {
            collection: this.collectionName,
            data: this.data,
            metadata: {
                exportedAt: new Date().toISOString(),
                itemCount: this.data.length,
                version: '1.0'
            }
        };
    }

    /**
     * Importer des données
     */
    import(data, options = {}) {
        const { merge = false, validate = true } = options;
        
        if (!Array.isArray(data)) {
            throw new Error('Les données à importer doivent être un tableau');
        }
        
        let importedCount = 0;
        let errors = [];
        
        if (!merge) {
            this.clear();
        }
        
        for (const item of data) {
            try {
                if (validate) {
                    const validation = this.validate(item);
                    if (!validation.isValid) {
                        errors.push(`Élément invalide: ${validation.errors.join(', ')}`);
                        continue;
                    }
                }
                
                this.add(item);
                importedCount++;
            } catch (error) {
                errors.push(error.message);
            }
        }
        
        console.log(`📥 Import terminé pour ${this.collectionName}: ${importedCount} éléments importés, ${errors.length} erreurs`);
        
        return {
            importedCount,
            errorCount: errors.length,
            errors
        };
    }

    /**
     * Gestion des événements
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    triggerEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erreur dans le listener ${event}:`, error);
                }
            });
        }
    }

    /**
     * Statistiques de la collection
     */
    getStats() {
        return {
            collectionName: this.collectionName,
            itemCount: this.data.length,
            lastSaved: this.getLastSaved(),
            storageSize: this.getStorageSize(),
            nextId: this.nextId
        };
    }

    /**
     * Date de dernière sauvegarde
     */
    getLastSaved() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.lastSaved || null;
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de la date de sauvegarde:', error);
        }
        return null;
    }

    /**
     * Taille du stockage
     */
    getStorageSize() {
        const data = localStorage.getItem(this.storageKey);
        return data ? new Blob([data]).size : 0;
    }

    /**
     * Synchronisation cloud (à implémenter dans les classes filles)
     */
    async syncWithCloud() {
        // À implémenter dans les classes spécifiques
        console.log(`☁️ Synchronisation cloud pour ${this.collectionName} (à implémenter)`);
    }

    /**
     * Restaurer depuis une sauvegarde
     */
    restoreFromBackup(backupData) {
        if (backupData.collection !== this.collectionName) {
            throw new Error(`Backup incompatible. Attendu: ${this.collectionName}, Reçu: ${backupData.collection}`);
        }
        
        this.data = backupData.data || [];
        this.nextId = backupData.nextId || 1;
        
        if (this.autoSave) {
            this.saveToStorage();
        }
        
        console.log(`🔄 Collection ${this.collectionName} restaurée depuis backup`);
        this.triggerEvent('load', this.data);
        
        return this.data.length;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseCollection;
} else {
    window.BaseCollection = BaseCollection;
}

console.log('✅ BaseCollection chargée - Prête pour l\'héritage des collections métier');

