# TailorPro - Gestion pour Couturiers

**TailorPro** est une application web complète (Progressive Web App) conçue pour aider les artisans couturiers et les créateurs de mode à gérer efficacement leur activité professionnelle. Elle centralise la gestion des clients, des créations, des commandes et des finances dans une interface intuitive et sécurisée.

## ✨ Fonctionnalités Principales

-   **Tableau de bord :** Vue d'ensemble des statistiques clés (revenus, commandes en cours, nouveaux clients).
-   **Gestion des Créations :**
    -   Catalogue de vos modèles de vêtements et créations.
    -   Calcul des coûts (matériaux, main-d'œuvre) pour définir des prix justes.
    -   Ajout de photos pour chaque création.
-   **Gestion des Clients :**
    -   Fichier clients centralisé avec coordonnées.
    -   Enregistrement des mensurations détaillées pour chaque client.
    -   Historique des commandes par client.
-   **Gestion des Commandes :**
    -   Création de commandes personnalisées associées à un client et une création.
    so   Suivi des statuts (en cours, terminée, payée).
    -   Gestion des paiements et des soldes restants.
-   **Authentification Sécurisée :**
    -   Système d'inscription et de connexion par email/mot de passe.
    -   Connexion via des fournisseurs tiers (Google, Facebook).
    -   Récupération de mot de passe.
    -   Authentification multi-facteurs (MFA) pour une sécurité renforcée.
-   **Support PWA (Progressive Web App) :** L'application peut être "installée" sur un ordinateur ou un mobile pour un accès rapide, comme une application native.
-   **Gestion du Consentement (RGPD) :** Modale de gestion des cookies pour se conformer aux régulations sur la protection des données.

## 🛠️ Structure du Projet

```
/
|-- css/
|   |-- main.css         # Styles principaux
|   |-- auth.css         # Styles pour l'authentification
|   |-- dashboard.css    # Styles pour le tableau de bord
|
|-- js/
|   |-- app.js           # Logique principale de l'application (initialisation, UI)
|   |-- firebase.js      # Configuration de Firebase et des services (Auth, Firestore, UI)
|   |-- render.js        # Fonctions de rendu pour l'affichage des données
|   |-- ui/
|   |   |-- auth.js      # Gestion de l'authentification native (email/password)
|   |   |-- theme.js     # Gestion du thème (clair/sombre)
|   |
|   |-- collections/     # Classes pour la gestion des données (Clients, Commandes, etc.)
|
|-- assets/              # Images, icônes et autres ressources
|
|-- index.html           # Point d'entrée principal de l'application
|-- privacy-policy.html  # Politique de confidentialité
|-- legal-notice.html    # Mentions légales
|-- service-worker.js    # Fichier pour la fonctionnalité PWA
|-- manifest.json        # Manifeste de la PWA
|-- README.md            # Ce fichier
```

## 🚀 Démarrer le Projet

Pour lancer l'application localement, vous n'avez besoin que d'un serveur web simple.

1.  **Prérequis :** Assurez-vous d'avoir un serveur local (comme [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) pour VS Code, ou un serveur Python).

2.  **Lancer avec Python (exemple) :**
    -   Ouvrez un terminal à la racine du projet.
    -   Exécutez la commande : `python -m http.server`
    -   Ouvrez votre navigateur et allez à l'adresse `http://localhost:8000`.

3.  **Dépendances :** Toutes les dépendances (comme Firebase) sont chargées via un CDN directement dans le fichier `index.html` et ne nécessitent pas d'installation via npm ou yarn.
