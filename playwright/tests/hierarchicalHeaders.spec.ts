import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * End-to-End Test for Hierarchical Headers in PivotGrid
 * 
 * This test validates the use case described in:
 * docs/usesCases/Basic/useCase.md
 * 
 * It tests:
 * - CSV import with specific data (Shop A/B, Year 2024/2025, Month 1/2/3, Product Tool A/B/C)
 * - View creation with hierarchical dimensions (Customer -> Product for rows, Year -> Month for columns)
 * - Measures configuration (Recalled, Sold)
 * - Correct rendering of hierarchical headers with proper spanning
 * - Data cell positioning and values
 */

test.describe('Hierarchical Headers Use Case', () => {
  // Constants for the test
  const VIEW_NAME = 'HierarchicalHeadersTest';
  const CSV_FILE_NAME = 'useCaseHierarchicalHeaders.csv';
  const CELL_WIDTH = 120;
  const CELL_HEIGHT = 40;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL);
  });

  /**
   * Step 1: Import CSV file with test data
   */
  async function importCSV(page: any) {
    const fileInput = page.locator('.import-button input[type="file"]');
    const filePath = path.resolve(__dirname, `fixtures/${CSV_FILE_NAME}`);
    await fileInput.setInputFiles(filePath);
    
    // Wait for dimensions to be created from CSV columns
    await expect(page.locator('.dimension-name:has-text("Customer")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.dimension-name:has-text("Year")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.dimension-name:has-text("Month")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.dimension-name:has-text("Product")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.dimension-name:has-text("Recalled")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.dimension-name:has-text("Sold")')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Step 2: Create view with hierarchical dimensions
   */
  async function createViewWithHierarchy(page: any) {
    // Create view
    await page.locator('.views-section .view-name-input').fill(VIEW_NAME);
    await page.locator('.create-view .create-button').click();
    await expect(page.locator('.view-name:has-text("HierarchicalHeadersTest")')).toBeVisible({ timeout: 5000 });

    // Click SHOW to navigate to view-grid
    await page.locator('.view-item:has(.view-name:has-text("HierarchicalHeadersTest")) .show-button').click();
    await page.waitForURL('**/view-grid');

    // Configure Row dimensions: Customer -> Product
    await page.locator('.config-label:has-text("Row dimensions")').locator('..').locator('.add-dimension-btn').click();
    await page.locator('.dimension-item-modal:has-text("Customer")').click();
    await page.locator('.modal .btn-apply-modal:has-text("Close")').click();
    
    await page.locator('.config-label:has-text("Row dimensions")').locator('..').locator('.add-dimension-btn').click();
    await page.locator('.dimension-item-modal:has-text("Product")').click();
    await page.locator('.modal .btn-apply-modal:has-text("Close")').click();

    // Configure Column dimensions: Year -> Month
    await page.locator('.config-label:has-text("Column dimensions")').locator('..').locator('.add-dimension-btn').click();
    await page.locator('.dimension-item-modal:has-text("Year")').click();
    await page.locator('.modal .btn-apply-modal:has-text("Close")').click();
    
    await page.locator('.config-label:has-text("Column dimensions")').locator('..').locator('.add-dimension-btn').click();
    await page.locator('.dimension-item-modal:has-text("Month")').click();
    await page.locator('.modal .btn-apply-modal:has-text("Close")').click();

    // Configure Measures: Recalled, Sold
    await page.locator('.config-label:has-text("Value fields")').locator('..').locator('.add-dimension-btn').click();
    await page.locator('.dimension-item-modal:has-text("Recalled")').click();
    await page.locator('.modal .btn-apply-modal:has-text("Close")').click();
    
    await page.locator('.config-label:has-text("Value fields")').locator('..').locator('.add-dimension-btn').click();
    await page.locator('.dimension-item-modal:has-text("Sold")').click();
    await page.locator('.modal .btn-apply-modal:has-text("Close")').click();

    // Wait for pivot grid to render
    await page.waitForSelector('.pivot-grid-wrapper', { timeout: 10000 });
  }

  /**
   * Test: Complete hierarchical headers use case flow
   */
  test('hierarchical headers render correctly with Customer->Product rows and Year->Month->Measure columns', async ({ page }) => {
    // Step 1: Import CSV
    await importCSV(page);

    // Step 2: Create view with hierarchy
    await createViewWithHierarchy(page);

    // Step 3: Verify hierarchical column headers
    // Level 0: Year headers (2024, 2025) - each spans 6 leaf columns (3 months * 2 measures)
    await test.step('Verify Year column headers', async () => {
      const year2024 = page.locator('div.column-header').filter({ hasText: /^2024$/ });
      await expect(year2024).toBeVisible({ timeout: 10000,  });
      
      const year2025 = page.locator('.grid-cell.header.column-header.hierarchy-level-0:has-text("2025")');
      await expect(year2025).toBeVisible({ timeout: 10000 });

      const corner = page.locator('div.corner-cell');

      const cornerBox = await year2024.boundingBox();
            
      // Verify positioning: 2024 should be at left: 240px (row header width), top: 0
      const year2024Box = await year2024.boundingBox();
      
      expect(year2024Box?.width).toBeCloseTo(720, 1); // 6 * 120
      expect(year2024Box?.height).toBeCloseTo(40, 1);
      
      // 2025 should be next to 2024
      const year2025Box = await year2025.boundingBox();
      
      expect(year2025Box?.width).toBeCloseTo(720, 1);
      expect(year2025Box?.height).toBeCloseTo(40, 1);
    });

    // Level 1: Month headers - each spans 2 leaf columns (2 measures)
    await test.step('Verify Month column headers under Year 2024', async () => {
      const month1_2024 = page.locator('.grid-cell.header.column-header.hierarchy-level-1:has-text("1")').first();
      await expect(month1_2024).toBeVisible({ timeout: 10000 });
      
      const month1Box = await month1_2024.boundingBox();      
      expect(month1Box?.width).toBeCloseTo(240, 1); // 2 * 120
      expect(month1Box?.height).toBeCloseTo(40, 1);
    });

    // Level 2: Measure headers (Recalled, Sold) - leaf nodes
    await test.step('Verify Measure column headers', async () => {
      // All Recalled headers
      const recalledHeaders = page.locator('.grid-cell.header.column-header.hierarchy-level-2:has-text("Recalled")');
      await expect(recalledHeaders).toHaveCount(6); // 2 years * 3 months
      
      // Verify first Recalled (2024;1;Recalled)
      const firstRecalled = recalledHeaders.first();
      const firstRecalledBox = await firstRecalled.boundingBox();      
      expect(firstRecalledBox?.width).toBeCloseTo(120, 1);
      expect(firstRecalledBox?.height).toBeCloseTo(40, 1);
      
      // All Sold headers
      const soldHeaders = page.locator('.grid-cell.header.column-header.hierarchy-level-2:has-text("Sold")');
      await expect(soldHeaders).toHaveCount(6);
    });

    // Step 4: Verify hierarchical row headers
    await test.step('Verify Customer row headers', async () => {
      const shopA = page.locator('.grid-cell.header.row-header.hierarchy-level-0:has-text("Shop A")');
      await expect(shopA).toBeVisible({ timeout: 5000 });
      
      const shopABox = await shopA.boundingBox();      
      expect(shopABox?.width).toBeCloseTo(120, 1);
      expect(shopABox?.height).toBeCloseTo(120, 1); // 3 products * 40
      
      const shopB = page.locator('.grid-cell.header.row-header.hierarchy-level-0:has-text("Shop B")');
      await expect(shopB).toBeVisible({ timeout: 5000 });
      
      const shopBBox = await shopB.boundingBox();      
      expect(shopBBox?.width).toBeCloseTo(120, 1);
      expect(shopBBox?.height).toBeCloseTo(120, 1);
    });

    // Level 1: Product headers
    await test.step('Verify Product row headers under Customer', async () => {
      const toolHeaders = page.locator('.grid-cell.header.row-header.hierarchy-level-1:has-text("Tool A")');
      await expect(toolHeaders).toHaveCount(2); // One for Shop A, one for Shop B
      
      const firstToolA = toolHeaders.first();
      const firstToolABox = await firstToolA.boundingBox();      
      expect(firstToolABox?.width).toBeCloseTo(120, 1);
      expect(firstToolABox?.height).toBeCloseTo(40, 1);
    });

    // Step 5: Verify data cells with correct values
    await test.step('Verify data cells have correct values', async () => {
      // Shop A, Tool A should have value 3 for Recalled in 2024, Month 1
      // Find the data cell at the correct position
      // Row: Shop A, Tool A (row index 0) -> top: 120 + (0 * 40) = 120
      // Column: 2024, Month 1, Recalled (col index 0) -> left: 240 + (0 * 120) = 240
      const cell3 = page.locator('.grid-cell:not(.header):has-text("3")').first();
      await expect(cell3).toBeVisible({ timeout: 5000 });
      
      const cell3Box = await cell3.boundingBox();      
      expect(cell3Box?.width).toBeCloseTo(120, 1);
      expect(cell3Box?.height).toBeCloseTo(40, 1);
    });
      
    // Step 6: Verify corner cell
    await test.step('Verify corner cell exists', async () => {
      const cornerCell = page.locator('.corner-cell');
      await expect(cornerCell).toBeVisible({ timeout: 10000 });
      
      const cornerBox = await cornerCell.boundingBox();      
      expect(cornerBox?.width).toBeCloseTo(240, 1); // 2 * 120 (row header width)
      expect(cornerBox?.height).toBeCloseTo(120, 1); // 3 * 40 (column header height)
    });
  });

  /**
   * Test: Verify specific data points from the use case
   */
  test('specific data cells match use case values', async ({ page }) => {
    await importCSV(page);
    await createViewWithHierarchy(page);

    // Expected data points from useCase.md
    const expectedValues = [
      { rowKey: 'Shop A;Tool A', colKey: '2024;1;Recalled', value: '3' },
      { rowKey: 'Shop A;Tool A', colKey: '2024;1;Sold', value: '5' },
      { rowKey: 'Shop A;Tool B', colKey: '2024;1;Recalled', value: '20' },
      { rowKey: 'Shop A;Tool B', colKey: '2024;1;Sold', value: '15' },
      { rowKey: 'Shop A;Tool C', colKey: '2024;2;Recalled', value: '4' },
      { rowKey: 'Shop A;Tool C', colKey: '2024;2;Sold', value: '303' },
      { rowKey: 'Shop B;Tool A', colKey: '2024;3;Recalled', value: '43' },
      { rowKey: 'Shop B;Tool A', colKey: '2024;3;Sold', value: '320' },
    ];

    for (const expected of expectedValues) {
      const key = expected.rowKey + ":" + expected.colKey;
      const ele = page.locator(`[data-testid="${key}"]`);
      await expect(ele).toBeVisible({timeout: 10000});
      await expect(ele).toContainText(expected.value);
    }
  });

  /**
   * Test: Verify hierarchy structure - column header count
   */
  test('column hierarchy has correct number of header cells', async ({ page }) => {
    await importCSV(page);
    await createViewWithHierarchy(page);

    // Level 0: 2 Year headers (2024, 2025)
    const level0Headers = page.locator('.grid-cell.header.column-header.hierarchy-level-0');
    await expect(level0Headers).toHaveCount(2);

    // Level 1: 6 Month headers (3 per year * 2 years)
    const level1Headers = page.locator('.grid-cell.header.column-header.hierarchy-level-1');
    await expect(level1Headers).toHaveCount(6);

    // Level 2: 12 Measure headers (Recalled, Sold for each Month * 6 Months)
    const level2Headers = page.locator('.grid-cell.header.column-header.hierarchy-level-2');
    await expect(level2Headers).toHaveCount(12);
  });

  /**
   * Test: Verify hierarchy structure - row header count
   */
  test('row hierarchy has correct number of header cells', async ({ page }) => {
    await importCSV(page);
    await createViewWithHierarchy(page);

    // Level 0: 2 Customer headers (Shop A, Shop B)
    const level0Headers = page.locator('.grid-cell.header.row-header.hierarchy-level-0');
    await expect(level0Headers).toHaveCount(2);

    // Level 1: 6 Product headers (Tool A, B, C for each Shop * 2 Shops)
    const level1Headers = page.locator('.grid-cell.header.row-header.hierarchy-level-1');
    await expect(level1Headers).toHaveCount(6);
  });

  /**
   * Test: Verify spanning of parent headers over children
   */
  test('parent headers correctly span over children', async ({ page }) => {
    await importCSV(page);
    await createViewWithHierarchy(page);

    // Year 2024 should span over 6 leaf columns (3 months * 2 measures)
    const year2024 = page.locator('.grid-cell.header.column-header.hierarchy-level-0:has-text("2024")');
    const year2024Box = await year2024.boundingBox();
    expect(year2024Box?.width).toBeCloseTo(720, 1); // 6 * 120

    // Month 1 under 2024 should span over 2 leaf columns (Recalled, Sold)
    const month1_2024 = page.locator('.grid-cell.header.column-header.hierarchy-level-1:has-text("1")').first();
    const month1Box = await month1_2024.boundingBox();
    expect(month1Box?.width).toBeCloseTo(240, 1); // 2 * 120

    // Shop A should span over 3 leaf rows (Tool A, B, C)
    const shopA = page.locator('.grid-cell.header.row-header.hierarchy-level-0:has-text("Shop A")');
    const shopABox = await shopA.boundingBox();
    expect(shopABox?.height).toBeCloseTo(120, 1); // 3 * 40
  });
});
