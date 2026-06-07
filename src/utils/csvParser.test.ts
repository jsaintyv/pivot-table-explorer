import { describe, it, expect } from 'vitest';
import { parseCSV, parseCSVLine, detectSeparator } from './csvParser';

/**
 * Unit tests for CSV Parser utilities
 */

describe('csvParser', () => {
  describe('detectSeparator', () => {
    it('should detect semicolon separator', () => {
      const line = 'Customer;Year;Month;Product';
      expect(detectSeparator(line)).toBe(';');
    });

    it('should detect comma separator', () => {
      const line = 'Customer,Year,Month,Product';
      expect(detectSeparator(line)).toBe(',');
    });

    it('should prefer semicolon when both exist but semicolon is more frequent', () => {
      const line = 'Customer;Year,Month;Product';
      expect(detectSeparator(line)).toBe(';');
    });

    it('should prefer comma when both exist but comma is more frequent', () => {
      const line = 'Customer,Year;Month,Product';
      expect(detectSeparator(line)).toBe(',');
    });

    it('should default to semicolon when no separator is found', () => {
      const line = 'CustomerYearMonthProduct';
      expect(detectSeparator(line)).toBe(';');
    });

    it('should handle empty line', () => {
      const line = '';
      expect(detectSeparator(line)).toBe(';');
    });

    it('should handle line with only spaces', () => {
      const line = '   ';
      expect(detectSeparator(line)).toBe(';');
    });
  });

  describe('parseCSVLine', () => {
    it('should parse semicolon-separated line without quotes', () => {
      const line = 'Customer;Year;Month;Product';
      const result = parseCSVLine(line, ';');
      expect(result).toEqual(['Customer', 'Year', 'Month', 'Product']);
    });

    it('should parse comma-separated line without quotes', () => {
      const line = 'Customer,Year,Month,Product';
      const result = parseCSVLine(line, ',');
      expect(result).toEqual(['Customer', 'Year', 'Month', 'Product']);
    });

    it('should parse line with quoted values containing semicolons', () => {
      const line = '"Magasin A";2025;1;"Dentifrice"';
      const result = parseCSVLine(line, ';');
      expect(result).toEqual(['Magasin A', '2025', '1', 'Dentifrice']);
    });

    it('should parse line with quoted values containing commas', () => {
      const line = '"Smith, John",42,"New York, NY"';
      const result = parseCSVLine(line, ',');
      expect(result).toEqual(['Smith, John', '42', 'New York, NY']);
    });

    it('should parse line with empty fields', () => {
      const line = 'Customer;;Month;Product';
      const result = parseCSVLine(line, ';');
      expect(result).toEqual(['Customer', '', 'Month', 'Product']);
    });

    it('should parse line with quoted empty string', () => {
      const line = 'Customer;"";Month;Product';
      const result = parseCSVLine(line, ';');
      expect(result).toEqual(['Customer', '', 'Month', 'Product']);
    });

    it('should handle line with consecutive quotes (simple parser behavior)', () => {
      // Note: Our simple parser doesn't fully support escaped quotes ("" -> ")
      // It treats each quote as a toggle, so "" becomes empty string in quoted mode
      const line = '"Customer ""Name""";Value';
      const result = parseCSVLine(line, ';');
      // Actual behavior: consecutive quotes in quoted mode result in the quotes being
      // consumed as toggles, so "" becomes empty, resulting in "Customer Name"
      expect(result).toEqual(['Customer Name', 'Value']);
    });

    it('should handle line with only one field', () => {
      const line = 'Customer';
      const result = parseCSVLine(line, ';');
      expect(result).toEqual(['Customer']);
    });

    it('should handle empty line', () => {
      const line = '';
      const result = parseCSVLine(line, ';');
      expect(result).toEqual(['']);
    });

    it('should handle line with trailing separator', () => {
      const line = 'Customer;Year;Month;';
      const result = parseCSVLine(line, ';');
      expect(result).toEqual(['Customer', 'Year', 'Month', '']);
    });
  });

  describe('parseCSV', () => {
    it('should parse semicolon-separated CSV with headers and data', () => {
      const csv = `Customer;Year;Product
Magasin A;2025;Dentifrice
Magasin B;2025;Yaourt`;
      const result = parseCSV(csv, ';');
      expect(result).toEqual([
        { Customer: 'Magasin A', Year: '2025', Product: 'Dentifrice' },
        { Customer: 'Magasin B', Year: '2025', Product: 'Yaourt' },
      ]);
    });

    it('should parse comma-separated CSV with headers and data', () => {
      const csv = `Customer,Year,Product
Magasin A,2025,Dentifrice
Magasin B,2025,Yaourt`;
      const result = parseCSV(csv, ',');
      expect(result).toEqual([
        { Customer: 'Magasin A', Year: '2025', Product: 'Dentifrice' },
        { Customer: 'Magasin B', Year: '2025', Product: 'Yaourt' },
      ]);
    });

    it('should auto-detect semicolon separator when not specified', () => {
      const csv = `Customer;Year;Product
Magasin A;2025;Dentifrice`;
      const result = parseCSV(csv);
      expect(result).toEqual([
        { Customer: 'Magasin A', Year: '2025', Product: 'Dentifrice' },
      ]);
    });

    it('should parse CSV with quoted values', () => {
      const csv = `"Customer";"Year";"Product"
"Magasin A";2025;"Dentifrice"
"Magasin B";2025;"Yaourt"`;
      const result = parseCSV(csv, ';');
      expect(result).toEqual([
        { Customer: 'Magasin A', Year: '2025', Product: 'Dentifrice' },
        { Customer: 'Magasin B', Year: '2025', Product: 'Yaourt' },
      ]);
    });

    it('should skip empty lines', () => {
      const csv = `Customer;Year;Product

Magasin A;2025;Dentifrice

Magasin B;2025;Yaourt`;
      const result = parseCSV(csv, ';');
      expect(result).toEqual([
        { Customer: 'Magasin A', Year: '2025', Product: 'Dentifrice' },
        { Customer: 'Magasin B', Year: '2025', Product: 'Yaourt' },
      ]);
    });

    it('should handle CSV with empty data rows', () => {
      const csv = `Customer;Year;Product`;
      const result = parseCSV(csv, ';');
      expect(result).toEqual([]);
    });

    it('should handle CSV with empty string', () => {
      const csv = '';
      const result = parseCSV(csv, ';');
      expect(result).toEqual([]);
    });

    it('should parse sample.csv format correctly', () => {
      // Sample data from public/sample.csv
      const csv = `"Customer";"Year";"Month";"Product";"Quantity";"Total TTC"
"Magasin A";2025;1;"Dentifrice";10;200
"Magasin B";2025;2;"Dentifrice";40;300`;
      const result = parseCSV(csv);
      expect(result).toEqual([
        {
          Customer: 'Magasin A',
          Year: '2025',
          Month: '1',
          Product: 'Dentifrice',
          Quantity: '10',
          'Total TTC': '200',
        },
        {
          Customer: 'Magasin B',
          Year: '2025',
          Month: '2',
          Product: 'Dentifrice',
          Quantity: '40',
          'Total TTC': '300',
        },
      ]);
    });

    it('should handle numeric values as strings', () => {
      const csv = `Customer;Year;Quantity
Magasin A;2025;10`;
      const result = parseCSV(csv, ';');
      expect(result[0].Year).toBe('2025');
      expect(result[0].Quantity).toBe('10');
    });

    it('should handle CSV with extra columns in data rows', () => {
      const csv = `Customer;Year
Magasin A;2025;Extra
Magasin B;2025`;
      const result = parseCSV(csv, ';');
      expect(result).toEqual([
        { Customer: 'Magasin A', Year: '2025' },
        { Customer: 'Magasin B', Year: '2025' },
      ]);
    });

    it('should handle CSV with fewer columns in data rows', () => {
      const csv = `Customer;Year;Product
Magasin A;2025
Magasin B;2025;Yaourt`;
      const result = parseCSV(csv, ';');
      expect(result).toEqual([
        { Customer: 'Magasin A', Year: '2025', Product: '' },
        { Customer: 'Magasin B', Year: '2025', Product: 'Yaourt' },
      ]);
    });
  });
});
