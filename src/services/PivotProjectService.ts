import type { ColumnMapping, DataColumn, Dimension, LocalDataSource, MetaData, Node, NodeSchema, PivotProject } from "../stores";
import { parseCSV } from "../utils/csvParser";
import { detectColumnType, isColumnUnique } from "../utils/ParserUtils";



export class PivotProjectService {

    /**
     * Create a new empty PivotProject
     */
    static createEmptyPivotProject(name?: string): PivotProject {
    return {
        id: `project-${Date.now()}`,
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
        const id = `ds-${Date.now()}`;
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
        const id = `dim-${Date.now()}`;
        return  {
            id,
            name,
            description,
            dataType,
            columnMappings: columnMappings || [],
            rootNodes: [],
            nodeSchema,
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
        const id: string = `node-${Date.now()}`;
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
}