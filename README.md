# TailorPro - Gestion pour Couturiers

**TailorPro** est une application web complète (Progressive Web App) conçue pour aider les artisans couturiers et les créateurs de mode à gérer efficacement leur activité professionnelle. Elle centralise la gestion des clients, des créations, des commandes et des finances dans une interface intuitive et sécurisée.

## ✨ Fonctionnalités Principales

-   **Tableau de bord :** Vue d'ensemble des statistiques clés (revenus, commandes en cours, clients).
-   **Gestion des Créations :**
    -   Catalogue de vos modèles de vêtements et créations.
    -   Calcul des coûts (matériaux, main-d'œuvre) pour définir des prix justes.
    -   Ajout de photos pour chaque création.
-   **Galerie des Créations :**
    -   Visualisation rapide de toutes les créations avec leurs photos dans une galerie dédiée.
    -   Accès facile pour montrer vos modèles à vos clients.
-   **Gestion des Clients :**
    -   Fichier clients centralisé avec coordonnées et notes.
    -   Historique des commandes par client.
-   **Gestion des Mesures :**
    -   Enregistrement détaillé des mensurations pour chaque client (tour de taille, longueur de bras, etc.).
    -   Création de fiches de mesures réutilisables pour de nouvelles commandes.
-   **Gestion des Commandes :**
    -   Création de commandes personnalisées associées à un client et une création.
    -   Suivi des statuts (en cours, terminée, livrée, etc.).
    -   Gestion des paiements et des soldes restants.
-   **Module Financier :**
    -   Suivi des revenus et des montants dus.
    -   Génération de rapports financiers simples pour analyser la performance de l'activité.
    -   (Bientôt) Création et gestion de factures détaillées.
-   **Authentification Sécurisée :**
    -   Système d'inscription et de connexion par email/mot de passe.
    -   Connexion via des fournisseurs tiers (Google, Facebook) grâce à FirebaseUI.
    -   Récupération de mot de passe.
-   **Support PWA (Progressive Web App) :** L'application peut être "installée" sur un ordinateur ou un mobile pour un accès rapide, comme une application native.
-   **Gestion du Consentement (RGPD) :** Modale de gestion des cookies pour se conformer aux régulations sur la protection des données.

## 🛠️ Structure du Projet

```
/
|-- css/
|   |-- style.css             # Styles globaux
|   |-- components.css        # Styles pour les composants réutilisables
|   |-- responsive.css        # Styles pour l'adaptation aux différentes tailles d'écran
|
|-- js/
|   |-- app.js                  # Logique principale de l'application (initialisation, navigation)
|   |-- firebase.js             # Configuration de Firebase et des services de base
|   |-- firebase-services.js    # Services métier (interface avec Firestore)
|   |-- measurements.js         # Module métier pour la gestion des mesures
|   |-- billing.js              # Module métier pour la facturation et les finances
|   |-- pwa.js                  # Logique du Service Worker et de l'installation PWA
|   |
|   |-- ui/
|   |   |-- auth.js             # Gestion de l'interface utilisateur pour l'authentification
|   |   |-- modals.js           # Gestionnaire central pour toutes les modales
|   |   |-- render.js           # Fonctions de rendu pour les différentes sections
|   |   |-- measurements.js     # Fonctions UI pour la section des mesures
|   |   |-- finances.js         # Fonctions UI pour la section des finances
|   |   |-- settings.js         # Fonctions UI pour les paramètres
|
|-- icons/                    # Icônes de l'application pour la PWA et le favicon
|
|-- index.html                # Point d'entrée principal de l'application
|-- legal-notice.html         # Page des mentions légales
|-- privacy-policy.html       # Page de la politique de confidentialité
|-- terms-of-service.html   # Page des conditions d'utilisation
|-- sw.js                     # Fichier du Service Worker pour le mode hors-ligne
|-- manifest.json             # Fichier manifeste de la PWA
|-- firebase.json             # Configuration pour le déploiement sur Firebase Hosting
|-- README.md                 # Ce fichier
```

## 🚀 Démarrer le Projet

Pour lancer l'application localement, vous n'avez besoin que d'un serveur web simple.

1.  **Prérequis :** Assurez-vous d'avoir un serveur local (comme l'extension [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) pour VS Code, ou un serveur Python).

2.  **Lancer avec Python (exemple) :**
    -   Ouvrez un terminal à la racine du projet.
    -   Exécutez la commande : `python -m http.server`
    -   Ouvrez votre navigateur et allez à l'adresse `http://localhost:8000`.

3.  **Dépendances :** Toutes les dépendances (comme Firebase) sont chargées via un CDN directement dans le fichier `index.html` et ne nécessitent pas d'installation locale via npm ou yarn.
