# GoGift 🎁 - Avis Google & Roue Cadeaux

Application web complète de gamification et de collecte d'avis clients pour restaurants et commerces.

## 🌟 Fonctionnalités

1. **Parcours Client (Mobile-First / QR Code)** :
   - Évaluation par étoiles interactive.
   - **Aiguillage intelligent** :
     - $\ge 4$ ou 5 étoiles $\to$ Redirection vers la page Google Reviews pour booster les avis publics 5★.
     - $< 4$ étoiles $\to$ Formulaire de réclamation privé adressé directement à la direction (désamorçage des avis négatifs).
   - **Roue de la Fortune animée** avec segments colorés dynamiques, effets sonores et probabilités configurables.
   - **Coupon Gagnant** avec compte à rebours de validité de 30 minutes, code unique (`WIN-XXXX`) et QR Code.

2. **Espace Serveur / Caisse (`/staff`)** :
   - Scanner de QR Code par caméra en direct ou saisie rapide du code coupon.
   - Vérification instantanée du statut (Valide, Expiré, Déjà utilisé).
   - Bouton 1-clic pour valider et encaisser le lot.

3. **Tableau de Bord Administrateur (`/admin`)** :
   - Statistiques & taux de conversion des avis (Google vs Privés).
   - Gestion des lots (probabilités %, stocks max, icônes, couleurs).
   - Boîte de réception des avis privés clients avec gestion des statuts (En attente, Traité, Archivé) et rappel en 1 clic.
   - Historique d'audit complet de tous les coupons émis.
   - Paramètres de l'établissement (Nom, lien Google Reviews, seuil d'étoiles, logo, couleur de marque).
   - Générateur de supports de table / chevalets prêts à imprimer.

---

## 🛠️ Démarrage Rapide

### 1. Variables d'environnement
Le fichier `.env` est déjà préconfiguré avec votre instance Supabase :
```env
VITE_SUPABASE_URL=https://kphlutovrlvdddolxevc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Base de données Supabase
Le schéma SQL complet est disponible dans `supabase/schema.sql`.

### 3. Lancer le serveur de développement
```bash
npm run dev
```

### 4. Compiler pour la production
```bash
npm run build
```

---

## 📱 URLs de l'application

- `/` : Parcours client (à mettre derrière le QR code des tables)
- `/staff` (ou `/valider`) : Interface de validation serveur / caisse
- `/admin` : Tableau de bord gérant & paramétrage
