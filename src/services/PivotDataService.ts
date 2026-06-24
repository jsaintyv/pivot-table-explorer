import type { Dimension, LocalDataSource, Measure, View, FilterDimension } from "../models/pivot-project/types";
import type { PivotData, PivotAxe, PivotCell, PivotCellMap, PivotAxeHierarchy, PivotAxeHierarchyNode, Tuple, RowData } from "../models/pivot-data/pivot-data";
import { PivotProjectService } from "./PivotProjectService";

// Constante pour les totaux
export const TOTAL = "__TOTAL__";

// ============================================================================
// AGGREGATION UTILITIES
// ============================================================================

/**
 * Type d'agrégation supporté
 */
export type AggregationType = 'sum' | 'average' | 'count' | 'min' | 'max' | 'first' | 'last';

// ============================================================================
// PIVOT DATA SERVICE INTERFACES
// ============================================================================

/**
 * Interface définissant les suppliers nécessaires pour construire les données pivot
 * Cela permet de tester unitairement le service sans dépendre de ViewStore
 */
export interface PivotDataServiceSuppliers {
  /**
   * Fournit la vue à partir de laquelle construire les données
   */
  getView: () => View | undefined;
  
  /**
   * Fournit toutes les data sources locales
   */
  getLocalDataSources: () => LocalDataSource[];
  
  /**
   * Fournit une dimension par son ID
   */
  getDimension: (dimensionId: string) => Dimension | undefined;
  
  /**
   * Fournit toutes les dimensions
   */
  getDimensions: () => Dimension[];
}

// ============================================================================
// PIVOT DATA SERVICE
// ============================================================================

/**
 * Service dédié à la construction des données pivot
 * 
 * Ce service est conçu pour être testable unitairement en fournissant
 * des suppliers mockés via l'interface PivotDataServiceSuppliers.
 */
export class PivotDataService {
  
  /**
   * Applique une agrégation à une liste de valeurs
   * @param values Liste des valeurs à agréger
   * @param aggregation Type d'agrégation à appliquer
   * @returns Valeur agrégée
   */
  static applyAggregation(values: number[], aggregation: string): number {
    const count = values.length;
    
    if (count === 0) {
      return 0;
    }
    
    switch (aggregation) {
      case 'average':
        return values.reduce((a, b) => a + b, 0) / count;
      case 'count':
        return count;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'first':
        return values[0];
      case 'last':
        return values[count - 1];
      case 'sum':
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  }

  // ============================================================================
  // HIERARCHY BUILDING UTILITIES
  // ============================================================================

  /**
   * Builds a hierarchy from a list of axe keys and dimensions
   * Each axe key is a semicolon-separated string of dimension values (e.g., "2024;1;Tool A")
   * 
   * @param axeKeys List of axe keys (e.g., ["2024;1", "2024;2", "2025;1"])
   * @param dimensions Ordered list of dimensions that form the hierarchy
   * @returns Hierarchy of nodes
   */
  static buildHierarchyFromAxeKeys(
    axeKeys: string[],
    dimensions: Dimension[]
  ): PivotAxeHierarchy {
    const rootNodes: PivotAxeHierarchyNode[] = [];
    const nodeMap: Map<string, PivotAxeHierarchyNode> = new Map();
    
    // Sort axe keys for consistent ordering
    const sortedAxeKeys = [...axeKeys].sort();
    
    for (const axeKey of sortedAxeKeys) {
      const parts = axeKey.split(';');
      let currentParent: PivotAxeHierarchyNode | null = null;
      let currentPath = '';
      
      for (let level = 0; level < parts.length; level++) {
        const part = parts[level];
        const dimension = dimensions[level];
        const dimensionId = dimension?.id || `unknown-${level}`;
        
        // Look up the display value from the dimension's nodes
        let displayValue = part;
        if (dimension) {
          const node = dimension.nodes.find(n => n.code === part);
          if (node) {
            displayValue = String(node.value);
          }
        }
        
        const nodeKey = currentPath ? `${currentPath};${part}` : part;
        
        let node = nodeMap.get(nodeKey);
        if (!node) {
          node = {
            key: nodeKey,
            value: displayValue,
            level,
            dimensionId,
            leaf: level === parts.length - 1,
            children: []
          };
          nodeMap.set(nodeKey, node);
          
          if (currentParent) {
            currentParent.children!.push(node);
          } else {
            rootNodes.push(node);
          }
        }
        
        currentParent = node;
        currentPath = nodeKey;
      }
    }
    
    return rootNodes;
  }

  /**
   * Builds column hierarchy with measures as the final level
   * Column hierarchy: Dimension1 -> Dimension2 -> ... -> Measure
   * 
   * @param columnAxeKeys List of column axe keys (without measures)
   * @param dimensions Ordered list of column dimensions
   * @param measures List of measures to append as the final level
   * @returns Hierarchy of column nodes including measures
   */
  static buildColumnHierarchyWithMeasures(
    columnAxeKeys: string[],
    dimensions: Dimension[],
    measures: Measure[]
  ): PivotAxeHierarchy {
    if (columnAxeKeys.length === 0 && measures.length === 0) {
      return [];
    }
    
    // If there are column dimensions, build hierarchy from them
    if (columnAxeKeys.length > 0) {
      const baseHierarchy = this.buildHierarchyFromAxeKeys(
        columnAxeKeys,
        dimensions
      );
      
      // Add measures as children to each leaf node
      if (measures.length > 0) {
        // Find all leaf nodes in the hierarchy
        function findLeafNodes(nodes: PivotAxeHierarchyNode[]): PivotAxeHierarchyNode[] {
          const leaves: PivotAxeHierarchyNode[] = [];
          for (const node of nodes) {
            if (node.leaf && (!node.children || node.children.length === 0)) {
              leaves.push(node);
            }
            if (node.children && node.children.length > 0) {
              leaves.push(...findLeafNodes(node.children));
            }
          }
          return leaves;
        }
        
        const leaves = findLeafNodes(baseHierarchy);
        
        // Add each measure as a child to each leaf
        for (const leaf of leaves) {
          leaf.leaf = false;
          leaf.children = leaf.children || [];
          
          for (const measure of measures) {
            const measureNode: PivotAxeHierarchyNode = {
              key: `${leaf.key};${measure.id}`,
              value: measure.name,
              level: leaf.level + 1,
              dimensionId: `measure:${measure.id}`,
              leaf: true,
              children: []
            };
            leaf.children.push(measureNode);
          }
        }
        
        return baseHierarchy;
      }
      
      return baseHierarchy;
    }
    
    // If no column dimensions, create hierarchy from measures only
    const measureHierarchy: PivotAxeHierarchyNode[] = [];
    for (const measure of measures) {
      measureHierarchy.push({
        key: measure.id,
        value: measure.name,
        level: 0,
        dimensionId: `measure:${measure.id}`,
        leaf: true,
        children: []
      });
    }
    
    return measureHierarchy;
  }

  /**
   * Construit les données pivot à partir d'une vue et des suppliers
   * 
   * @param suppliers Les suppliers nécessaires pour accéder aux données
   * @returns Les données pivot construites
   */
  static buildPivotData(
    suppliers: PivotDataServiceSuppliers
  ): PivotData {
    const view = suppliers.getView();
    if (!view) {
      return {
        rows: [],
        columns: [],
        measures: [],
        pivotCellByColKeyByRowKeyByMeasureId: new Map()
      };
    }
    
    const includeTotals = view.showTotals;
    const includeGrandTotal = view.showGrandTotal;
    
    // Si pas de dimensions ou pas de mesures, retourner vide
    if (view.rowDimensions.length === 0 || view.measures.length === 0) {
      return {
        rows: [],
        columns: [],
        measures: [],
        pivotCellByColKeyByRowKeyByMeasureId: new Map()
      };
    }
    
    // Récupérer toutes les données des DataSources locales
    const localDataSources = suppliers.getLocalDataSources();
    
    if (localDataSources.length === 0) {
      return {
        rows: [],
        columns: [],
        measures: [],
        pivotCellByColKeyByRowKeyByMeasureId: new Map()
      };
    }
    
    // Récupérer les dimensions pour les lignes et colonnes
    const rowDimensions = view.rowDimensions
      .map(id => suppliers.getDimension(id))
      .filter(Boolean) as Dimension[];
    
    const colDimensions = view.columnDimensions
      .map(id => suppliers.getDimension(id))
      .filter(Boolean) as Dimension[];

    const allRowsKey : Set<string> = new Set();
    const allColumnsKey : Set<string> = new Set();
    const allRows: PivotAxe[] = [];
    const allColumns: PivotAxe[] = [];
    const pivotCellByColKeyByRowKeyByMeasureId: PivotCellMap = new Map();

    for(const measure of view.measures) {
      // Récupérer la data source de la mesure
      const dataSource = localDataSources.find(ds => ds.id === measure.source.dataSourceId);
      if(! dataSource) {
        continue;
      }
      
      // Créer une map pour trouver la colonne d'une dimension dans la data source
      const dimensionToColumnIndex: Map<string, number> = new Map();
      for (const dimId of [...view.rowDimensions, ...view.columnDimensions]) {
        const dimension = suppliers.getDimension(dimId);
        if (dimension) {
          // Prendre le premier column mapping
          const mapping = dimension.columnMappings[0];
          if (mapping) {
            dimensionToColumnIndex.set(dimId, mapping.columnIndex);
          }
        }
      }
      
      // Étape 1: Filtrer les lignes dataSource qui matchent les filtres
      const filteredRows = PivotProjectService.filterDataSourceRows(
          dataSource,
          dimensionToColumnIndex,
          view.filterDimensions || [],
          suppliers.getDimension
      );
      
      // Étape 2: Construire la liste RowData à partir des lignes filtrées
      const rowDataList = PivotProjectService.buildRowDataList(
          filteredRows,
          measure,
          rowDimensions,
          colDimensions,
          dimensionToColumnIndex
      );
      
      // Étape 3: Construire les listes de tuples de colonnes et lignes uniques                     
      let pivotCellByColKeyByRowKey = pivotCellByColKeyByRowKeyByMeasureId.get(measure.id);
      if(! pivotCellByColKeyByRowKey) {
        pivotCellByColKeyByRowKey = new Map();
        pivotCellByColKeyByRowKeyByMeasureId.set(measure.id, pivotCellByColKeyByRowKey);
      }
      
      for(let row of rowDataList) {
        const rowKey = row.tupleRows.join(";")
        const colKey = row.tupleColumns.join(";")
        if(! allRowsKey.has(rowKey)) {
          allRowsKey.add(rowKey);
          allRows.push({axeKey: rowKey});   
        }
        if(! allColumnsKey.has(colKey)) {
          allColumnsKey.add(colKey);
          allColumns.push({axeKey: colKey});
        }

        let pivotCellByColKey = pivotCellByColKeyByRowKey.get(rowKey);
        if(! pivotCellByColKey) {
          pivotCellByColKey = new Map();
          pivotCellByColKeyByRowKey.set(rowKey, pivotCellByColKey);
        }
        pivotCellByColKey.set(colKey, {
            colAxeKey: colKey,
            rowAxeKey: rowKey,
            value: row.value,
            formattedValue: "" + row.value
        });
      }
    }

    // Ajouter les totaux pour les lignes et colonnes
    if (includeTotals) {
      for(let measure of view.measures) {
        const measureId = measure.id;
        let pivotCellByColKeyByRowKey = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
        if(! pivotCellByColKeyByRowKey) {
          continue;
        }
        
        // Calculer les totaux par ligne (colonne TOTAL)
        for(let row of allRows) {
          const rowKey = row.axeKey;
          let pivotCellByColKey = pivotCellByColKeyByRowKey.get(rowKey);
          if(! pivotCellByColKey) {
            continue;
          }
          
          // Calculer le total pour cette ligne en sommant toutes les colonnes
          const values: number[] = [];
          for(let col of allColumns) {
            const colKey = col.axeKey;
            const cell = pivotCellByColKey.get(colKey);
            if(cell && typeof cell.value === 'number' && !isNaN(cell.value)) {
              values.push(cell.value);
            }
          }
          
          if(values.length > 0) {
            // Appliquer l'agrégation
            let totalValue = PivotDataService.applyAggregation(values, measure.aggregation);
            
            // Ajouter la cellule de total pour cette ligne
            pivotCellByColKey.set(TOTAL, {
              colAxeKey: TOTAL,
              rowAxeKey: rowKey,
              value: totalValue,
              formattedValue: "" + totalValue,
              isTotal: true
            });
          }
        }
        
        // Calculer les totaux par colonne (ligne TOTAL)
        for(let col of allColumns) {
          const colKey = col.axeKey;
          const values: number[] = [];
          
          for(let row of allRows) {
            const rowKey = row.axeKey;
            let pivotCellByColKey = pivotCellByColKeyByRowKey.get(rowKey);
            if(! pivotCellByColKey) {
              continue;
            }
            const cell = pivotCellByColKey.get(colKey);
            if(cell && typeof cell.value === 'number' && !isNaN(cell.value)) {
              values.push(cell.value);
            }
          }
          
          if(values.length > 0) {
            // Appliquer l'agrégation
            let totalValue = PivotDataService.applyAggregation(values, measure.aggregation);
            
            // Ajouter la cellule de total pour cette colonne dans la ligne TOTAL
            let totalRowCells = pivotCellByColKeyByRowKey.get(TOTAL);
            if(! totalRowCells) {
              totalRowCells = new Map();
              pivotCellByColKeyByRowKey.set(TOTAL, totalRowCells);
            }
            
            totalRowCells.set(colKey, {
              colAxeKey: colKey,
              rowAxeKey: TOTAL,
              value: totalValue,
              formattedValue: "" + totalValue,
              isTotal: true
            });
          }
        }
        
        // Calculer le grand total (cellule TOTAL x TOTAL)
        if (includeGrandTotal) {
          const grandTotalValues: number[] = [];
          
          // On prend la somme des totaux par colonne
          let totalRowCells = pivotCellByColKeyByRowKey.get(TOTAL);
          if(totalRowCells) {
            for(let col of allColumns) {
              const colKey = col.axeKey;
              const cell = totalRowCells.get(colKey);
              if(cell && typeof cell.value === 'number' && !isNaN(cell.value)) {
                grandTotalValues.push(cell.value);
              }
            }
          }
          
          if(grandTotalValues.length > 0) {
            let grandTotalValue = PivotDataService.applyAggregation(grandTotalValues, measure.aggregation);
            
            totalRowCells = pivotCellByColKeyByRowKey.get(TOTAL);
            if(! totalRowCells) {
              totalRowCells = new Map();
              pivotCellByColKeyByRowKey.set(TOTAL, totalRowCells);
            }
            
            totalRowCells.set(TOTAL, {
              colAxeKey: TOTAL,
              rowAxeKey: TOTAL,
              value: grandTotalValue,
              formattedValue: "" + grandTotalValue,
              isTotal: true
            });
          }
        }
      }

      // Ajouter les axes TOTAL
      allRows.push({ axeKey: TOTAL });
      allColumns.push({ axeKey: TOTAL });
    }

    // Sort allRows & allColumns by axeKey (ordre naturel) - TOTAL sera à la fin
    const sortedRows = allRows.sort((a,b) => a.axeKey.localeCompare(b.axeKey));
    const sortedColumns = allColumns.sort((a,b) => a.axeKey.localeCompare(b.axeKey));
    
    // Build hierarchies
    const rowAxeKeys = sortedRows.map(r => r.axeKey).filter(k => k !== TOTAL);
    const columnAxeKeys = sortedColumns.map(c => c.axeKey).filter(k => k !== TOTAL);
    
    const rowHierarchy = PivotDataService.buildHierarchyFromAxeKeys(
      rowAxeKeys,
      rowDimensions
    );
    
    const columnHierarchy = PivotDataService.buildColumnHierarchyWithMeasures(
      columnAxeKeys,
      colDimensions,
      view.measures
    );
    
    const result = {
      rows: sortedRows,
      columns: sortedColumns,
      measures: view.measures.map(m => m.id),
      rowHierarchy,
      columnHierarchy,
      pivotCellByColKeyByRowKeyByMeasureId,
    };

    
    return result;
  }
}
