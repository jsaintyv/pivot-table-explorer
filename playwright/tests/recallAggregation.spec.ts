import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * End-to-End Test for Data Aggregation in PivotGrid
 * 
 * This test validates data aggregation when:
 * - Rows: Customer
 * - Columns: Year
 * - Measure: Recall
 * 
 * Expected results from recall.csv:
 * - Magasin A, 2025: 3 + 20 + 4 = 27
 * - Magasin B, 2025: 24 + 43 + 20 + 43 + 23 + 41 = 194
 */

test.describe('Data Aggregation Test', () => {
  const VIEW_NAME = 'RecallAggregationTest';
  const CSV_FILE_NAME = 'recall.csv';

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL);
  });

  /**
   * Step 1: Import CSV file with test data
   */
  async function importCSV(page: any) {
    const fileInput = page.locator('.import-button input[type="file"]');
    const filePath = path.resolve(__dirname, `../../public/${CSV_FILE_NAME}`);
    await fileInput.setInputFiles(filePath);
    
    // Wait for dimensions to be created from CSV columns
    await expect(page.locator('.dimension-name:has-text("Customer")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.dimension-name:has-text("Year")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.dimension-name:has-text("Recall")')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Step 2: Create view with aggregation configuration
   */
  async function createViewWithAggregation(page: any) {
    // Create view
    await page.locator('.views-section .view-name-input').fill(VIEW_NAME);
    await page.locator('.create-view .create-button').click();
    await expect(page.locator('.view-name:has-text("RecallAggregationTest")')).toBeVisible({ timeout: 5000 });

    // Click SHOW to navigate to view-grid
    await page.locator('.view-item:has(.view-name:has-text("RecallAggregationTest")) .show-button').click();
    await page.waitForURL('**/view-grid');

    // Configure Row dimensions: Customer
    await page.locator('.config-label:has-text("Row dimensions")').locator('..').locator('.add-dimension-btn').click();
    await page.locator('.dimension-item-modal:has-text("Customer")').click();
    await page.locator('.modal .btn-apply-modal:has-text("Close")').click();

    // Configure Column dimensions: Year
    await page.locator('.config-label:has-text("Column dimensions")').locator('..').locator('.add-dimension-btn').click();
    await page.locator('.dimension-item-modal:has-text("Year")').click();
    await page.locator('.modal .btn-apply-modal:has-text("Close")').click();

    // Configure Measure: Recall
    await page.locator('.config-label:has-text("Value fields")').locator('..').locator('.add-dimension-btn').click();
    await page.locator('.dimension-item-modal:has-text("Recall")').click();
    await page.locator('.modal .btn-apply-modal:has-text("Close")').click();

    // Wait for pivot grid to render
    await page.waitForSelector('.pivot-grid-wrapper', { timeout: 10000 });
    
    // Enable totals if needed (they should be enabled by default in GridMain)
  }

  /**
   * Test: Verify data aggregation for Customer vs Year with Recall measure
   */
  test('data aggregation shows correct Recall values for Customer vs Year', async ({ page }) => {
    await importCSV(page);
    await createViewWithAggregation(page);

    // Verify that we have the expected structure
    // Row headers: Magasin A, Magasin B
    await expect(page.locator('.grid-cell.header.row-header:has-text("Magasin A")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.grid-cell.header.row-header:has-text("Magasin B")')).toBeVisible({ timeout: 5000 });

    // Column headers: 2025
    await expect(page.locator('.grid-cell.header.column-header:has-text("2025")')).toBeVisible({ timeout: 5000 });

    // Verify aggregated data cells using data-testid
    // Magasin A, 2025 should show 27 (3 + 20 + 4)
    const cellMagasinA = page.locator('[data-testid="Magasin A:2025;Recall"]');
    await expect(cellMagasinA).toBeVisible({ timeout: 5000 });
    await expect(cellMagasinA).toContainText('27');

    // Magasin B, 2025 should show 194 (24 + 43 + 20 + 43 + 23 + 41)
    const cellMagasinB = page.locator('[data-testid="Magasin B:2025;Recall"]');
    await expect(cellMagasinB).toBeVisible({ timeout: 5000 });
    await expect(cellMagasinB).toContainText('194');

    // Verify row totals
    // Magasin A row total should be 27
    const rowTotalMagasinA = page.locator('[data-testid="Magasin A:__TOTAL__"]');
    await expect(rowTotalMagasinA).toBeVisible({ timeout: 5000 });
    await expect(rowTotalMagasinA).toContainText('27');

    // Magasin B row total should be 194
    const rowTotalMagasinB = page.locator('[data-testid="Magasin B:__TOTAL__"]');
    await expect(rowTotalMagasinB).toBeVisible({ timeout: 5000 });
    await expect(rowTotalMagasinB).toContainText('194');

    // Verify column totals
    // 2025 column total should be 221 (27 + 194)
    const colTotal2025 = page.locator('[data-testid="__TOTAL__:2025;Recall"]');
    await expect(colTotal2025).toBeVisible({ timeout: 5000 });
    await expect(colTotal2025).toContainText('221');

    // Verify grand total
    // Grand total should be 221
    const grandTotal = page.locator('[data-testid="__GRAND_TOTAL__"]');
    await expect(grandTotal).toBeVisible({ timeout: 5000 });
    await expect(grandTotal).toContainText('221');
  });
});
