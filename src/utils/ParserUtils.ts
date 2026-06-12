
/**
* Get unique values from a column
*/
export function getUniqueValues(csvData: any[], columnName: string): any[] {
    if (csvData.length === 0) return [];
    const values = csvData.map(row => row[columnName]);
    return [...new Set(values)];
}

/**
* Check if a column has unique values
*/
export function isColumnUnique(csvData: any[], columnName: string): boolean {
    if (csvData.length === 0) return false;
    const values = csvData.map(row => row[columnName]);
    const uniqueValues = new Set(values);
    return uniqueValues.size === values.length;
}

/**
  * Detect the data type of a column
  */
export function detectColumnType(csvData: any[], columnName: string, index: number): 'string' | 'number' | 'date' | 'boolean' | 'unknown' {
    if (csvData.length === 0) return 'unknown';

    const values = csvData.map(row => row[columnName]);

    // Check if all values are numbers
    const allNumbers = values.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== ''));
    if (allNumbers) return 'number';

    // Check if all values are dates
    const allDates = values.every(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v));
    if (allDates) return 'date';

    // Check if all values are booleans
    const allBooleans = values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false');
    if (allBooleans) return 'boolean';

    return 'string';
}