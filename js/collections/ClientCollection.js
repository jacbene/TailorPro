// collections/ClientCollection.js - Gestion des clients pour couturiers
class ClientCollection extends BaseCollection {
    constructor(options = {}) {
        super('clients', {
            autoSave: options.autoSave !== false,
            syncEnabled: options.syncEnabled !== false,
            requiredFields: ['firstname', 'lastname'],
            validationRules: {
                firstname: {
                    validator: (value) => value && value.trim().length >= 2,
                    message: 'Le prénom doit contenir au moins 2 caractères'
                },
                lastname: {
                    validator: (value) => value && value.trim().length >= 2,
                    message: 'Le nom doit contenir au moins 2 caractères'
                },
                email: {
                    validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                    message: 'Format d\'email invalide'
                },
                phone: {
                    validator: (value) => !value || /^[\+]?[0-9\s\-\(\)]{8,}$/.test(value),
                    message: 'Format de téléphone invalide'
                },
                unique: ['email'] // Email doit être unique
            },
            ...options
        });

        this.measurementsEnabled = options.measurementsEnabled !== false;
        this.initCustomValidation();
    }

    /**
     * Initialisation de la validation personnalisée
     */
    initCustomValidation() {
        // Validation supplémentaire pour les mesures si activées
        if (this.measurementsEnabled) {
            this.validationRules.measurements = {
                validator: (measurements) => {
                    if (!measurements) return true;
                    return typeof measurements === 'object' && !Array.isArray(measurements);
                },
                message: 'Les mesures doivent être un objet'
            };
        }
    }

    /**
     * Ajouter un client avec validation étendue
     */
    add(clientData) {
        // Nettoyage des données
        const cleanedData = this.cleanClientData(clientData);
        
        // Validation métier supplémentaire
        this.validateBusinessRules(cleanedData);
        
        return super.add(cleanedData);
    }

    /**
     * Mettre à jour un client
     */
    update(id, updates) {
        const cleanedUpdates = this.cleanClientData(updates);
        return super.update(id, cleanedUpdates);
    }

    /**
     * Nettoyer les données client
     */
    cleanClientData(clientData) {
        const cleaned = { ...clientData };
        
        // Nettoyage des chaînes de caractères
        if (cleaned.firstname) cleaned.firstname = cleaned.firstname.trim();
        if (cleaned.lastname) cleaned.lastname = cleaned.lastname.trim();
        if (cleaned.email) cleaned.email = cleaned.email.toLowerCase().trim();
        if (cleaned.phone) cleaned.phone = cleaned.phone.replace(/\s/g, '');
        if (cleaned.address) cleaned.address = cleaned.address.trim();
        
        // Formatage du nom complet
        cleaned.fullname = this.formatFullName(cleaned.firstname, cleaned.lastname);
        
        // Initiales pour l'avatar
        cleaned.initials = this.generateInitials(cleaned.firstname, cleaned.lastname);
        
        return cleaned;
    }

    /**
     * Validation des règles métier
     */
    validateBusinessRules(clientData) {
        const errors = [];
        
        // Vérifier l'âge si date de naissance fournie
        if (clientData.birthdate) {
            const age = this.calculateAge(clientData.birthdate);
            if (age < 5) errors.push('Le client doit avoir au moins 5 ans');
            if (age > 120) errors.push('Âge invalide');
        }
        
        // Vérifier la cohérence des mesures
        if (clientData.measurements) {
            const measurementErrors = this.validateMeasurements(clientData.measurements);
            errors.push(...measurementErrors);
        }
        
        if (errors.length > 0) {
            throw new Error(`Règles métier non respectées: ${errors.join(', ')}`);
        }
    }

    /**
     * Valider les mesures
     */
    validateMeasurements(measurements) {
        const errors = [];
        const validBodyParts = [
            'bust', 'waist', 'hips', 'shoulders', 'armLength', 
            'legLength', 'backLength', 'chest'
        ];

        for (const [part, value] of Object.entries(measurements)) {
            if (!validBodyParts.includes(part)) {
                errors.push(`Partie du corps non reconnue: ${part}`);
                continue;
            }
            
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue < 0) {
                errors.push(`Mesure invalide pour ${part}: ${value}`);
            }
            
            // Vérifications spécifiques par partie du corps
            switch (part) {
                case 'bust':
                    if (numValue < 50 || numValue > 200) errors.push(`Buste invalide: ${value}cm`);
                    break;
                case 'waist':
                    if (numValue < 40 || numValue > 150) errors.push(`Taille invalide: ${value}cm`);
                    break;
                case 'hips':
                    if (numValue < 60 || numValue > 200) errors.push(`Hanches invalides: ${value}cm`);
                    break;
            }
        }

        return errors;
    }

    /**
     * Formater le nom complet
     */
    formatFullName(firstname, lastname) {
        if (!firstname || !lastname) return '';
        return `${firstname} ${lastname}`.trim();
    }

    /**
     * Générer les initiales pour l'avatar
     */
    generateInitials(firstname, lastname) {
        if (!firstname || !lastname) return '??';
        return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
    }

    /**
     * Calculer l'âge à partir de la date de naissance
     */
    calculateAge(birthdate) {
        const birth = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Recherche avancée de clients
     */
    advancedSearch(criteria) {
        let results = this.getAll();
        
        if (criteria.searchTerm) {
            const searchFields = ['firstname', 'lastname', 'email', 'phone', 'address'];
            results = this.search(criteria.searchTerm, searchFields);
        }
        
        // Filtre par statut
        if (criteria.status) {
            results = results.filter(client => client.status === criteria.status);
        }
        
        // Filtre par ville
        if (criteria.city) {
            results = results.filter(client => 
                client.address && client.address.toLowerCase().includes(criteria.city.toLowerCase())
            );
        }
        
        // Filtre par date de création
        if (criteria.createdAfter) {
            results = results.filter(client => 
                new Date(client.createdAt) >= new Date(criteria.createdAfter)
            );
        }
        
        if (criteria.createdBefore) {
            results = results.filter(client => 
                new Date(client.createdAt) <= new Date(criteria.createdBefore)
            );
        }
        
        // Tri
        if (criteria.sortBy) {
            results = this.sortClients(results, criteria.sortBy, criteria.sortOrder);
        }
        
        return results;
    }

    /**
     * Trier les clients
     */
    sortClients(clients, sortBy = 'lastname', sortOrder = 'asc') {
        return clients.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            // Gestion des valeurs manquantes
            if (!aValue) aValue = '';
            if (!bValue) bValue = '';
            
            // Conversion en minuscules pour le tri textuel
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Obtenir les statistiques des clients
     */
    getClientStats() {
        const clients = this.getAll();
        const stats = {
            total: clients.length,
            byStatus: {},
            byCity: {},
            withMeasurements: 0,
            averageAge: 0,
            recentlyAdded: 0
        };
        
        let totalAge = 0;
        let ageCount = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        clients.forEach(client => {
            // Par statut
            const status = client.status || 'active';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            
            // Par ville (si disponible)
            if (client.address) {
                // Extraction basique de la ville (à améliorer)
                const cityMatch = client.address.match(/(\d{5}\s+)?([^,]+)(?=,|$)/);
                if (cityMatch) {
                    const city = cityMatch[2].trim();
                    stats.byCity[city] = (stats.byCity[city] || 0) + 1;
                }
            }
            
            // Avec mesures
            if (client.measurements && Object.keys(client.measurements).length > 0) {
                stats.withMeasurements++;
            }
            
            // Calcul âge moyen
            if (client.birthdate) {
                const age = this.calculateAge(client.birthdate);
                totalAge += age;
                ageCount++;
            }
            
            // Récemment ajoutés (30 derniers jours)
            if (new Date(client.createdAt) > thirtyDaysAgo) {
                stats.recentlyAdded++;
            }
        });
        
        stats.averageAge = ageCount > 0 ? Math.round(totalAge / ageCount) : 0;
        
        return stats;
    }

    /**
     * Obtenir les clients actifs (ayant commandé récemment)
     */
    getActiveClients(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        // Cette méthode nécessite l'accès aux commandes
        // Pour l'instant, on considère comme actif les clients créés récemment
        // ou avec des mesures récentes
        return this.getAll().filter(client => {
            const lastActivity = client.lastOrderDate || client.measurementsUpdatedAt || client.createdAt;
            return new Date(lastActivity) > cutoffDate;
        });
    }

    /**
     * Mettre à jour les mesures d'un client
     */
    updateMeasurements(clientId, measurements, notes = '') {
        const client = this.get(clientId);
        if (!client) {
            throw new Error(`Client non trouvé avec l'ID: ${clientId}`);
        }
        
        const validationErrors = this.validateMeasurements(measurements);
        if (validationErrors.length > 0) {
            throw new Error(`Mesures invalides: ${validationErrors.join(', ')}`);
        }
        
        const updates = {
            measurements: { ...client.measurements, ...measurements },
            measurementsUpdatedAt: new Date().toISOString()
        };
        
        if (notes) {
            updates.measurementNotes = notes;
        }
        
        return this.update(clientId, updates);
    }

    /**
     * Obtenir l'historique des mesures d'un client
     */
    getMeasurementHistory(clientId) {
        const client = this.get(clientId);
        if (!client) return [];
        
        // Pour l'instant, on retourne les mesures actuelles
        // Dans une version future, on pourrait stocker l'historique
        return [{
            date: client.measurementsUpdatedAt || client.updatedAt,
            measurements: client.measurements,
            notes: client.measurementNotes
        }];
    }

    /**
     * Exporter les clients pour backup
     */
    exportClients(options = {}) {
        const data = super.export();
        
        if (options.includeSensitive !== true) {
            // Exclure les données sensibles
            data.data = data.data.map(client => {
                const { password, ...safeClient } = client;
                return safeClient;
            });
        }
        
        return data;
    }

    /**
     * Importer des clients depuis un fichier
     */
    importClients(data, options = {}) {
        return super.import(data, options);
    }

    /**
     * Générer un rapport clients
     */
    generateReport() {
        const stats = this.getClientStats();
        const clients = this.getAll();
        
        return {
            generatedAt: new Date().toISOString(),
            summary: stats,
            topCities: Object.entries(stats.byCity)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5),
            recentClients: clients
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
                .map(client => ({
                    id: client.id,
                    name: client.fullname,
                    email: client.email,
                    phone: client.phone,
                    createdAt: client.createdAt
                })),
            clientsWithoutMeasurements: clients.filter(client => 
                !client.measurements || Object.keys(client.measurements).length === 0
            ).length
        };
    }

    /**
     * Synchronisation cloud spécifique aux clients
     */
    async syncWithCloud() {
        if (!this.syncEnabled) {
            console.log('⚠️ Synchronisation cloud désactivée pour les clients');
            return;
        }
        
        try {
            console.log('☁️ Synchronisation des clients avec le cloud...');
            
            // Implémentation future avec Firebase Firestore
            // Pour l'instant, simulation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ Synchronisation clients terminée');
            this.triggerEvent('sync', { success: true, timestamp: new Date().toISOString() });
            
        } catch (error) {
            console.error('❌ Erreur de synchronisation clients:', error);
            this.triggerEvent('sync', { success: false, error: error.message });
            throw error;
        }
    }

    /**
     * Méthodes utilitaires
     */
    
    // Obtenir les clients par initiale
    getClientsByInitial(letter) {
        return this.getAll().filter(client => 
            client.lastname && client.lastname.charAt(0).toUpperCase() === letter.toUpperCase()
        );
    }

    // Rechercher des clients similaires
    findSimilarClients(clientId, maxResults = 5) {
        const targetClient = this.get(clientId);
        if (!targetClient) return [];
        
        return this.getAll()
            .filter(client => client.id !== clientId)
            .map(client => ({
                client,
                similarity: this.calculateClientSimilarity(targetClient, client)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxResults)
            .map(item => item.client);
    }

    // Calculer la similarité entre clients (basique)
    calculateClientSimilarity(client1, client2) {
        let score = 0;
        
        // Même ville
        if (client1.address && client2.address && 
            client1.address.includes(client2.address.split(',')[0])) {
            score += 30;
        }
        
        // Âge similaire (±5 ans)
        if (client1.birthdate && client2.birthdate) {
            const age1 = this.calculateAge(client1.birthdate);
            const age2 = this.calculateAge(client2.birthdate);
            if (Math.abs(age1 - age2) <= 5) score += 20;
        }
        
        // Mesures similaires (si disponibles)
        if (client1.measurements && client2.measurements) {
            const commonMeasurements = Object.keys(client1.measurements)
                .filter(key => client2.measurements[key]);
            
            if (commonMeasurements.length > 0) {
                score += commonMeasurements.length * 5;
            }
        }
        
        return score;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientCollection;
} else {
    window.ClientCollection = ClientCollection;
}

console.log('✅ ClientCollection chargée - Prête pour la gestion des clients');

