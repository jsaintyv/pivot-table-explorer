/**
 * CSV Parser Utilities
 * 
 * Provides functions for parsing CSV content with support for:
 * - Semicolon (;) or comma (,) separators
 * - Quoted values
 * - Empty lines
 */

/**
 * Parse a single CSV line, handling quoted values
 * @param line - The CSV line to parse
 * @param separator - The field separator (usually ';' or ',')
 * @returns Array of field values
 */
export const parseCSVLine = (line: string, separator: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      // Toggle quote mode
      inQuotes = !inQuotes;
      i++;
    } else if (char === separator && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
      i++;
    } else {
      // Add character to current field
      current += char;
      i++;
    }
  }
  
  // Add the last field
  values.push(current);
  
  return values;
};

/**
 * Parse CSV content into an array of objects
 * @param content - The CSV content as a string
 * @param separator - Optional separator override (defaults to auto-detect)
 * @returns Array of objects where each object represents a row
 */
export const parseCSV = (content: string, separator?: string): any[] => {
  const lines = content.split('\n');
  if (lines.length === 0) return [];
  
  // Auto-detect separator if not provided
  const detectedSeparator = separator || detectSeparator(lines[0]);
  
  // Parse headers
  const headers = parseCSVLine(lines[0], detectedSeparator).map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i], detectedSeparator);
    const entry: any = {};
    headers.forEach((header, index) => {
      entry[header] = values[index]?.trim() || '';
    });
    data.push(entry);
  }
  
  return data;
};

/**
 * Detect the separator used in a CSV line
 * @param line - A line from the CSV file
 * @returns The detected separator (';' or ',')
 */
export const detectSeparator = (line: string): string => {
  const hasSemicolons = line.includes(';');
  const hasCommas = line.includes(',');
  
  // If both exist, prefer semicolon (common in European CSV files)
  if (hasSemicolons && hasCommas) {
    // Count which separator appears more often
    const semicolonCount = (line.match(/;/g) || []).length;
    const commaCount = (line.match(/,/g) || []).length;
    return semicolonCount >= commaCount ? ';' : ',';
  }
  
  return hasSemicolons ? ';' : hasCommas ? ',' : ';';
};
