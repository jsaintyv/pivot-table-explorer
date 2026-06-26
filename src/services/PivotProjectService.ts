import type { ColumnMapping, DataColumn, Dimension, LocalDataSource, MetaData, Node, NodeSchema, PivotProject, FilterDimension, Measure, View } from "../models/pivot-project/types";
import type { RowData, Tuple } from "../models/pivot-data/pivot-data";

var nextId = 1;

export class PivotProjectService {

    /**
     * Create a new empty PivotProject
     */
    static createEmptyPivotProject(name?: string): PivotProject {
    return {
        id: `project-${nextId++}`,
        name: name || 'Untitled Project',
        description: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataSources: [],
        dimensions: [],
        nodes: {},
        views: [],
    };
    }


    /**
     * Add a LocalDataSource from CSV or Excel
     */
    static buildLocalDataSource(        
        name: string,
        originalFormat: 'csv' | 'excel',
        columns: DataColumn[],
        data: any[][]
    ): LocalDataSource {
        const id = `ds-${nextId++}`;
        return {
            id,
            name,
            type: 'local',
            originalFormat,
            loadedAt: new Date().toISOString(),
            columns,
            data,
        };
    }

    /**
     * Add a new dimension
     */
    static buildDimension(        
        name: string,
        dataType: 'string' | 'number' | 'date' | 'boolean',
        description?: string,
        columnMappings?: ColumnMapping[],
        nodeSchema?: NodeSchema        
    ): Dimension {
        const id = `dim-${nextId++}`;
        return  {
            id,
            name,
            description,
            dataType,
            columnMappings: columnMappings || [],
            rootNodes: [],
            nodeSchema,
            nodes: [],
        };        
    }

    /**
     * Add a new node
     */
    static buildNode(
        dimensionId: string,
        code: string,
        value: string | number | Date | boolean,
        metaData?: MetaData,
        children?: string[],
        sourceIds?: string[]
    ): Node {
        const id: string = `node-${nextId++}`;
        return {
            id,
            dimensionId,
            code,
            value,
            metaData: metaData || {},
            children: children || [],
            sourceIds: sourceIds || [],
        };        
    }

    static getNodesByDimension(dimensions: Dimension[]): Map<string, Node[]>  {
        const nodesByDimensionId: Map<string, Node[]> = new Map();
        for(let dim of dimensions) {
            nodesByDimensionId.set(dim.id, dim.nodes);
        }
        return nodesByDimensionId;
    }

    // ============================================================================
    // PIVOT DATA BUILDING HELPERS
    // ============================================================================

    /**
     * Filtre les lignes d'une data source pour ne garder que celles qui matchent les filtres
     * @param dataSource La data source à filtrer
     * @param dimensionToColumnIndex Map des dimensionId vers index de colonne
     * @param filters Liste des filtres à appliquer
     * @param nodeValueMap Map pour accéder aux valeurs des nodes
     * @returns Liste des lignes filtrées
     */
    static filterDataSourceRows(
        dataSource: LocalDataSource,
        dimensionToColumnIndex: Map<string, number>,
        filters: FilterDimension[],
        dimensionByIndex: (dimId:string)=>Dimension|undefined
    ): any[][] {
        const filteredRows: any[][] = [];

        const codesByFilterId : Map<string, any> = new Map();
        for (const filter of filters) {                
            let dimension = dimensionByIndex(filter.dimensionId);
            
            codesByFilterId.set(
                filter.dimensionId, 
                dimension?.nodes.filter(n => filter.selectedNodes.indexOf(n.id) >=0).map(n => n.code) || []
            )
        }
        
        for (const row of dataSource.data) {
            let matchesAllFilters = true;
            
            for (const filter of filters) {                
                
                const colIndex = dimensionToColumnIndex.get(filter.dimensionId);
                if (colIndex === undefined) continue;
                
                const rowValue = row[colIndex];
                if (rowValue === undefined) continue;
                
                let dimension = dimensionByIndex(filter.dimensionId);
                if(! dimension) {
                    continue;
                }
                
                // Appliquer le filtre
                if (filter.operator === 'include') {
                    if (!codesByFilterId.get(filter.dimensionId).includes(rowValue)) {
                        matchesAllFilters = false;
                        break;
                    }
                } else { // exclude
                    if (codesByFilterId.get(filter.dimensionId).includes(rowValue)) {
                        matchesAllFilters = false;
                        break;
                    }
                }
            }
            
            if (matchesAllFilters) {
                filteredRows.push(row);
            }
        }
        
        return filteredRows;
    }

    /**
     * Construit la liste RowData à partir des lignes filtrées
     * @param filteredRows Lignes de données après filtrage
     * @param measure Mesure à utiliser
     * @param rowDimensions Dimensions utilisées pour les lignes
     * @param colDimensions Dimensions utilisées pour les colonnes
     * @param dimensionToColumnIndex Map des dimensionId vers index de colonne
     * @returns Liste de RowData
     */
    static buildRowDataList(
        filteredRows: any[][],
        measure: Measure,
        rowDimensions: Dimension[],
        colDimensions: Dimension[],
        dimensionToColumnIndex: Map<string, number>
    ): RowData[] {
        const rowDataList: RowData[] = [];
        
        for (const row of filteredRows) {
            const measureColumnIndex = measure.source.columnIndex;
            let measureValue: any = row[measureColumnIndex];
            measureValue = 1 * measureValue;
            
            if (measureValue === undefined || Number.isNaN(measureValue)) {
                continue;
            }
            
            // Construire le tuple pour les lignes
            const tupleRows: Tuple = [];
            for (const rowDim of rowDimensions) {
                const colIndex = dimensionToColumnIndex.get(rowDim.id);
                if (colIndex !== undefined && row[colIndex] !== undefined) {
                    tupleRows.push(String(row[colIndex]));
                }
            }
            
            // Construire le tuple pour les colonnes
            const tupleColumns: Tuple = [];
            for (const colDim of colDimensions) {
                const colIndex = dimensionToColumnIndex.get(colDim.id);
                if (colIndex !== undefined && row[colIndex] !== undefined) {
                    tupleColumns.push(String(row[colIndex]));
                }
            }            
            rowDataList.push({
                measureId: measure.id,
                tupleColumns,
                tupleRows,
                value: measureValue               
            });
        }
        
        return rowDataList;
    }

  
    /**
     * Construit la liste des tuples de lignes uniques à partir de RowData
     * @param rowDataList Liste de RowData
     * @returns Liste de tuples de lignes triés
     */
    static buildRowTuples(rowDataList: RowData[]): Tuple[] {
        const tupleSet: Set<string> = new Set();
        
        for (const rowData of rowDataList) {
            const tupleKey = rowData.tupleRows.join('|');
            if (!tupleSet.has(tupleKey)) {
                tupleSet.add(tupleKey);
            }
        }
        
        const tuples: Tuple[] = [];
        for (const tupleKey of tupleSet) {
            tuples.push(tupleKey.split('|'));
        }
        
        // Trier par ordre naturel (lexicographique)
        tuples.sort((a, b) => {
            for (let i = 0; i < Math.min(a.length, b.length); i++) {
                if (a[i] !== b[i]) {
                    return a[i].localeCompare(b[i]);
                }
            }
            return a.length - b.length;
        });
        
        return tuples;
    }
    

     
}