// js/components.js - COMPOSANTS RÉUTILISABLES AVANCÉS
console.log('🧩 components.js: Chargement des composants avancés');

class UIComponents {
    constructor() {
        this.components = new Map();
    }
    
    /**
     * Crée un overlay de chargement global
     */
    showGlobalLoading(message = 'Chargement...') {
        // Supprimer l'overlay existant
        this.hideGlobalLoading();
        
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay fade-in';
        overlay.id = 'global-loading-overlay';
        
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        
        document.body.appendChild(overlay);
        return overlay;
    }
    
    /**
     * Cache l'overlay de chargement global
     */
    hideGlobalLoading() {
        const existingOverlay = document.getElementById('global-loading-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
    }
    
    /**
     * Crée un skeleton loader pour le contenu
     */
    createSkeletonLoader(type = 'card', count = 1) {
        const skeletons = {
            card: `
                <div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-text"></div>
                        <div class="skeleton-line skeleton-text short"></div>
                    </div>
                </div>
            `,
            table: `
                <div class="skeleton-table">
                    ${Array.from({length: 5}, () => `
                        <div class="skeleton-row">
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell short"></div>
                        </div>
                    `).join('')}
                </div>
            `,
            stats: `
                <div class="skeleton-stats">
                    ${Array.from({length: 4}, () => `
                        <div class="skeleton-stat">
                            <div class="skeleton-label"></div>
                            <div class="skeleton-number"></div>
                        </div>
                    `).join('')}
                </div>
            `
        };
        
        return Array.from({length: count}, () => skeletons[type] || skeletons.card).join('');
    }
    
    /**
     * Affiche un modal de confirmation avancé
     */
    showConfirmation(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirmation',
                message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
                confirmText = 'Confirmer',
                cancelText = 'Annuler',
                type = 'warning', // warning, danger, info
                showCancel = true
            } = options;
            
            const modalId = 'advanced-confirm-modal';
            let modal = document.getElementById(modalId);
            
            if (!modal) {
                modal = document.createElement('div');
                modal.id = modalId;
                modal.className = 'modal';
                document.getElementById('modal-container').appendChild(modal);
            }
            
            const typeIcons = {
                warning: '⚠️',
                danger: '🚨',
                info: 'ℹ️'
            };
            
            modal.innerHTML = `
                <div class="modal-content confirm-modal">
                    <div class="confirm-header ${type}">
                        <span class="confirm-icon">${typeIcons[type]}</span>
                        <h3>${title}</h3>
                    </div>
                    <div class="confirm-body">
                        <p>${message}</p>
                    </div>
                    <div class="confirm-footer">
                        ${showCancel ? `
                            <button class="btn btn-secondary cancel-btn">${cancelText}</button>
                        ` : ''}
                        <button class="btn btn-primary confirm-btn ${type}">${confirmText}</button>
                    </div>
                </div>
            `;
            
            modal.style.display = 'block';
            
            // Gestionnaires d'événements
            const confirmBtn = modal.querySelector('.confirm-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const closeModal = () => {
                modal.style.display = 'none';
                modal.innerHTML = '';
            };
            
            confirmBtn.addEventListener('click', () => {
                closeModal();
                resolve(true);
            });
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    closeModal();
                    resolve(false);
                });
            }
            
            // Fermeture en cliquant à l'extérieur
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                    resolve(false);
                }
            });
        });
    }
    
    /**
     * Crée un sélecteur de date amélioré
     */
    createDatePicker(inputElement, options = {}) {
        // Implémentation simplifiée - dans une vraie app, utiliser une librairie
        inputElement.type = 'date';
        inputElement.className += ' enhanced-datepicker';
        
        // Validation basique
        inputElement.addEventListener('change', (e) => {
            const selectedDate = new Date(e.target.value);
            const today = new Date();
            
            if (options.minDate && selectedDate < new Date(options.minDate)) {
                this.showNotification('Date invalide', 'error');
                inputElement.value = '';
            }
            
            if (options.maxDate && selectedDate > new Date(options.maxDate)) {
                this.showNotification('Date invalide', 'error');
                inputElement.value = '';
            }
        });
        
        return inputElement;
    }
    
    /**
     * Crée un uploader de fichier avec preview
     */
    createFileUploader(options = {}) {
        const {
            container,
            accept = 'image/*',
            multiple = false,
            maxSize = 5 * 1024 * 1024, // 5MB
            onUploadComplete
        } = options;
        
        const uploaderId = 'file-uploader-' + Date.now();
        const previewId = 'preview-' + uploaderId;
        
        container.innerHTML = `
            <div class="file-uploader" id="${uploaderId}">
                <input type="file" 
                       id="file-input-${uploaderId}" 
                       accept="${accept}" 
                       ${multiple ? 'multiple' : ''}
                       style="display: none;">
                
                <div class="upload-area" id="upload-area-${uploaderId}">
                    <div class="upload-placeholder">
                        <span class="upload-icon">📁</span>
                        <p>Glissez-déposez vos fichiers ici ou <span class="browse-link">parcourir</span></p>
                        <small>Formats acceptés: ${accept} • Max: ${this.formatFileSize(maxSize)}</small>
                    </div>
                </div>
                
                <div class="upload-preview" id="${previewId}"></div>
                
                <div class="upload-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <span class="progress-text">0%</span>
                </div>
            </div>
        `;
        
        const fileInput = container.querySelector(`#file-input-${uploaderId}`);
        const uploadArea = container.querySelector(`#upload-area-${uploaderId}`);
        const previewContainer = container.querySelector(`#${previewId}`);
        const progressContainer = container.querySelector('.upload-progress');
        
        // Gestionnaire de clic sur la zone d'upload
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // Gestionnaire de drag & drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        
        // Gestionnaire de sélection de fichiers
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        const handleFiles = (files) => {
            const validFiles = Array.from(files).filter(file => {
                if (file.size > maxSize) {
                    this.showNotification(`Fichier trop volumineux: ${file.name}`, 'error');
                    return false;
                }
                return true;
            });
            
            if (validFiles.length > 0) {
                this.uploadFiles(validFiles);
            }
        };
        
        const uploadFiles = async (files) => {
            progressContainer.style.display = 'block';
            const results = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progressFill = progressContainer.querySelector('.progress-fill');
                const progressText = progressContainer.querySelector('.progress-text');
                
                try {
                    // Simulation de progression
                    for (let progress = 0; progress <= 100; progress += 10) {
                        progressFill.style.width = progress + '%';
                        progressText.textContent = progress + '%';
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                    // Upload réel avec storageManager
                    if (window.storageManager) {
                        const downloadURL = await window.storageManager.uploadFile(
                            file, 
                            `uploads/${Date.now()}-${file.name}`
                        );
                        
                        results.push({
                            name: file.name,
                            url: downloadURL,
                            type: file.type,
                            size: file.size
                        });
                        
                        // Afficher la preview
                        this.showFilePreview(file, downloadURL);
                    }
                    
                } catch (error) {
                    console.error('Erreur upload:', error);
                    this.showNotification(`Erreur lors de l'upload de ${file.name}`, 'error');
                }
            }
            
            progressContainer.style.display = 'none';
            
            if (onUploadComplete) {
                onUploadComplete(results);
            }
        };
        
        this.showFilePreview = (file, url) => {
            if (file.type.startsWith('image/')) {
                previewContainer.innerHTML += `
                    <div class="file-preview image-preview">
                        <img src="${url}" alt="${file.name}">
                        <button class="remove-file" onclick="this.parentElement.remove()">×</button>
                        <span class="file-name">${file.name}</span>
                    </div>
                `;
            } else {
                previewContainer.innerHTML += `
                    <div class="file-preview document-preview">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                        <button class="remove-file" onclick="this.parentElement.remove()">×</button>
                    </div>
                `;
            }
        };
        
        this.formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
    }
    
    /**
     * Crée un sélecteur de recherche avec suggestions
     */
    createSearchableSelect(selectElement, options = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'searchable-select';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = options.placeholder || 'Rechercher...';
        searchInput.className = 'search-input';
        
        const dropdown = document.createElement('div');
        dropdown.className = 'select-dropdown';
        
        wrapper.appendChild(searchInput);
        wrapper.appendChild(dropdown);
        
        selectElement.parentNode.insertBefore(wrapper, selectElement);
        wrapper.appendChild(selectElement);
        selectElement.style.display = 'none';
        
        // Remplir les options initiales
        this.updateDropdownOptions(selectElement, dropdown);
        
        // Filtre en temps réel
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const options = Array.from(selectElement.options);
            
            const filteredOptions = options.filter(option => 
                option.text.toLowerCase().includes(searchTerm)
            );
            
            this.updateDropdownOptions(selectElement, dropdown, filteredOptions);
        });
        
        // Afficher/masquer le dropdown
        searchInput.addEventListener('focus', () => {
            dropdown.style.display = 'block';
        });
        
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        return wrapper;
    }
    
    updateDropdownOptions(selectElement, dropdown, options = null) {
        const items = options || Array.from(selectElement.options);
        
        dropdown.innerHTML = items.map(option => `
            <div class="dropdown-item" data-value="${option.value}">
                ${option.text}
            </div>
        `).join('');
        
        // Gestionnaire de sélection
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.getAttribute('data-value');
                selectElement.value = value;
                
                // Mettre à jour l'input de recherche
                const searchInput = dropdown.previousElementSibling;
                searchInput.value = item.textContent;
                
                dropdown.style.display = 'none';
                
                // Déclencher l'événement change
                selectElement.dispatchEvent(new Event('change'));
            });
        });
    }
    
    /**
     * Affiche une notification toast avancée
     */
    showNotification(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} fade-in`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type]}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="toast-progress"></div>
        `;
        
        const container = document.getElementById('notification-container') || this.createNotificationContainer();
        container.appendChild(toast);
        
        // Animation de progression
        const progress = toast.querySelector('.toast-progress');
        progress.style.animation = `progress ${duration}ms linear`;
        
        // Suppression automatique
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'toastOut 0.3s ease-in forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
        
        return toast;
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }
}

// Initialisation et exposition
window.uiComponents = new UIComponents();

// Intégration avec les fonctions existantes
if (typeof window.showNotification === 'function') {
    // Remplacer la fonction de notification existante
    window.showNotification = function(message, type = 'info') {
        return window.uiComponents.showNotification(message, type);
    };
}

console.log('✅ components.js: Composants d\'interface initialisés');

