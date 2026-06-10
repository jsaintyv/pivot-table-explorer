# Cas de Test - PivotProject

## 📥 Données d'Entrée

### Fichier Customer.csv
```csv
CustomerId;Label
1;Pierre
2;Paul
3;Jacque
```

### Fichier Product.csv
```csv
ProductId;Label
1;Apple
2;Orange
3;Chocolate
```

### Fichier Order.csv
```csv
OrderId;OrderDate;ProductId;CustomerId;Quantity;PriceUnit;Total
1;2026-06-10;1;1;100;10;1000
1;2026-06-10;2;1;10;5;50
2;2026-05-10;1;2;5;20;100
2;2026-05-10;3;2;30;30;900
3;2025-04-01;2;3;50;50;250
4;2025-12-01;1;1;80;10;800
4;2025-12-01;3;1;5;5;25
```

---

## ⚙️ Paramétrage

### 1. Import des fichiers
Les 3 fichiers CSV sont importés comme **LocalDataSource** :
- `ds-customer` ← Customer.csv
- `ds-product` ← Product.csv  
- `ds-order` ← Order.csv

### 2. Déclaration des Dimensions

| Dimension | ID | Type | Source(s) | MetaData |
|-----------|-----|------|----------|-----------|
| Customer | `dim-customer` | string | Customer.csv (col 0), Order.csv (col 3) | `label` (string, requis) |
| Product | `dim-product` | string | Product.csv (col 0), Order.csv (col 2) | `label` (string, requis) |
| Order Date | `dim-order-date` | date | Order.csv (col 1) | - |

**Explication :**
- Chaque dimension utilise une ou plusieurs colonnes de différentes sources
- Les dimensions Customer et Product ont une **MetaData `label`** qui stocke le nom affiché
- La dimension Order Date n'a pas de MetaData

---

## 📊 Résultats de Croisement Attendus

### Pivot 1: ProductId (lignes) × CustomerId (colonnes) × SUM(Total)

| ProductId \ CustomerId | **1 (Pierre)** | **2 (Paul)** | **3 (Jacque)** | **Total** |
|-------------------------|---------------|--------------|---------------|-----------|
| **1 (Apple)** | 1800 | 100 | 0 | **1900** |
| **2 (Orange)** | 50 | 0 | 250 | **300** |
| **3 (Chocolate)** | 25 | 900 | 0 | **925** |
| **Total** | **1875** | **1000** | **250** | **3125** |

**Détail des calculs :**
- **(Apple, Pierre)** = Commande 1 (1000) + Commande 4 (800) = **1800**
- **(Orange, Pierre)** = Commande 1 (50) = **50**
- **(Apple, Paul)** = Commande 2 (100) = **100**
- **(Chocolate, Paul)** = Commande 2 (900) = **900**
- **(Orange, Jacque)** = Commande 3 (250) = **250**
- **(Chocolate, Pierre)** = Commande 4 (25) = **25**

### Pivot 2: OrderDate (lignes) × ProductId (colonnes) × SUM(Total)

| OrderDate \ ProductId | **1 (Apple)** | **2 (Orange)** | **3 (Chocolate)** | **Total** |
|------------------------|---------------|---------------|-----------------|-----------|
| **2025-04-01** | 0 | 250 | 0 | **250** |
| **2025-12-01** | 800 | 0 | 25 | **825** |
| **2026-05-10** | 100 | 0 | 900 | **1000** |
| **2026-06-10** | 1000 | 50 | 0 | **1050** |
| **Total** | **1900** | **300** | **925** | **3125** |

**Détail :**
- **(2026-06-10, Apple)** = 1000 (Commande 1)
- **(2026-06-10, Orange)** = 50 (Commande 1)
- **(2026-05-10, Apple)** = 100 (Commande 2)
- **(2026-05-10, Chocolate)** = 900 (Commande 2)
- **(2025-04-01, Orange)** = 250 (Commande 3)
- **(2025-12-01, Apple)** = 800 (Commande 4)
- **(2025-12-01, Chocolate)** = 25 (Commande 4)

### Pivot 3: CustomerId (lignes) × OrderDate (colonnes) × SUM(Total)

| Customer \ Date | **2025-04-01** | **2025-12-01** | **2026-05-10** | **2026-06-10** | **Total** |
|-----------------|----------------|----------------|----------------|----------------|-----------|
| **1 (Pierre)** | 0 | 825 | 0 | 1050 | **1875** |
| **2 (Paul)** | 0 | 0 | 1000 | 0 | **1000** |
| **3 (Jacque)** | 250 | 0 | 0 | 0 | **250** |
| **Total** | **250** | **825** | **1000** | **1050** | **3125** |

---

## 🎯 Points Clés à Valider

### 1. **Import des données**
- [ ] Les 3 fichiers CSV sont correctement parsés
- [ ] Les DataSources contiennent bien les colonnes et les données
- [ ] Les types de colonnes sont détectés (string, number, date)

### 2. **Déclaration des dimensions**
- [ ] Chaque dimension référence les bonnes colonnes dans les bonnes DataSources
- [ ] Les ColumnMappings sont correctement configurés avec les niveaux
- [ ] Les NodeSchemas définissent correctement les MetaData

### 3. **Création des Nodes**
- [ ] Les Nodes Customer ont bien leur `metaData.label` = "Pierre", "Paul", "Jacque"
- [ ] Les Nodes Product ont bien leur `metaData.label` = "Apple", "Orange", "Chocolate"
- [ ] Les Nodes OrderDate ont bien leur `value` comme objet Date
- [ ] Les `sourceIds` référencent bien toutes les DataSources d'origine

### 4. **Calcul des croisements**
- [ ] Pivot Product × Customer × SUM(Total) donne les résultats attendus
- [ ] Pivot Date × Product × SUM(Total) donne les résultats attendus
- [ ] Les totaux (lignes et colonnes) sont correctement calculés

---

## 📌 Résumé

**Ce cas de test simple permet de valider que :**

1. ✅ Le modèle permet d'importer plusieurs fichiers CSV
2. ✅ Les dimensions peuvent être définies à partir de colonnes de différentes DataSources
3. ✅ Les MetaData sont correctement associées aux Nodes
4. ✅ Les croisements (Views) produisent les bons résultats d'agrégation
5. ✅ Les calculs de sommes et totaux sont corrects

**Total général de toutes les commandes : 3125** (vérification rapide)
