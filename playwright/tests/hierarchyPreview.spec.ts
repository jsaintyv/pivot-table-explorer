import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * End-to-End Test for Hierarchy Preview in Dimension Editor
 * 
 * This test validates that:
 * 1. products.csv can be imported
 * 2. The ParentCode dimension (auto-created) can be removed
 * 3. The ProductCode dimension can be edited to enable hierarchy mode
 * 4. ParentCode column can be mapped as parentCode
 * 5. The hierarchy preview displays the correct structure:
 *    - MEM with children DDR4, DDR5
 *    - GRAPH with children NV5050, NV5060
 */

test.describe('Hierarchy Preview Test', () => {
  const CSV_FILE_NAME = 'products.csv';

  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and permissions to ensure clean state
    await context.clearCookies();
    await context.clearPermissions();
    
    // Add init script to clear localStorage before page load
    await context.addInitScript({ content: 'window.localStorage.clear();' });
    
    // Navigate to the app
    await page.goto(process.env.BASE_URL);
    
    // Wait for the app to be ready
    await page.waitForSelector('.import-button', { timeout: 10000 });
  });

  /**
   * Step 1: Import CSV file with test data
   */
  async function importCSV(page: any) {
    const fileInput = page.locator('.import-button input[type="file"]');
    const filePath = path.resolve(__dirname, `../../public/${CSV_FILE_NAME}`);
    
    // Check that the file exists and has content
    const fs = await import('fs');
    const fileContent = await fs.promises.readFile(filePath, 'utf8');
    console.log('File content:', fileContent.substring(0, 200));
    
    // Intercept console.log to see if the callback is called
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    await fileInput.setInputFiles(filePath);
    
    // Wait for dimensions to be created from CSV columns
    // products.csv has columns: ParentCode (0), ProductCode (1), Label (2)
    await expect(page.locator('.dimension-name:has-text("ParentCode")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.dimension-name:has-text("ProductCode")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.dimension-name:has-text("Label")')).toBeVisible({ timeout: 5000 });
    
    // Check console messages
    console.log('Console messages:', consoleMessages);
    
    // Check if data source was created with data
    try {
      await page.waitForTimeout(500);
      const dsDataAfterImport = await page.evaluate(() => {
        const store = (window as any).Store?.getInstance?.();
        if (store && store.pivotProject && store.pivotProject.dataSources) {
          const ds = store.pivotProject.dataSources.find((d: any) => d.name === 'products.csv');
          if (ds && ds.data) {
            return { rows: ds.data.length, firstRow: ds.data[0], columns: ds.columns?.length };
          }
        }
        return { rows: 0, firstRow: null, columns: 0 };
      });
      console.log(`Data source data after import: ${JSON.stringify(dsDataAfterImport)}`);
    } catch (e) {
      console.log('Could not access data source after import:', e.message);
    }
  }

  /**
   * Step 2: Remove ParentCode dimension
   */
  async function removeParentCodeDimension(page: any) {
    // Find the ParentCode dimension item and delete it
    const parentCodeDimension = page.locator('.dimension-item:has(.dimension-name:has-text("ParentCode"))');
    
    // Listen for the confirmation dialog
    page.on('dialog', async dialog => {
      if (dialog.message().includes('Are you sure')) {
        await dialog.accept();
      }
    });
    
    await parentCodeDimension.locator('.remove-button').click();
    
    // Wait for dimension to be removed
    await expect(page.locator('.dimension-name:has-text("ParentCode")')).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Step 3: Edit ProductCode dimension
   */
  async function editProductCodeDimension(page: any) {
    // Click Edit on ProductCode dimension
    const productCodeDimension = page.locator('.dimension-item:has(.dimension-name:has-text("ProductCode"))');
    await productCodeDimension.locator('.edit-button').click();
    
    // Wait for navigation to dimension editor
    await page.waitForURL('**/dimensions/**', { timeout: 5000 });
    
    // Verify we're on the dimension editor screen
    await expect(page.locator('h1:has-text("Edit Dimension")')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Step 4: Configure hierarchy mode with parent code
   * Simplified approach: ensure we have exactly 2 mappings:
   * - One for ProductCode column as 'code' type (the code column)
   * - One for ParentCode column as 'parentCode' type
   */
  async function configureHierarchyMode(page: any) {
    // Switch to Parent mode first
    const hierarchyModeSelect = page.locator('#dimension-hierarchy-mode');
    await hierarchyModeSelect.selectOption('parent');
    
    // Wait for mode to change
    await expect(hierarchyModeSelect).toHaveValue('parent', { timeout: 3000 });
    
    // Wait for the existing mapping to be updated (it will be reset to 'parentCode' type)
    // and for nodes to be rebuilt (which will fail because there's no code column yet)
    await page.waitForTimeout(1000);
    
    // Get current mapping count
    const allMappings = page.locator('.mapping-item');
    let mappingCount = await allMappings.count();
    
    // We need exactly 2 mappings:
    // - ProductCode (column 1) as 'code' type
    // - ParentCode (column 0) as 'parentCode' type
    
    // Add a second mapping if we only have 1
    // Use a more specific selector to target the Column Mapping button (not Property Mapping)
    const addColumnMappingButton = page.locator('.mappings-container .add-mapping-btn');
    if (mappingCount < 2 && await addColumnMappingButton.count() > 0) {
      await addColumnMappingButton.click();
      await page.waitForTimeout(300);
      mappingCount = await allMappings.count();
    }
    
    // Remove extra mappings if we have more than 2
    while (mappingCount > 2 && await allMappings.count() > 0) {
      const removeButtons = page.locator('.remove-mapping');
      const removeCount = await removeButtons.count();
      if (removeCount > 0) {
        await removeButtons.nth(0).click();
        await page.waitForTimeout(300);
        mappingCount = await allMappings.count();
      } else {
        break;
      }
    }
    
    // Now configure the two mappings
    // Mapping 0: ProductCode (column 1) as 'code'
    if (await allMappings.count() >= 1) {
      const firstMapping = page.locator('.mapping-item').nth(0);
      
      // Select ProductCode column (index 1)
      const firstColumnSelect = firstMapping.locator('select[name*="column"]');
      if (await firstColumnSelect.count() > 0) {
        await firstColumnSelect.selectOption('1');
        await page.waitForTimeout(200);
      }
      
      // Set mapping type to 'code'
      const firstTypeSelect = firstMapping.locator('select[name*="mappingType"]');
      if (await firstTypeSelect.count() > 0) {
        await firstTypeSelect.selectOption('code');
        await page.waitForTimeout(500); // Wait for nodes to rebuild
      }
    }
    
    // Mapping 1: ParentCode (column 0) as 'parentCode'
    if (await allMappings.count() >= 2) {
      const secondMapping = page.locator('.mapping-item').nth(1);
      
      // Select ParentCode column (index 0)
      const secondColumnSelect = secondMapping.locator('select[name*="column"]');
      if (await secondColumnSelect.count() > 0) {
        await secondColumnSelect.selectOption('0');
        await page.waitForTimeout(200);
      }
      
      // Set mapping type to 'parentCode'
      const secondTypeSelect = secondMapping.locator('select[name*="mappingType"]');
      if (await secondTypeSelect.count() > 0) {
        await secondTypeSelect.selectOption('parentCode');
        await page.waitForTimeout(500); // Wait for nodes to rebuild
      }
    }
    
    // Wait for hierarchy preview to update with the new nodes
    await page.waitForTimeout(1500);
    
    // Debug: check the mappings
    const mappingItems = page.locator('.mapping-item');
    const finalCount = await mappingItems.count();
    console.log(`Final mapping count: ${finalCount}`);
    
    for (let i = 0; i < finalCount; i++) {
      const mapping = page.locator('.mapping-item').nth(i);
      const column = await mapping.locator('select[name*="column"]').inputValue();
      const type = await mapping.locator('select[name*="mappingType"]').inputValue();
      console.log(`Mapping ${i}: column=${column}, type=${type}`);
    }
    
    // Debug: check what's in the hierarchy preview
    const treeContent = await page.locator('.hierarchy-tree').textContent();
    console.log('Hierarchy tree content:', JSON.stringify(treeContent));
    
    // Also check the hierarchy mode
    const mode = await page.locator('#dimension-hierarchy-mode').inputValue();
    console.log('Hierarchy mode:', mode);
    
    // Check the available data sources
    const sourceBadges = page.locator('.source-badge');
    const sourceCount = await sourceBadges.count();
    console.log(`Data source count: ${sourceCount}`);
    for (let i = 0; i < sourceCount; i++) {
      const sourceName = await sourceBadges.nth(i).textContent();
      console.log(`Data source ${i}: ${sourceName}`);
    }
    
    // Check if there are any nodes in the dimension by accessing the store
    try {
      const nodesCount = await page.evaluate(() => {
        // Access the DimensionEditorStore singleton
        const store = (window as any).DimensionEditorStoreInstance || (window as any).getDimensionEditorStore?.();
        if (store && store.dimension && store.dimension.nodes) {
          return store.dimension.nodes.length;
        }
        return 0;
      });
      console.log(`Nodes count in dimension: ${nodesCount}`);
    } catch (e) {
      console.log('Could not access nodes:', e.message);
    }
    
    // Check if there are any nodes in the project
    try {
      const projectNodes = await page.evaluate(() => {
        const store = (window as any).Store?.getInstance?.();
        if (store && store.pivotProject && store.pivotProject.dimensions) {
          const productDim = store.pivotProject.dimensions.find((d: any) => d.name === 'ProductCode');
          if (productDim && productDim.nodes) {
            return productDim.nodes.length;
          }
        }
        return 0;
      });
      console.log(`Nodes count in project ProductCode dimension: ${projectNodes}`);
    } catch (e) {
      console.log('Could not access project nodes:', e.message);
    }
    
    // Also check the data source data
    try {
      const dsData = await page.evaluate(() => {
        const store = (window as any).Store?.getInstance?.();
        if (store && store.pivotProject && store.pivotProject.dataSources) {
          const ds = store.pivotProject.dataSources.find((d: any) => d.name === 'products.csv');
          if (ds && ds.data) {
            return { rows: ds.data.length, firstRow: ds.data[0] };
          }
        }
        return { rows: 0, firstRow: null };
      });
      console.log(`Data source data: ${JSON.stringify(dsData)}`);
    } catch (e) {
      console.log('Could not access data source data:', e.message);
    }
    
    // Wait longer
    await page.waitForTimeout(2000);
    const treeContent2 = await page.locator('.hierarchy-tree').textContent();
    console.log('Hierarchy tree content after extra wait:', JSON.stringify(treeContent2));
  }

  /**
   * Test: Verify hierarchy preview shows correct structure for Parent mode
   */
  test('hierarchy preview displays correct parent-child structure', async ({ page }) => {
    await importCSV(page);
    await removeParentCodeDimension(page);
    await editProductCodeDimension(page);
    await configureHierarchyMode(page);
    
    // Now verify the hierarchy preview
    // The hierarchy should show:
    // - MEM with children DDR4, DDR5
    // - GRAPH with children NV5050, NV5060
    
    // First, verify that we have the hierarchy tree container
    const hierarchyTree = page.locator('.hierarchy-tree');
    await expect(hierarchyTree).toBeVisible({ timeout: 5000 });
    
    // Check that the hierarchy contains MEM and GRAPH as root nodes
    await expect(page.locator('text=/MEM/')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/GRAPH/')).toBeVisible({ timeout: 5000 });
    
    // Check that MEM has children DDR4 and DDR5
    await expect(page.locator('text=/DDR4/')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/DDR5/')).toBeVisible({ timeout: 5000 });
    
    // Check that GRAPH has children NV5050 and NV5060
    await expect(page.locator('text=/NV5050/')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/NV5060/')).toBeVisible({ timeout: 5000 });
    
    // Verify mode is Parent
    const modeIndicator = page.locator('.mode-indicator:has-text("Parent")');
    await expect(modeIndicator).toBeVisible({ timeout: 3000 });
  });
});
