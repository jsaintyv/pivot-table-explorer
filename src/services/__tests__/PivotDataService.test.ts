import { describe, it, expect, beforeEach } from 'vitest';
import { PivotDataService, TOTAL } from '../PivotDataService';
import type { PivotDataServiceSuppliers } from '../PivotDataService';
import type { View, Dimension, Measure, LocalDataSource, FilterDimension } from '../../models/pivot-project/types';
import type { Tuple, RowData } from '../../models/pivot-data/pivot-data';

/**
 * Test unitaires pour PivotDataService
 * 
 * Ces tests vérifient que la méthode buildPivotData fonctionne correctement
 * avec différents scénarios : données simples, avec filtres, avec plusieurs mesures, etc.
 */

describe('PivotDataService', () => {
  
  // ============================================================================
  // FIXTURES - Jeu de données simple pour les tests
  // ============================================================================
  
  const createTestView = (overrides: Partial<View> = {}): View => ({
    id: 'test-view',
    name: 'Test View',
    rowDimensions: ['city'],
    columnDimensions: ['year'],
    measures: [
      {
        id: 'sales',
        name: 'Sales',
        source: {
          type: 'column',
          dataSourceId: 'test-ds',
          columnIndex: 2
        },
        aggregation: 'sum',
        visible: true
      }
    ],
    filterDimensions: [],
    showTotals: true,
    showGrandTotal: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  });

  const createTestDimensions = (): Dimension[] => [
    {
      id: 'city',
      name: 'City',
      dataType: 'string',
      columnMappings: [{ dataSourceId: 'test-ds', columnIndex: 0, level: 0 }],
      rootNodes: [],
      nodes: [
        { id: 'city-1', dimensionId: 'city', code: 'PAR', value: 'Paris', metaData: {}, children: [], sourceIds: [] },
        { id: 'city-2', dimensionId: 'city', code: 'ROU', value: 'Rouen', metaData: {}, children: [], sourceIds: [] },
        { id: 'city-3', dimensionId: 'city', code: 'PER', value: 'Perpignan', metaData: {}, children: [], sourceIds: [] }
      ]
    },
    {
      id: 'year',
      name: 'Year',
      dataType: 'string',
      columnMappings: [{ dataSourceId: 'test-ds', columnIndex: 1, level: 0 }],
      rootNodes: [],
      nodes: [
        { id: 'year-1', dimensionId: 'year', code: '2023', value: '2023', metaData: {}, children: [], sourceIds: [] },
        { id: 'year-2', dimensionId: 'year', code: '2024', value: '2024', metaData: {}, children: [], sourceIds: [] }
      ]
    }
  ];

  const createTestDataSource = (data: any[][] = []): LocalDataSource => ({
    id: 'test-ds',
    name: 'Test Data Source',
    type: 'local',
    originalFormat: 'csv',
    loadedAt: new Date().toISOString(),
    columns: [
      { index: 0, name: 'City', dataType: 'string', nullable: false, unique: false },
      { index: 1, name: 'Year', dataType: 'string', nullable: false, unique: false },
      { index: 2, name: 'Sales', dataType: 'number', nullable: false, unique: false }
    ],
    data
  });

  const createSuppliers = (
    view: View,
    dimensions: Dimension[],
    dataSources: LocalDataSource[]
  ): PivotDataServiceSuppliers => ({
    getView: () => view,
    getLocalDataSources: () => dataSources,
    getDimension: (id: string) => dimensions.find(d => d.id === id),
    getDimensions: () => dimensions
  });

  // ============================================================================
  // TESTS
  // ============================================================================

  describe('buildPivotData - Scénario de base', () => {
    it('devrait retourner des données vides si pas de vue', () => {
      const suppliers: PivotDataServiceSuppliers = {
        getView: () => undefined,
        getLocalDataSources: () => [],
        getDimension: () => undefined,
        getDimensions: () => []
      };

      const result = PivotDataService.buildPivotData(suppliers);

      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([]);
      expect(result.measures).toEqual([]);
      expect(result.pivotCellByColKeyByRowKeyByMeasureId.size).toBe(0);
    });

    it('devrait retourner des données vides si pas de dimensions de ligne', () => {
      const view = createTestView({ rowDimensions: [] });
      const dimensions = createTestDimensions();
      const dataSource = createTestDataSource();
      const suppliers = createSuppliers(view, dimensions, [dataSource]);

      const result = PivotDataService.buildPivotData(suppliers);

      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([]);
    });

    it('devrait retourner des données vides si pas de mesures', () => {
      const view = createTestView({ measures: [] });
      const dimensions = createTestDimensions();
      const dataSource = createTestDataSource();
      const suppliers = createSuppliers(view, dimensions, [dataSource]);

      const result = PivotDataService.buildPivotData(suppliers);

      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([]);
      expect(result.measures).toEqual([]);
    });

    it('devrait retourner des données vides si pas de data sources locales', () => {
      const view = createTestView();
      const dimensions = createTestDimensions();
      const suppliers = createSuppliers(view, dimensions, []);

      const result = PivotDataService.buildPivotData(suppliers);

      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([]);
    });
  });

  describe('buildPivotData - Scénario simple sans totaux', () => {
    it('devrait construire les données pivot de base sans totaux', () => {
      const view = createTestView();
      const dimensions = createTestDimensions();
      
      // Données : [City, Year, Sales]
      const data = [
        ['Paris', '2023', 100],
        ['Paris', '2024', 150],
        ['Rouen', '2023', 200],
        ['Rouen', '2024', 250],
        ['Perpignan', '2023', 300],
        ['Perpignan', '2024', 350]
      ];
      
      const viewWithoutTotals = createTestView({ showTotals: false, showGrandTotal: false });
      const dataSource = createTestDataSource(data);
      const suppliers = createSuppliers(viewWithoutTotals, dimensions, [dataSource]);

      const result = PivotDataService.buildPivotData(suppliers);

      // Vérifier les axes      
      expect(result.rows.length).toBe(3);
      expect(result.rows.map(r => r.axeKey)).toContain('Paris');
      expect(result.rows.map(r => r.axeKey)).toContain('Rouen');
      expect(result.rows.map(r => r.axeKey)).toContain('Perpignan');

      expect(result.columns.length).toBe(2);
      expect(result.columns.map(c => c.axeKey)).toContain('2023');
      expect(result.columns.map(c => c.axeKey)).toContain('2024');

      // Vérifier les mesures
      expect(result.measures).toEqual(['sales']);

      // Vérifier les cellules
      const pivotMap = result.pivotCellByColKeyByRowKeyByMeasureId;
      expect(pivotMap.size).toBe(1);
      
      const salesMap = pivotMap.get('sales');
      expect(salesMap).toBeDefined();
      
      // Vérifier la cellule Paris x 2023
      const parisRow = salesMap?.get('Paris');
      expect(parisRow?.get('2023')?.value).toBe(100);
      
      // Vérifier la cellule Rouen x 2024
      const rouenRow = salesMap?.get('Rouen');
      expect(rouenRow?.get('2024')?.value).toBe(250);
    });
  });

  describe('buildPivotData - Scénario avec totaux', () => {
    it('devrait inclure les totaux par ligne et colonne', () => {
      const view = createTestView();
      const dimensions = createTestDimensions();
      
      // Données : [City, Year, Sales]
      const data = [
        ['Paris', '2023', 100],
        ['Paris', '2024', 150],
        ['Rouen', '2023', 200],
        ['Rouen', '2024', 250]
      ];
      
      const viewWithTotals = createTestView({ showTotals: true, showGrandTotal: true });
      const dataSource = createTestDataSource(data);
      const suppliers = createSuppliers(viewWithTotals, dimensions, [dataSource]);

      const result = PivotDataService.buildPivotData(suppliers);

      // Vérifier que TOTAL est dans les axes
      expect(result.rows.map(r => r.axeKey)).toContain(TOTAL);
      expect(result.columns.map(c => c.axeKey)).toContain(TOTAL);

      // Vérifier les totaux par ligne
      const pivotMap = result.pivotCellByColKeyByRowKeyByMeasureId;
      const salesMap = pivotMap.get('sales');
      
      // Total pour Paris = 100 + 150 = 250
      expect(salesMap?.get('Paris')?.get(TOTAL)?.value).toBe(250);
      
      // Total pour Rouen = 200 + 250 = 450
      expect(salesMap?.get('Rouen')?.get(TOTAL)?.value).toBe(450);

      // Total par colonne
      // Total pour 2023 = 100 + 200 = 300
      expect(salesMap?.get(TOTAL)?.get('2023')?.value).toBe(300);
      
      // Total pour 2024 = 150 + 250 = 400
      expect(salesMap?.get(TOTAL)?.get('2024')?.value).toBe(400);

      // Grand total = 250 + 450 = 700 (ou 300 + 400 = 700)
      expect(salesMap?.get(TOTAL)?.get(TOTAL)?.value).toBe(700);
    });

    it('devrait utiliser l\'agrégation correcte (average)', () => {
      const viewWithTotals = createTestView({
        measures: [
          {
            id: 'avg-sales',
            name: 'Average Sales',
            source: {
              type: 'column',
              dataSourceId: 'test-ds',
              columnIndex: 2
            },
            aggregation: 'average',
            visible: true
          }
        ],
        showTotals: true,
        showGrandTotal: true
      });
      
      const dimensions = createTestDimensions();
      
      // Données : [City, Year, Sales]
      const data = [
        ['Paris', '2023', 100],
        ['Paris', '2024', 150]
      ];
      const dataSource = createTestDataSource(data);
      const suppliers = createSuppliers(viewWithTotals, dimensions, [dataSource]);

      const result = PivotDataService.buildPivotData(suppliers);

      const pivotMap = result.pivotCellByColKeyByRowKeyByMeasureId;
      const avgSalesMap = pivotMap.get('avg-sales');
      
      // Total pour Paris avec average = (100 + 150) / 2 = 125
      expect(avgSalesMap?.get('Paris')?.get(TOTAL)?.value).toBe(125);
    });

    it('devrait utiliser l\'agrégation count', () => {
      const view = createTestView({
        measures: [
          {
            id: 'count',
            name: 'Count',
            source: {
              type: 'column',
              dataSourceId: 'test-ds',
              columnIndex: 2
            },
            aggregation: 'count',
            visible: true
          }
        ]
      });
      
      const dimensions = createTestDimensions();
      
      const viewWithTotals = createTestView({
        measures: [
          {
            id: 'count',
            name: 'Count',
            source: {
              type: 'column',
              dataSourceId: 'test-ds',
              columnIndex: 2
            },
            aggregation: 'count',
            visible: true
          }
        ],
        showTotals: true,
        showGrandTotal: true
      });
      const data = [
        ['Paris', '2023', 100],
        ['Paris', '2024', 150],
        ['Paris', '2025', 200]
      ];
      
      const dataSource = createTestDataSource(data);
      const suppliers = createSuppliers(viewWithTotals, dimensions, [dataSource]);

      const result = PivotDataService.buildPivotData(suppliers);

      const pivotMap = result.pivotCellByColKeyByRowKeyByMeasureId;
      const countMap = pivotMap.get('count');
      
      // Total pour Paris avec count = 3
      expect(countMap?.get('Paris')?.get(TOTAL)?.value).toBe(3);
      
      // Total par année pour Paris
      expect(countMap?.get(TOTAL)?.get('2023')?.value).toBe(1);
      expect(countMap?.get(TOTAL)?.get('2024')?.value).toBe(1);
    });
  });

  describe('buildPivotData - Scénario avec plusieurs mesures', () => {
    it('devrait gérer plusieurs mesures', () => {
      const view = createTestView({
        measures: [
          {
            id: 'sales',
            name: 'Sales',
            source: {
              type: 'column',
              dataSourceId: 'test-ds',
              columnIndex: 2
            },
            aggregation: 'sum',
            visible: true
          },
          {
            id: 'quantity',
            name: 'Quantity',
            source: {
              type: 'column',
              dataSourceId: 'test-ds',
              columnIndex: 3
            },
            aggregation: 'sum',
            visible: true
          }
        ]
      });
      
      const dimensions = createTestDimensions();
      
      // Données : [City, Year, Sales, Quantity]
      const data = [
        ['Paris', '2023', 100, 10],
        ['Paris', '2024', 150, 15]
      ];
      
      const dataSource = createTestDataSource(data);
      // Mettre à jour la dataSource pour avoir 4 colonnes
      dataSource.columns = [
        { index: 0, name: 'City', dataType: 'string', nullable: false, unique: false },
        { index: 1, name: 'Year', dataType: 'string', nullable: false, unique: false },
        { index: 2, name: 'Sales', dataType: 'number', nullable: false, unique: false },
        { index: 3, name: 'Quantity', dataType: 'number', nullable: false, unique: false }
      ];
      
      // Create a view without totals for this test
      const viewWithoutTotals = { ...view, showTotals: false, showGrandTotal: false };
      const suppliers = createSuppliers(viewWithoutTotals, dimensions, [dataSource]);

      const result = PivotDataService.buildPivotData(suppliers);

      // Vérifier les mesures
      expect(result.measures).toEqual(['sales', 'quantity']);

      // Vérifier les cellules
      const pivotMap = result.pivotCellByColKeyByRowKeyByMeasureId;
      expect(pivotMap.size).toBe(2);
      
      // Vérifier la mesure sales
      const salesMap = pivotMap.get('sales');
      expect(salesMap?.get('Paris')?.get('2023')?.value).toBe(100);
      
      // Vérifier la mesure quantity
      const quantityMap = pivotMap.get('quantity');
      expect(quantityMap?.get('Paris')?.get('2023')?.value).toBe(10);
    });
  });

  describe('buildPivotData - Scénario avec plusieurs dimensions', () => {
    it('devrait gérer plusieurs dimensions en lignes et colonnes', () => {
      const view: View = {
        id: 'test-view-multi-dim',
        name: 'Test View Multi Dim',
        rowDimensions: ['city', 'category'],
        columnDimensions: ['year', 'quarter'],
        measures: [
          {
            id: 'sales',
            name: 'Sales',
            source: {
              type: 'column',
              dataSourceId: 'test-ds-multi',
              columnIndex: 4
            },
            aggregation: 'sum',
            visible: true
          }
        ],
        filterDimensions: [],
        showTotals: true,
        showGrandTotal: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const dimensions = [
        {
          id: 'city',
          name: 'City',
          dataType: 'string',
          columnMappings: [{ dataSourceId: 'test-ds-multi', columnIndex: 0, level: 0 }],
          rootNodes: [],
          nodes: [
            { id: 'city-1', dimensionId: 'city', code: 'PAR', value: 'Paris', metaData: {}, children: [], sourceIds: [] }
          ]
        },
        {
          id: 'category',
          name: 'Category',
          dataType: 'string',
          columnMappings: [{ dataSourceId: 'test-ds-multi', columnIndex: 3, level: 0 }],
          rootNodes: [],
          nodes: [
            { id: 'cat-1', dimensionId: 'category', code: 'ELEC', value: 'Electronics', metaData: {}, children: [], sourceIds: [] },
            { id: 'cat-2', dimensionId: 'category', code: 'CLOTH', value: 'Clothing', metaData: {}, children: [], sourceIds: [] }
          ]
        },
        {
          id: 'year',
          name: 'Year',
          dataType: 'string',
          columnMappings: [{ dataSourceId: 'test-ds-multi', columnIndex: 1, level: 0 }],
          rootNodes: [],
          nodes: [
            { id: 'year-1', dimensionId: 'year', code: '2023', value: '2023', metaData: {}, children: [], sourceIds: [] }
          ]
        },
        {
          id: 'quarter',
          name: 'Quarter',
          dataType: 'string',
          columnMappings: [{ dataSourceId: 'test-ds-multi', columnIndex: 2, level: 0 }],
          rootNodes: [],
          nodes: [
            { id: 'q-1', dimensionId: 'quarter', code: 'Q1', value: 'Q1', metaData: {}, children: [], sourceIds: [] },
            { id: 'q-2', dimensionId: 'quarter', code: 'Q2', value: 'Q2', metaData: {}, children: [], sourceIds: [] }
          ]
        }
      ];
      
      // Données : [City, Year, Quarter, Category, Sales]
      const data = [
        ['Paris', '2023', 'Q1', 'Electronics', 100],
        ['Paris', '2023', 'Q2', 'Electronics', 150],
        ['Paris', '2023', 'Q1', 'Clothing', 200],
        ['Paris', '2023', 'Q2', 'Clothing', 250]
      ];
      
      const dataSource: LocalDataSource = {
        id: 'test-ds-multi',
        name: 'Test Data Source Multi',
        type: 'local',
        originalFormat: 'csv',
        loadedAt: new Date().toISOString(),
        columns: [
          { index: 0, name: 'City', dataType: 'string', nullable: false, unique: false },
          { index: 1, name: 'Year', dataType: 'string', nullable: false, unique: false },
          { index: 2, name: 'Quarter', dataType: 'string', nullable: false, unique: false },
          { index: 3, name: 'Category', dataType: 'string', nullable: false, unique: false },
          { index: 4, name: 'Sales', dataType: 'number', nullable: false, unique: false }
        ],
        data
      };
      
      // Create a view without totals for this test
      const viewWithoutTotals = { ...view, showTotals: false, showGrandTotal: false };
      const suppliers = createSuppliers(viewWithoutTotals, dimensions, [dataSource]);

      const result = PivotDataService.buildPivotData(suppliers);

      // Les tuples de lignes devraient être des combinaisons de city et category
      expect(result.rows.length).toBe(2); // Paris-Electronics, Paris-Clothing
      
      // Les tuples de colonnes devraient être des combinaisons de year et quarter
      expect(result.columns.length).toBe(2); // 2023-Q1, 2023-Q2
    });
  });

  describe('TOTAL constant', () => {
    it('devrait avoir la valeur __TOTAL__', () => {
      expect(TOTAL).toBe('__TOTAL__');
    });
  });

  describe('applyAggregation', () => {
    it('devrait retourner 0 pour une liste vide', () => {
      expect(PivotDataService.applyAggregation([], 'sum')).toBe(0);
    });

    it('devrait calculer la somme', () => {
      expect(PivotDataService.applyAggregation([1, 2, 3, 4, 5], 'sum')).toBe(15);
    });

    it('devrait calculer la moyenne', () => {
      expect(PivotDataService.applyAggregation([1, 2, 3, 4, 5], 'average')).toBe(3);
    });

    it('devrait calculer le compte', () => {
      expect(PivotDataService.applyAggregation([1, 2, 3, 4, 5], 'count')).toBe(5);
    });

    it('devrait calculer le minimum', () => {
      expect(PivotDataService.applyAggregation([5, 2, 8, 1, 9], 'min')).toBe(1);
    });

    it('devrait calculer le maximum', () => {
      expect(PivotDataService.applyAggregation([5, 2, 8, 1, 9], 'max')).toBe(9);
    });

    it('devrait retourner le premier élément', () => {
      expect(PivotDataService.applyAggregation([5, 2, 8, 1, 9], 'first')).toBe(5);
    });

    it('devrait retourner le dernier élément', () => {
      expect(PivotDataService.applyAggregation([5, 2, 8, 1, 9], 'last')).toBe(9);
    });

    it('devrait utiliser sum comme défaut pour une agrégation inconnue', () => {
      expect(PivotDataService.applyAggregation([1, 2, 3], 'unknown')).toBe(6);
    });
  });

  // ============================================================================
  // HIERARCHY BUILDING TESTS
  // ============================================================================

  describe('buildHierarchyFromAxeKeys', () => {
    it('devrait construire une hiérarchie simple à un niveau', () => {
      const axeKeys = ['Paris', 'Rouen', 'Perpignan'];
      const dimensions: Dimension[] = [
        {
          id: 'city',
          name: 'City',
          dataType: 'string',
          columnMappings: [],
          rootNodes: [],
          nodes: [
            { id: 'city-1', dimensionId: 'city', code: 'Paris', value: 'Paris', metaData: {}, children: [], sourceIds: [] },
            { id: 'city-2', dimensionId: 'city', code: 'Rouen', value: 'Rouen', metaData: {}, children: [], sourceIds: [] },
            { id: 'city-3', dimensionId: 'city', code: 'Perpignan', value: 'Perpignan', metaData: {}, children: [], sourceIds: [] }
          ]
        }
      ];

      const result = PivotDataService.buildHierarchyFromAxeKeys(
        axeKeys,
        dimensions
      );

      expect(result.length).toBe(3);
      expect(result[0].key).toBe('Paris');
      expect(result[0].value).toBe('Paris');
      expect(result[0].level).toBe(0);
      expect(result[0].dimensionId).toBe('city');
      expect(result[0].leaf).toBe(true);
    });

    it('devrait construire une hiérarchie à deux niveaux', () => {
      const axeKeys = ['2024;1', '2024;2', '2025;1'];
      const dimensions: Dimension[] = [
        {
          id: 'year',
          name: 'Year',
          dataType: 'string',
          columnMappings: [],
          rootNodes: [],
          nodes: [
            { id: 'year-1', dimensionId: 'year', code: '2024', value: '2024', metaData: {}, children: [], sourceIds: [] },
            { id: 'year-2', dimensionId: 'year', code: '2025', value: '2025', metaData: {}, children: [], sourceIds: [] }
          ]
        },
        {
          id: 'month',
          name: 'Month',
          dataType: 'string',
          columnMappings: [],
          rootNodes: [],
          nodes: [
            { id: 'month-1', dimensionId: 'month', code: '1', value: 'January', metaData: {}, children: [], sourceIds: [] },
            { id: 'month-2', dimensionId: 'month', code: '2', value: 'February', metaData: {}, children: [], sourceIds: [] }
          ]
        }
      ];

      const result = PivotDataService.buildHierarchyFromAxeKeys(
        axeKeys,
        dimensions
      );

      expect(result.length).toBe(2); // Should have 2024 and 2025 as root nodes
      
      // Find 2024 node
      const year2024 = result.find(n => n.key === '2024');
      expect(year2024).toBeDefined();
      expect(year2024!.value).toBe('2024');
      expect(year2024!.level).toBe(0);
      expect(year2024!.dimensionId).toBe('year');
      expect(year2024!.leaf).toBe(false);
      expect(year2024!.children).toHaveLength(2);
      
      // Check children
      const month1 = year2024!.children!.find(n => n.key === '2024;1');
      expect(month1).toBeDefined();
      expect(month1!.value).toBe('January');
      expect(month1!.level).toBe(1);
      expect(month1!.dimensionId).toBe('month');
      expect(month1!.leaf).toBe(true);
      
      // Check 2025 node
      const year2025 = result.find(n => n.key === '2025');
      expect(year2025).toBeDefined();
      expect(year2025!.children).toHaveLength(1);
    });

    it('devrait gérer les valeurs manquantes dans les dimensions', () => {
      const axeKeys = ['A', 'B'];
      const dimensions: Dimension[] = [
        {
          id: 'dim1',
          name: 'Dim1',
          dataType: 'string',
          columnMappings: [],
          rootNodes: [],
          nodes: []
        }
      ];

      const result = PivotDataService.buildHierarchyFromAxeKeys(
        axeKeys,
        dimensions
      );

      expect(result.length).toBe(2);
      expect(result[0].value).toBe('A'); // Should use the key as fallback
      expect(result[1].value).toBe('B');
    });

    it('devrait retourner un tableau vide pour des axeKeys vides', () => {
      const dimensions: Dimension[] = [
        {
          id: 'dim1',
          name: 'Dim1',
          dataType: 'string',
          columnMappings: [],
          rootNodes: [],
          nodes: []
        }
      ];

      const result = PivotDataService.buildHierarchyFromAxeKeys(
        [],
        dimensions
      );

      expect(result).toEqual([]);
    });
  });

  describe('buildColumnHierarchyWithMeasures', () => {
    it('devrait construire une hiérarchie de colonnes avec des mesures', () => {
      const columnAxeKeys = ['2024;1', '2024;2'];
      const dimensions: Dimension[] = [
        {
          id: 'year',
          name: 'Year',
          dataType: 'string',
          columnMappings: [],
          rootNodes: [],
          nodes: [
            { id: 'year-1', dimensionId: 'year', code: '2024', value: '2024', metaData: {}, children: [], sourceIds: [] }
          ]
        },
        {
          id: 'month',
          name: 'Month',
          dataType: 'string',
          columnMappings: [],
          rootNodes: [],
          nodes: [
            { id: 'month-1', dimensionId: 'month', code: '1', value: '1', metaData: {}, children: [], sourceIds: [] },
            { id: 'month-2', dimensionId: 'month', code: '2', value: '2', metaData: {}, children: [], sourceIds: [] }
          ]
        }
      ];
      const measures: Measure[] = [
        { id: 'Recalled', name: 'Recalled', source: { type: 'column', dataSourceId: 'ds1', columnIndex: 0 }, aggregation: 'sum', visible: true },
        { id: 'Sold', name: 'Sold', source: { type: 'column', dataSourceId: 'ds1', columnIndex: 1 }, aggregation: 'sum', visible: true }
      ];

      const result = PivotDataService.buildColumnHierarchyWithMeasures(
        columnAxeKeys,
        dimensions,
        measures
      );

      expect(result.length).toBe(1); // 2024 root node
      
      const year2024 = result[0];
      expect(year2024.key).toBe('2024');
      expect(year2024.children).toHaveLength(2); // 2 months
      
      const month1 = year2024.children![0];
      expect(month1.key).toBe('2024;1');
      expect(month1.children).toHaveLength(2); // 2 measures
      
      const recalledNode = month1.children!.find(n => n.key === '2024;1;Recalled');
      expect(recalledNode).toBeDefined();
      expect(recalledNode!.value).toBe('Recalled');
      expect(recalledNode!.level).toBe(2);
      expect(recalledNode!.leaf).toBe(true);
    });

    it('devrait gérer le cas sans dimensions de colonne (mesures seulement)', () => {
      const dimensions: Dimension[] = [];
      const measures: Measure[] = [
        { id: 'Recalled', name: 'Recalled', source: { type: 'column', dataSourceId: 'ds1', columnIndex: 0 }, aggregation: 'sum', visible: true },
        { id: 'Sold', name: 'Sold', source: { type: 'column', dataSourceId: 'ds1', columnIndex: 1 }, aggregation: 'sum', visible: true }
      ];

      const result = PivotDataService.buildColumnHierarchyWithMeasures(
        [],
        dimensions,
        measures
      );

      expect(result.length).toBe(2);
      expect(result[0].key).toBe('Recalled');
      expect(result[1].key).toBe('Sold');
      expect(result[0].leaf).toBe(true);
    });

    it('devrait retourner un tableau vide pour des entrées vides', () => {
      const result = PivotDataService.buildColumnHierarchyWithMeasures(
        [],
        [],
        []
      );

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // HIERARCHY IN BUILDPIVOTDATA TESTS
  // ============================================================================

  describe('buildPivotData - with hierarchies', () => {
    it('devrait générer des hiérarchies pour les lignes et colonnes', () => {
      const view: View = {
        id: 'test-view-hierarchy',
        name: 'Test View with Hierarchy',
        rowDimensions: ['customer', 'product'],
        columnDimensions: ['year', 'month'],
        measures: [
          {
            id: 'recalled',
            name: 'Recalled',
            source: {
              type: 'column',
              dataSourceId: 'test-ds-hierarchy',
              columnIndex: 4
            },
            aggregation: 'sum',
            visible: true
          },
          {
            id: 'sold',
            name: 'Sold',
            source: {
              type: 'column',
              dataSourceId: 'test-ds-hierarchy',
              columnIndex: 5
            },
            aggregation: 'sum',
            visible: true
          }
        ],
        filterDimensions: [],
        showTotals: false,
        showGrandTotal: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const dimensions = [
        {
          id: 'customer',
          name: 'Customer',
          dataType: 'string',
          columnMappings: [{ dataSourceId: 'test-ds-hierarchy', columnIndex: 0, level: 0 }],
          rootNodes: [],
          nodes: [
            { id: 'cust-1', dimensionId: 'customer', code: 'Shop A', value: 'Shop A', metaData: {}, children: [], sourceIds: [] },
            { id: 'cust-2', dimensionId: 'customer', code: 'Shop B', value: 'Shop B', metaData: {}, children: [], sourceIds: [] }
          ]
        },
        {
          id: 'product',
          name: 'Product',
          dataType: 'string',
          columnMappings: [{ dataSourceId: 'test-ds-hierarchy', columnIndex: 1, level: 0 }],
          rootNodes: [],
          nodes: [
            { id: 'prod-1', dimensionId: 'product', code: 'Tool A', value: 'Tool A', metaData: {}, children: [], sourceIds: [] },
            { id: 'prod-2', dimensionId: 'product', code: 'Tool B', value: 'Tool B', metaData: {}, children: [], sourceIds: [] }
          ]
        },
        {
          id: 'year',
          name: 'Year',
          dataType: 'string',
          columnMappings: [{ dataSourceId: 'test-ds-hierarchy', columnIndex: 2, level: 0 }],
          rootNodes: [],
          nodes: [
            { id: 'year-1', dimensionId: 'year', code: '2024', value: '2024', metaData: {}, children: [], sourceIds: [] },
            { id: 'year-2', dimensionId: 'year', code: '2025', value: '2025', metaData: {}, children: [], sourceIds: [] }
          ]
        },
        {
          id: 'month',
          name: 'Month',
          dataType: 'string',
          columnMappings: [{ dataSourceId: 'test-ds-hierarchy', columnIndex: 3, level: 0 }],
          rootNodes: [],
          nodes: [
            { id: 'month-1', dimensionId: 'month', code: '1', value: '1', metaData: {}, children: [], sourceIds: [] },
            { id: 'month-2', dimensionId: 'month', code: '2', value: '2', metaData: {}, children: [], sourceIds: [] }
          ]
        }
      ];

      // Données : [Customer, Product, Year, Month, Recalled, Sold]
      const data = [
        ['Shop A', 'Tool A', '2024', '1', 3, 5],
        ['Shop A', 'Tool B', '2024', '1', 20, 15],
        ['Shop B', 'Tool A', '2025', '2', 43, 320]
      ];

      const dataSource: LocalDataSource = {
        id: 'test-ds-hierarchy',
        name: 'Test Data Source Hierarchy',
        type: 'local',
        originalFormat: 'csv',
        loadedAt: new Date().toISOString(),
        columns: [
          { index: 0, name: 'Customer', dataType: 'string', nullable: false, unique: false },
          { index: 1, name: 'Product', dataType: 'string', nullable: false, unique: false },
          { index: 2, name: 'Year', dataType: 'string', nullable: false, unique: false },
          { index: 3, name: 'Month', dataType: 'string', nullable: false, unique: false },
          { index: 4, name: 'Recalled', dataType: 'number', nullable: false, unique: false },
          { index: 5, name: 'Sold', dataType: 'number', nullable: false, unique: false }
        ],
        data
      };

      const suppliers = createSuppliers(view, dimensions, [dataSource]);

      const result = PivotDataService.buildPivotData(suppliers);

      // Verify row hierarchy exists
      expect(result.rowHierarchy).toBeDefined();
      expect(result.rowHierarchy!.length).toBeGreaterThan(0);
      
      // Should have customer nodes
      const shopANode = result.rowHierarchy!.find(n => n.key === 'Shop A');
      expect(shopANode).toBeDefined();
      expect(shopANode!.dimensionId).toBe('customer');
      expect(shopANode!.leaf).toBe(false); // Should have product children
      
      // Verify column hierarchy exists
      expect(result.columnHierarchy).toBeDefined();
      expect(result.columnHierarchy!.length).toBeGreaterThan(0);
      
      // Should have year nodes with measure children
      const year2024Node = result.columnHierarchy!.find(n => n.key === '2024');
      expect(year2024Node).toBeDefined();
      expect(year2024Node!.dimensionId).toBe('year');
    });

    it('devrait générer une hiérarchie vide quand il n\'y a pas de dimensions', () => {
      const view: View = {
        id: 'test-view-no-dimensions',
        name: 'Test View No Dimensions',
        rowDimensions: [],
        columnDimensions: [],
        measures: [],
        filterDimensions: [],
        showTotals: false,
        showGrandTotal: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const suppliers: PivotDataServiceSuppliers = {
        getView: () => view,
        getLocalDataSources: () => [],
        getDimension: () => undefined,
        getDimensions: () => []
      };

      const result = PivotDataService.buildPivotData(suppliers);

      expect(result.rowHierarchy).toBeUndefined();
      expect(result.columnHierarchy).toBeUndefined();
    });
  });
});
