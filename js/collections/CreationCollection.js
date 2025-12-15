// collections/CreationCollection.js - Gestion du catalogue des créations pour couturiers
class CreationCollection extends BaseCollection {
    constructor(options = {}) {
        super('creations', {
            autoSave: options.autoSave !== false,
            syncEnabled: options.syncEnabled !== false,
            requiredFields: ['name', 'price'],
            validationRules: {
                name: {
                    validator: (value) => value && value.trim().length >= 2,
                    message: 'Le nom doit contenir au moins 2 caractères'
                },
                price: {
                    validator: (value) => !isNaN(value) && parseFloat(value) >= 0,
                    message: 'Le prix doit être un nombre positif'
                },
                category: {
                    validator: (value) => !value || ['robe', 'chemise', 'pantalon', 'costume', 'accessoire', 'autre'].includes(value),
                    message: 'Catégorie non valide'
                },
                difficulty: {
                    validator: (value) => !value || ['débutant', 'intermédiaire', 'expert'].includes(value),
                    message: 'Niveau de difficulté non valide'
                },
                unique: ['name'] // Nom doit être unique
            },
            ...options
        });

        this.categories = [
            { value: 'robe', label: '👗 Robe', color: '#e91e63' },
            { value: 'chemise', label: '👔 Chemise', color: '#2196f3' },
            { value: 'pantalon', label: '👖 Pantalon', color: '#795548' },
            { value: 'costume', label: '🥼 Costume', color: '#607d8b' },
            { value: 'accessoire', label: '🧣 Accessoire', color: '#ff9800' },
            { value: 'autre', label: '📦 Autre', color: '#9c27b0' }
        ];

        this.difficultyLevels = [
            { value: 'débutant', label: '⭐ Débutant', color: '#4caf50' },
            { value: 'intermédiaire', label: '⭐⭐ Intermédiaire', color: '#ff9800' },
            { value: 'expert', label: '⭐⭐⭐ Expert', color: '#f44336' }
        ];

        this.initDefaultCreations();
    }

    /**
     * Initialisation des créations par défaut
     */
    initDefaultCreations() {
        // Vérifier si la collection est vide et ajouter des exemples
        if (this.count() === 0) {
            console.log('🆕 Ajout des créations par défaut...');
            
            const defaultCreations = [
                {
                    name: 'Robe cocktail',
                    description: 'Robe élégante pour occasions spéciales',
                    category: 'robe',
                    price: 25000,
                    cost: 12000,
                    difficulty: 'intermédiaire',
                    estimatedTime: 8,
                    tags: ['cocktail', 'soirée', 'élégant'],
                    materials: ['tissu mousseline', 'fermeture invisible'],
                    image: null
                },
                {
                    name: 'Chemise homme classique',
                    description: 'Chemise formelle en coton',
                    category: 'chemise',
                    price: 15000,
                    cost: 7000,
                    difficulty: 'débutant',
                    estimatedTime: 4,
                    tags: ['formel', 'bureau', 'classique'],
                    materials: ['coton popeline', 'boutons nacrés'],
                    image: null
                },
                {
                    name: 'Pantalon tailleur',
                    description: 'Pantalon droit professionnel',
                    category: 'pantalon',
                    price: 18000,
                    cost: 8500,
                    difficulty: 'intermédiaire',
                    estimatedTime: 6,
                    tags: ['travail', 'formel', 'élégant'],
                    materials: ['laine', 'doublure'],
                    image: null
                }
            ];

            defaultCreations.forEach(creation => this.add(creation));
        }
    }

    /**
     * Ajouter une création avec validation étendue
     */
    add(creationData) {
        // Nettoyage des données
        const cleanedData = this.cleanCreationData(creationData);
        
        // Validation métier supplémentaire
        this.validateBusinessRules(cleanedData);
        
        return super.add(cleanedData);
    }

    /**
     * Mettre à jour une création
     */
    update(id, updates) {
        const cleanedUpdates = this.cleanCreationData(updates);
        return super.update(id, cleanedUpdates);
    }

    /**
     * Nettoyer les données création
     */
    cleanCreationData(creationData) {
        const cleaned = { ...creationData };
        
        // Nettoyage des chaînes de caractères
        if (cleaned.name) cleaned.name = cleaned.name.trim();
        if (cleaned.description) cleaned.description = cleaned.description.trim();
        
        // Conversion des nombres
        if (cleaned.price) cleaned.price = parseFloat(cleaned.price);
        if (cleaned.cost) cleaned.cost = parseFloat(cleaned.cost);
        if (cleaned.estimatedTime) cleaned.estimatedTime = parseInt(cleaned.estimatedTime);
        
        // Valeurs par défaut
        if (!cleaned.category) cleaned.category = 'autre';
        if (!cleaned.difficulty) cleaned.difficulty = 'intermédiaire';
        if (!cleaned.tags) cleaned.tags = [];
        if (!cleaned.materials) cleaned.materials = [];
        if (!cleaned.isActive) cleaned.isActive = true;
        
        // Calcul de la marge bénéficiaire
        if (cleaned.price && cleaned.cost) {
            cleaned.profitMargin = this.calculateProfitMargin(cleaned.price, cleaned.cost);
            cleaned.profitAmount = cleaned.price - cleaned.cost;
        }
        
        // Génération d'un code produit unique
        if (!cleaned.productCode) {
            cleaned.productCode = this.generateProductCode(cleaned.name, cleaned.category);
        }
        
        return cleaned;
    }

    /**
     * Validation des règles métier
     */
    validateBusinessRules(creationData) {
        const errors = [];
        
        // Vérification du prix vs coût
        if (creationData.price && creationData.cost) {
            if (creationData.price < creationData.cost) {
                errors.push('Le prix de vente ne peut pas être inférieur au coût');
            }
            
            const margin = this.calculateProfitMargin(creationData.price, creationData.cost);
            if (margin < 10) {
                errors.push('La marge bénéficiaire est trop faible (minimum 10%)');
            }
        }
        
        // Vérification du temps estimé
        if (creationData.estimatedTime) {
            if (creationData.estimatedTime < 1) {
                errors.push('Le temps estimé doit être d\'au moins 1 heure');
            }
            if (creationData.estimatedTime > 100) {
                errors.push('Le temps estimé ne peut pas dépasser 100 heures');
            }
        }
        
        // Vérification des tags
        if (creationData.tags && creationData.tags.length > 10) {
            errors.push('Maximum 10 tags autorisés');
        }
        
        if (errors.length > 0) {
            throw new Error(`Règles métier non respectées: ${errors.join(', ')}`);
        }
    }

    /**
     * Calculer la marge bénéficiaire
     */
    calculateProfitMargin(price, cost) {
        if (!cost || cost === 0) return 0;
        return ((price - cost) / cost) * 100;
    }

    /**
     * Générer un code produit unique
     */
    generateProductCode(name, category) {
        const prefix = category ? category.substring(0, 3).toUpperCase() : 'CRT';
        const nameCode = name
            .substring(0, 3)
            .toUpperCase()
            .replace(/\s/g, '');
        const timestamp = Date.now().toString().slice(-4);
        
        return `${prefix}-${nameCode}-${timestamp}`;
    }

    /**
     * Recherche avancée de créations
     */
    advancedSearch(criteria) {
        let results = this.getAll();
        
        // Filtre par terme de recherche
        if (criteria.searchTerm) {
            const searchFields = ['name', 'description', 'productCode', 'tags', 'materials'];
            results = this.search(criteria.searchTerm, searchFields);
        }
        
        // Filtre par catégorie
        if (criteria.category) {
            results = results.filter(creation => creation.category === criteria.category);
        }
        
        // Filtre par difficulté
        if (criteria.difficulty) {
            results = results.filter(creation => creation.difficulty === criteria.difficulty);
        }
        
        // Filtre par statut actif/inactif
        if (criteria.isActive !== undefined) {
            results = results.filter(creation => creation.isActive === criteria.isActive);
        }
        
        // Filtre par prix
        if (criteria.minPrice) {
            results = results.filter(creation => creation.price >= criteria.minPrice);
        }
        if (criteria.maxPrice) {
            results = results.filter(creation => creation.price <= criteria.maxPrice);
        }
        
        // Filtre par marge bénéficiaire
        if (criteria.minMargin) {
            results = results.filter(creation => 
                creation.profitMargin && creation.profitMargin >= criteria.minMargin
            );
        }
        
        // Filtre par tags
        if (criteria.tags && criteria.tags.length > 0) {
            results = results.filter(creation =>
                creation.tags && criteria.tags.some(tag => creation.tags.includes(tag))
            );
        }
        
        // Tri
        if (criteria.sortBy) {
            results = this.sortCreations(results, criteria.sortBy, criteria.sortOrder);
        }
        
        return results;
    }

    /**
     * Trier les créations
     */
    sortCreations(creations, sortBy = 'name', sortOrder = 'asc') {
        return creations.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            // Gestion des valeurs manquantes
            if (aValue === undefined || aValue === null) aValue = '';
            if (bValue === undefined || bValue === null) bValue = '';
            
            // Tri numérique pour les prix et marges
            if (['price', 'cost', 'profitMargin', 'profitAmount', 'estimatedTime'].includes(sortBy)) {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }
            
            // Conversion en minuscules pour le tri textuel
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Obtenir les statistiques des créations
     */
    getCreationStats() {
        const creations = this.getAll();
        const stats = {
            total: creations.length,
            active: 0,
            byCategory: {},
            byDifficulty: {},
            averagePrice: 0,
            totalInventoryValue: 0,
            mostProfitable: null,
            popularTags: {}
        };
        
        let totalPrice = 0;
        let priceCount = 0;
        let maxProfitMargin = 0;
        
        creations.forEach(creation => {
            // Créations actives
            if (creation.isActive !== false) {
                stats.active++;
            }
            
            // Par catégorie
            const category = creation.category || 'autre';
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            
            // Par difficulté
            const difficulty = creation.difficulty || 'intermédiaire';
            stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;
            
            // Prix moyen
            if (creation.price) {
                totalPrice += creation.price;
                priceCount++;
            }
            
            // Valeur totale de l'inventaire (si stock géré)
            if (creation.cost && creation.stockQuantity) {
                stats.totalInventoryValue += creation.cost * creation.stockQuantity;
            }
            
            // Plus rentable
            if (creation.profitMargin && creation.profitMargin > maxProfitMargin) {
                maxProfitMargin = creation.profitMargin;
                stats.mostProfitable = creation;
            }
            
            // Tags populaires
            if (creation.tags) {
                creation.tags.forEach(tag => {
                    stats.popularTags[tag] = (stats.popularTags[tag] || 0) + 1;
                });
            }
        });
        
        stats.averagePrice = priceCount > 0 ? Math.round(totalPrice / priceCount) : 0;
        
        // Top 5 des tags
        stats.topTags = Object.entries(stats.popularTags)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count }));
        
        return stats;
    }

    /**
     * Obtenir les créations par catégorie
     */
    getCreationsByCategory(category = null) {
        if (category) {
            return this.getAll().filter(creation => creation.category === category);
        }
        
        // Grouper par catégorie
        const grouped = {};
        this.categories.forEach(cat => {
            grouped[cat.value] = this.getAll().filter(creation => creation.category === cat.value);
        });
        
        return grouped;
    }

    /**
     * Obtenir le label d'une catégorie
     */
    getCategoryLabel(categoryValue) {
        const category = this.categories.find(cat => cat.value === categoryValue);
        return category ? category.label : '📦 Autre';
    }

    /**
     * Obtenir la couleur d'une catégorie
     */
    getCategoryColor(categoryValue) {
        const category = this.categories.find(cat => cat.value === categoryValue);
        return category ? category.color : '#9c27b0';
    }

    /**
     * Obtenir le label d'une difficulté
     */
    getDifficultyLabel(difficultyValue) {
        const difficulty = this.difficultyLevels.find(diff => diff.value === difficultyValue);
        return difficulty ? difficulty.label : '⭐⭐ Intermédiaire';
    }

    /**
     * Mettre à jour l'image d'une création
     */
    updateImage(creationId, imageData) {
        const creation = this.get(creationId);
        if (!creation) {
            throw new Error(`Création non trouvée avec l'ID: ${creationId}`);
        }
        
        // Validation basique de l'image (URL ou base64)
        if (imageData && !this.isValidImageData(imageData)) {
            throw new Error('Format d\'image non valide');
        }
        
        return this.update(creationId, { 
            image: imageData,
            imageUpdatedAt: new Date().toISOString()
        });
    }

    /**
     * Valider les données d'image
     */
    isValidImageData(imageData) {
        if (typeof imageData !== 'string') return false;
        
        // URL valide ou base64
        return imageData.startsWith('http') || 
               imageData.startsWith('data:image') || 
               imageData.startsWith('/') ||
               imageData.startsWith('blob:');
    }

    /**
     * Activer/désactiver une création
     */
    toggleActivation(creationId) {
        const creation = this.get(creationId);
        if (!creation) {
            throw new Error(`Création non trouvée avec l'ID: ${creationId}`);
        }
        
        const newStatus = !creation.isActive;
        return this.update(creationId, { 
            isActive: newStatus,
            statusChangedAt: new Date().toISOString()
        });
    }

    /**
     * Dupliquer une création
     */
    duplicate(creationId, newName = null) {
        const original = this.get(creationId);
        if (!original) {
            throw new Error(`Création non trouvée avec l'ID: ${creationId}`);
        }
        
        const duplicateData = { ...original };
        
        // Supprimer les propriétés uniques
        delete duplicateData.id;
        delete duplicateData.createdAt;
        delete duplicateData.updatedAt;
        
        // Générer un nouveau nom
        duplicateData.name = newName || `${original.name} (Copie)`;
        
        // Régénérer le code produit
        duplicateData.productCode = this.generateProductCode(duplicateData.name, duplicateData.category);
        
        return this.add(duplicateData);
    }

    /**
     * Obtenir les créations similaires
     */
    findSimilarCreations(creationId, maxResults = 4) {
        const targetCreation = this.get(creationId);
        if (!targetCreation) return [];
        
        return this.getAll()
            .filter(creation => creation.id !== creationId && creation.isActive !== false)
            .map(creation => ({
                creation,
                similarity: this.calculateCreationSimilarity(targetCreation, creation)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxResults)
            .map(item => item.creation);
    }

    /**
     * Calculer la similarité entre créations
     */
    calculateCreationSimilarity(creation1, creation2) {
        let score = 0;
        
        // Même catégorie
        if (creation1.category === creation2.category) {
            score += 40;
        }
        
        // Même difficulté
        if (creation1.difficulty === creation2.difficulty) {
            score += 20;
        }
        
        // Prix similaire (±20%)
        if (creation1.price && creation2.price) {
            const priceDiff = Math.abs(creation1.price - creation2.price) / creation1.price;
            if (priceDiff <= 0.2) score += 15;
        }
        
        // Tags communs
        if (creation1.tags && creation2.tags) {
            const commonTags = creation1.tags.filter(tag => creation2.tags.includes(tag));
            score += commonTags.length * 5;
        }
        
        // Matériaux communs
        if (creation1.materials && creation2.materials) {
            const commonMaterials = creation1.materials.filter(mat => creation2.materials.includes(mat));
            score += commonMaterials.length * 3;
        }
        
        return score;
    }

    /**
     * Générer un rapport de rentabilité
     */
    generateProfitabilityReport() {
        const creations = this.getAll().filter(creation => creation.isActive !== false);
        const report = {
            generatedAt: new Date().toISOString(),
            totalCreations: creations.length,
            totalRevenuePotential: 0,
            totalCost: 0,
            totalProfit: 0,
            averageMargin: 0,
            byCategory: {},
            byDifficulty: {}
        };
        
        let totalMargin = 0;
        let marginCount = 0;
        
        creations.forEach(creation => {
            if (creation.price && creation.cost) {
                report.totalRevenuePotential += creation.price;
                report.totalCost += creation.cost;
                report.totalProfit += (creation.price - creation.cost);
                totalMargin += creation.profitMargin || 0;
                marginCount++;
                
                // Par catégorie
                const category = creation.category || 'autre';
                if (!report.byCategory[category]) {
                    report.byCategory[category] = {
                        count: 0,
                        totalRevenue: 0,
                        totalCost: 0,
                        totalProfit: 0
                    };
                }
                report.byCategory[category].count++;
                report.byCategory[category].totalRevenue += creation.price;
                report.byCategory[category].totalCost += creation.cost;
                report.byCategory[category].totalProfit += (creation.price - creation.cost);
                
                // Par difficulté
                const difficulty = creation.difficulty || 'intermédiaire';
                if (!report.byDifficulty[difficulty]) {
                    report.byDifficulty[difficulty] = {
                        count: 0,
                        totalRevenue: 0,
                        totalCost: 0,
                        totalProfit: 0
                    };
                }
                report.byDifficulty[difficulty].count++;
                report.byDifficulty[difficulty].totalRevenue += creation.price;
                report.byDifficulty[difficulty].totalCost += creation.cost;
                report.byDifficulty[difficulty].totalProfit += (creation.price - creation.cost);
            }
        });
        
        report.averageMargin = marginCount > 0 ? Math.round(totalMargin / marginCount) : 0;
        
        return report;
    }

    /**
     * Synchronisation cloud spécifique aux créations
     */
    async syncWithCloud() {
        if (!this.syncEnabled) {
            console.log('⚠️ Synchronisation cloud désactivée pour les créations');
            return;
        }
        
        try {
            console.log('☁️ Synchronisation des créations avec le cloud...');
            
            // Implémentation future avec Firebase Firestore
            // Pour l'instant, simulation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ Synchronisation créations terminée');
            this.triggerEvent('sync', { success: true, timestamp: new Date().toISOString() });
            
        } catch (error) {
            console.error('❌ Erreur de synchronisation créations:', error);
            this.triggerEvent('sync', { success: false, error: error.message });
            throw error;
        }
    }

    /**
     * Exporter les créations pour la galerie
     */
    exportForGallery() {
        return this.getAll()
            .filter(creation => creation.isActive !== false && creation.image)
            .map(creation => ({
                id: creation.id,
                name: creation.name,
                description: creation.description,
                category: creation.category,
                price: creation.price,
                image: creation.image,
                productCode: creation.productCode,
                tags: creation.tags
            }));
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreationCollection;
} else {
    window.CreationCollection = CreationCollection;
}

console.log('✅ CreationCollection chargée - Prête pour la gestion du catalogue');

