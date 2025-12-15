// js/storage.js

console.log('📦 storage.js: Chargement du gestionnaire de stockage Firebase');

const storageManager = {
    async uploadFile(file, path) {
        if (!window.firebaseServices || !window.firebaseServices.getStorage) {
            throw new Error('Firebase services or Storage not initialized.');
        }

        const user = await window.firebaseServices.requireAuth('upload a file');
        const storageRef = window.firebaseServices.getStorage().ref();
        const userStorageRef = storageRef.child(`users/${user.uid}/${path}`);

        try {
            console.log(`⬆️ storage.js: Début du téléversement de "${file.name}" vers "users/${user.uid}/${path}"`);
            const snapshot = await userStorageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            console.log(`✅ storage.js: Fichier ${file.name} uploadé avec succès. URL: ${downloadURL}`);
            return downloadURL;
        } catch (error) {
            console.error('❌ storage.js: Erreur upload de fichier:', error);
            throw error;
        }
    },

    async deleteFile(fileUrl) {
        if (!window.firebaseServices || !window.firebaseServices.getStorage) {
            throw new Error('Firebase services or Storage not initialized.');
        }

        await window.firebaseServices.requireAuth('delete a file');
        const storageRef = window.firebaseServices.getStorage().refFromURL(fileUrl);

        try {
            console.log(`🗑️ storage.js: Début de la suppression du fichier: "${fileRef.fullPath}"`);
            await storageRef.delete();
            console.log(`✅ storage.js: Fichier ${fileUrl} supprimé avec succès.`);
            return true;
        } catch (error) {
            console.error('❌ storage.js: Erreur suppression de fichier:', error);
            // Handle cases where the file might not exist or user doesn't have permission
            if (error.code === 'storage/object-not-found') {
                console.warn('⚠️ storage.js: Le fichier à supprimer n\'existe pas:', fileUrl);
                return false; // File already gone, consider it "deleted" for idempotency
            }
            throw error;
        }
    }
};

// Export the storageManager globally for access by other modules
if (typeof window !== 'undefined') {
    window.storageManager = storageManager;
    console.log('📦 storage.js: storageManager exporté globalement.');
}