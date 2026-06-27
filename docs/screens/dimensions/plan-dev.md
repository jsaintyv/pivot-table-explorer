# Plan de Développement - Dimension Editor Screen

## 📋 Sommaire

- [1. Contexte et Objectifs](#1-contexte-et-objectifs)
- [2. Prérequis](#2-prérequis)
- [3. Architecture Cible](#3-architecture-cible)
- [4. Modèle de Données](#4-modèle-de-données)
- [5. Tâches de Développement](#5-tâches-de-développement)
- [6. Implémentation par Composant](#6-implémentation-par-composant)
- [7. Intégration et Tests](#7-intégration-et-tests)
- [8. Livraison](#8-livraison)
- [9. Points d'Attention](#9-points-dattention)

---

## 1. Contexte et Objectifs

### 1.1 Objectif Principal
Développer l'écran **Dimension Editor** permettant aux utilisateurs de :
- Créer et éditer des dimensions
- Configurer des hiérarchies via **Parent Mode** ou **Generation Mode**
- Associer des colonnes de fichiers CSV à des niveaux hiérarchiques
- Définir des propriétés supplémentaires pour les dimensions

### 1.2 Cas d'Usage Principal
**Référence** : [Configure Hierarchical Dimensions](../../useCases/configureHierarchicalDimension/useCase.md)

**Exemple concret** : Configuration de la dimension **Product** avec :
- Mode : Generation
- Mappings : ParentCode → Racine, ProductCode → Génération 1, Label → Génération 2
- Résultat : Hiérarchie MEM → DDR4/DDR5, GRAPH → NV5050/NV5060

### 1.3 Spécifications
**Référence** : [Dimensions Screen Specification](./screen.md)
**Maquette** : [design.html](./design.html)

---

## 2. Prérequis

### 2.1 Prérequis Techniques
- [x] Projet React + TypeScript configuré
- [x] MobX intégré pour la gestion d'état
- [x] Modèle **Dimension** défini ([dimension.md](../../models/dimension.md))
- [x] Store principal pour les dimensions
- [x] Service de lecture des fichiers CSV
- [x] Routing (react-router-dom) configuré

### 2.2 Prérequis Fonctionnels
- [x] Écran **Main** existant avec bouton "Create Dimension"
- [x] Composants partagés disponibles
- [x] Modèle **DataSource** disponible
- [x] Service de persistance des dimensions

---

## 3. Architecture Cible

### 3.1 Structure des Fichiers
```
src/
├── screens/
│   └── dimensions/
│       ├── DimensionEditorScreen.tsx      # Écran principal
│       ├── DimensionEditorScreen.css      # Styles
│       ├── components/
│       │   ├── DimensionIdentityForm.tsx   # Formulaire identité
│       │   ├── HierarchyModeSelector.tsx    # Sélecteur de mode
│       │   ├── ColumnMappingList.tsx        # Liste des mappings
│       │   ├── ColumnMappingItem.tsx        # Élément de mapping
│       │   ├── PropertyMappingList.tsx      # Liste des propriétés
│       │   ├── PropertyMappingItem.tsx      # Élément de propriété
│       │   └── HierarchyPreview.tsx          # Aperçu hiérarchie
│       └── stores/
│           └── DimensionEditorStore.ts      # Store MobX
└── stores/
    └── contexts/
        └── DimensionEditorContext.tsx      # Contexte
```

### 3.2 Flux de Données
```
User Interaction → Component (React) → Store Actions (MobX) → 
Store State Update → Service Layer → Model → Persistence
```

### 3.3 Pattern MobX/React
- **Store** : Singleton MobX gérant l'état
- **Context** : Propagation du store aux composants
- **Components** : Composants React consommant le store

---

## 4. Modèle de Données

### 4.1 Extension du Modèle Dimension
**Fichier** : `src/models/Dimension.ts`

Nouveaux champs à ajouter :
```typescript
// Dans ColumnMapping
mappingType: 'parentCode' | 'label' | 'property' | 'root' | 'gen1' | 'gen2' | 'gen3';
hierarchyMode: 'parent' | 'generation';

// Nouveau interface
PropertyMapping {
  id: string;
  dataSourceId: string;
  columnIndex: number;
  propertyName: string;
  propertyType: 'string' | 'number' | 'boolean' | 'color' | 'date';
}

// Dans Dimension
hierarchyMode: 'parent' | 'generation';
propertyMappings: PropertyMapping[];
```

### 4.2 Types pour l'Éditeur
**Nouveau fichier** : `src/screens/dimensions/types.ts`

```typescript
export type ParentMappingType = 'parentCode' | 'label' | 'property';
export type GenerationMappingType = 'root' | 'gen1' | 'gen2' | 'gen3' | 'label' | 'property';
export type MappingType = ParentMappingType | GenerationMappingType;

export interface DataSourceOption {
  id: string;
  name: string;
  columns: string[];
}
```

---

## 5. Tâches de Développement

### Phase 1 : Préparation (2-4h)
| ID | Tâche | Durée | Dépendances |
|----|-------|-------|-------------|
| DIM-001 | Créer structure dossiers `src/screens/dimensions/` | 0.5h | Aucune |
| DIM-002 | Mettre à jour modèle Dimension | 1h | DIM-001 |
| DIM-003 | Créer types.ts spécifiques | 0.5h | DIM-002 |
| DIM-004 | Configurer routing `/dimensions/:id?` | 1h | DIM-001 |
| DIM-005 | Créer store DimensionEditorStore | 2h | DIM-002, DIM-003 |

### Phase 2 : Store et Logique (4-6h)
| ID | Tâche | Durée | Dépendances |
|----|-------|-------|-------------|
| DIM-010 | Implémenter actions du store | 2h | DIM-005 |
| DIM-011 | Gestion column mappings | 1.5h | DIM-010 |
| DIM-012 | Gestion property mappings | 1h | DIM-010 |
| DIM-013 | Logique changement de mode | 1h | DIM-011, DIM-012 |
| DIM-014 | Validation des données | 1h | DIM-013 |
| DIM-015 | Intégration persistance | 0.5h | DIM-014 |

### Phase 3 : Écran Principal (2-3h)
| ID | Tâche | Durée | Dépendances |
|----|-------|-------|-------------|
| DIM-020 | Créer DimensionEditorScreen | 1h | DIM-015 |
| DIM-021 | Intégrer store via contexte | 0.5h | DIM-020 |
| DIM-022 | Ajouter layout principal | 1h | DIM-021 |
| DIM-023 | Connecter boutons Back/Save | 0.5h | DIM-022 |

### Phase 4 : Composants (6-8h)
| ID | Tâche | Durée | Dépendances |
|----|-------|-------|-------------|
| DIM-030 | DimensionIdentityForm | 2h | DIM-020 |
| DIM-031 | HierarchyModeSelector | 1h | DIM-020 |
| DIM-032 | ColumnMappingList | 2h | DIM-030 |
| DIM-033 | ColumnMappingItem | 2h | DIM-032 |
| DIM-034 | PropertyMappingList | 1h | DIM-030 |
| DIM-035 | PropertyMappingItem | 1h | DIM-034 |
| DIM-036 | HierarchyPreview | 1.5h | DIM-033 |

### Phase 5 : Intégration (4-6h)
| ID | Tâche | Durée | Dépendances |
|----|-------|-------|-------------|
| DIM-040 | Intégrer tous composants | 2h | DIM-036 |
| DIM-041 | Tester changement de mode | 1h | DIM-040 |
| DIM-042 | Vérifier validation | 1h | DIM-040 |
| DIM-043 | Tester persistance | 1h | DIM-042 |
| DIM-044 | Tester cas Product Dimension | 1h | DIM-043 |

### Phase 6 : Tests (3-4h)
| ID | Tâche | Durée | Dépendances |
|----|-------|-------|-------------|
| DIM-050 | Tests unitaires store | 1.5h | DIM-015 |
| DIM-051 | Tests unitaires composants | 1.5h | DIM-036 |
| DIM-052 | Test E2E workflow | 1h | DIM-044 |

---

## 6. Implémentation par Composant

### DimensionIdentityForm
**Fonctionnalités** : Name, Description, Data Type, Hierarchy Mode

### ColumnMappingItem
**Logique Mapping Types** :
```typescript
const getMappingTypeOptions = (mode: 'parent' | 'generation') => 
  mode === 'parent' 
    ? ['parentCode', 'label', 'property']
    : ['root', 'gen1', 'gen2', 'gen3', 'label', 'property'];
```

### HierarchyPreview
**Algorithme** : Construire l'arbre basé sur les mappings configurés

---

## 7. Intégration et Tests

### 7.1 Tests Unitaires
- Store : validation, changement de mode, gestion mappings
- Composants : rendu, interactions

### 7.2 Test E2E
**Fichier** : `tests/dimension-editor.spec.ts`

Scénarios principaux :
- Création dimension en mode Generation
- Changement Parent ↔ Generation
- Ajout/suppression mappings et properties
- Sauvegarde et validation

---

## 8. Livraison

### Checklist
- [ ] `npx tsc --noEmit` (OK)
- [ ] `npm run test` (OK)
- [ ] `npx playwright test` (OK)
- [ ] `npm run build` (OK)
- [ ] Vérification manuelle
- [ ] Documentation à jour

### Critères d'Acceptation
| Critère | Statut |
|---------|--------|
| Mode Parent fonctionnel | ⏳ |
| Mode Generation fonctionnel | ⏳ |
| Mapping Types dynamiques | ⏳ |
| Column Mappings sauvegardés | ⏳ |
| Property Mappings gérés | ⏳ |
| Hierarchy Preview mis à jour | ⏳ |
| Navigation fonctionnelle | ⏳ |
| Persistance correcte | ⏳ |

---

## 9. Points d'Attention

### Risques
| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Complexité logique | Moyenne | Élevé | Tests + revue code |
| Incompatibilité modèle | Moyenne | Élevé | Revue avant merge |

### Décisions Architecture
1. **Centralisation Store** : Logique métiers dans le store
2. **Séparation Concerns** : Composants ≠ Logique
3. **Immutabilité** : Nouveaux objets pour updates
4. **Types Stricts** : String literals unions

### Améliorations Futures
- Drag & Drop pour mappings
- Import/Export configurations
- Prévisualisation données
- Validation avancée (cycles)

---

## Timeline
| Phase | Durée | Tâches |
|-------|-------|--------|
| Phase 1 | 2-4h | 5 |
| Phase 2 | 4-6h | 6 |
| Phase 3 | 2-3h | 4 |
| Phase 4 | 6-8h | 7 |
| Phase 5 | 4-6h | 5 |
| Phase 6 | 3-4h | 3 |
| **Total** | **21-31h** | **30** |

---

**Prochaine étape** : Valider ce plan et commencer Phase 1 (DIM-001 à DIM-005).
