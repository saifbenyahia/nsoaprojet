# 🧑‍💼 Système de Gestion de Personnes

Application web full-stack pour la gestion de base de données du personnel.

## 📋 Table des Matières

- [Aperçu](#aperçu)
- [Technologies](#technologies)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Structure du Projet](#structure-du-projet)

## 🎯 Aperçu

Application de gestion de personnes permettant d'effectuer des opérations CRUD sur une base de données MySQL avec un backend REST API en Java et un frontend React.

**Fonctionnalités principales :**
- Création, lecture, mise à jour et suppression de personnes
- Recherche par nom et département
- Validation des données
- Interface responsive

## 🛠️ Technologies

**Backend :**
- Java (JAX-RS/Jersey) - API REST
- JPA/Hibernate - ORM
- MySQL - Base de données
- Apache Tomcat - Serveur

**Frontend :**
- React 18
- Tailwind CSS
- Lucide React (icônes)

## 📦 Installation

### Prérequis
- Java JDK 8+
- MySQL 5.7+
- Node.js 16+
- Apache Tomcat 9+

### 1. Base de Données

```sql
CREATE DATABASE person_db;
USE person_db;
```

### 2. Backend

```bash
# Configuration dans persistence.xml
# Modifier les paramètres MySQL si nécessaire
<property name="javax.persistence.jdbc.user" value="root" />
<property name="javax.persistence.jdbc.password" value="votre_password" />

# Déployer le WAR sur Tomcat
# Copier Person_backend.war dans tomcat/webapps/
```

### 3. Frontend

```bash
cd front
npm install
npm run dev
```

**Accès :** `http://localhost:5173`

## 🔌 API Endpoints

**Base URL :** `http://localhost:8080/Person_backend/api/persons`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/persons` | Toutes les personnes |
| `GET` | `/persons/{id}` | Personne par ID |
| `GET` | `/persons/search?name={name}` | Recherche par nom |
| `GET` | `/persons/department?name={dept}` | Recherche par département |
| `POST` | `/persons` | Créer une personne |
| `PUT` | `/persons/{id}` | Mettre à jour |
| `DELETE` | `/persons/{id}` | Supprimer |

### Exemple - Créer une Personne

```bash
curl -X POST http://localhost:8080/Person_backend/api/persons \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 30,
    "nom": "Doe",
    "prenom": "John",
    "email": "john.doe@example.com",
    "telephone": "+33612345678",
    "poste": "Développeur",
    "departement": "IT",
    "dateEmbauche": "2024-01-15"
  }'
```

## 📁 Structure du Projet

```
.
├── back/Person_backend/
│   └── src/
│       ├── META-INF/
│       │   └── persistence.xml          # Config JPA
│       └── com/person_back/
│           ├── config/
│           │   └── SimpleCORSFilter.java
│           ├── dao/
│           │   └── PersonDAO.java
│           ├── model/
│           │   └── Person.java
│           └── rest/
│               └── PersonResource.java
│
└── front/
    ├── src/
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

### Table `persons` (MySQL)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGINT | ID auto-généré |
| `name` | VARCHAR | Nom complet |
| `age` | INT | Âge |
| `nom` | VARCHAR | Nom de famille |
| `prenom` | VARCHAR | Prénom |
| `email` | VARCHAR | Email (unique) |
| `telephone` | VARCHAR | Téléphone (optionnel) |
| `poste` | VARCHAR | Poste (optionnel) |
| `departement` | VARCHAR | Département (optionnel) |
| `date_embauche` | VARCHAR | Date embauche (optionnel) |

---

**Développé dans le cadre d'un projet académique**
