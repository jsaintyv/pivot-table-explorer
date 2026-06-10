# Cas de Test - PivotProject

## Données d'Entrée

### Customer.csv
```csv
CustomerId;Label
1;Pierre
2;Paul
3;Jacque
```

### Product.csv
```csv
ProductId;Label
1;Apple
2;Orange
3;Chocolate
```

### Order.csv
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

## Paramétrage

1. **Créer un PivotProject**
2. **Importer les 3 fichiers CSV** comme LocalDataSource
3. **Déclarer les dimensions** :
   - Dimension CustomerId (type: string) avec MetaData label (string) depuis Customer.csv colonne 0 et Order.csv colonne 3
   - Dimension ProductId (type: string) avec MetaData label (string) depuis Product.csv colonne 0 et Order.csv colonne 2
   - Dimension OrderDate (type: date) depuis Order.csv colonne 1

---

## Résultats de Croisement Attendus

### ProductId (lignes) × CustomerId (colonnes) × SUM(Total)

| ProductId \ CustomerId | 1 (Pierre) | 2 (Paul) | 3 (Jacque) | Total |
|-------------------------|------------|----------|------------|-------|
| 1 (Apple) | 1800 | 100 | 0 | 1900 |
| 2 (Orange) | 50 | 0 | 250 | 300 |
| 3 (Chocolate) | 25 | 900 | 0 | 925 |
| **Total** | **1875** | **1000** | **250** | **3125** |

**Total général de toutes les commandes : 3125**
