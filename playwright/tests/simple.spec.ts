import { test, expect } from '@playwright/test';
import path from 'path';

test('has title', async ({ page }) => {
  await page.goto(process.env.BASE_URL);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Pivot Table Explorer/);

  
});

test('upload CSV file and verify Customer dimension is present', async ({ page }) => {
  await page.goto(process.env.BASE_URL);

  // Find the hidden file input inside the import button label
  const fileInput = page.locator('.import-button input[type="file"]');
  
  // Get the absolute path to the sample.csv file
  const filePath = path.resolve(__dirname, '../../public/sample.csv');
  
  // Upload the file
  await fileInput.setInputFiles(filePath);
  
  // Wait for the Customer dimension to appear in the dimensions list
  // The dimension is auto-created from the CSV column and displayed in .dimension-name
  await expect(page.locator('.dimension-name:has-text("Customer")')).toBeVisible({ timeout: 5000 });

  // Ajouter une View "TEST"
  await page.locator('.views-section .view-name-input').fill('TEST');
  await page.locator('.create-view .create-button').click();

  // Attendre que la view "TEST" apparaisse
  await expect(page.locator('.view-name:has-text("TEST")')).toBeVisible({ timeout: 5000 });

  // Cliquez sur SHOW de cette View
  await page.locator('.view-item:has(.view-name:has-text("TEST")) .show-button').click();

  // Attendre la navigation vers /view-grid
  await page.waitForURL('**/view-grid');

  // Ajouter Customer en "row dimensions"
  await page.locator('.config-label:has-text("Row dimensions")').locator('..').locator('.add-dimension-btn').click();
  await page.locator('.dimension-item-modal:has-text("Customer")').click();
  await page.locator('.modal .btn-apply-modal:has-text("Close")').click();

  // Ajouter Product en "column dimensions"
  await page.locator('.config-label:has-text("Column dimensions")').locator('..').locator('.add-dimension-btn').click();
  await page.locator('.dimension-item-modal:has-text("Product")').click();
  await page.locator('.modal .btn-apply-modal:has-text("Close")').click();

  // Ajouter Quantity en "value fields"
  await page.locator('.config-label:has-text("Value fields")').locator('..').locator('.add-dimension-btn').click();
  await page.locator('.dimension-item-modal:has-text("Quantity")').click();
  await page.locator('.modal .btn-apply-modal:has-text("Close")').click();

  // Vérifies qu'on a "Magasin 1" qui apparait dans .pivot-grid-container
  await expect(page.locator('.pivot-grid-container:has-text("Magasin 1")')).toBeVisible({ timeout: 10000 });
});

