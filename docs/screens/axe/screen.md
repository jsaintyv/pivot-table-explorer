# Axe Screen

The Axe screen allows users to **create and edit dimensions** by associating columns from source CSV files as axes for pivoting data.

## Design

In pseudo HTML:
```
<h1>Edit Dimension</h1>

<!-- Dimension Identity -->
<div class="dimension-identity">
  <input type="text" placeholder="Dimension name" value="{dimension.name}"/>
  <select>
    <option value="string">String</option>
    <option value="number">Number</option>
    <option value="date">Date</option>
    <option value="boolean">Boolean</option>
  </select>
</div>

<!-- Column Mappings -->
<h3>Map Source Columns</h3>
<forEach sourceFile in sourceFiles>
  <div class="source-file-mapping">
    <span>{sourceFile.name}</span>
    <select>
      <option value="" disabled>Select a column</option>
      <forEach column in sourceFile.columns>
        <option value="{column.index}">{column.name}</option>
      </forEach>
    </select>
    <button onClick="unlink()">Unlink</button>
  </div>
</forEach>

<button>Save Dimension</button>
<button>Back to Main screen</button>
```

## Components

- **Dimension identity form**: Input for dimension name + datatype selector
- **Source file mappers**: For each source file, dropdown to select which column maps to this dimension
- **Unlink button**: Remove the mapping for a specific source file
- **Save button**: Persist the dimension with its current mappings
- **Back button**: Return to Main screen

## Actions

```gherkin
Given I am on the Main screen
When I click "Create Dimension"
Then I navigate to Axe screen with a new empty dimension

Given I am on the Axe screen
When I enter a dimension name and select a datatype
And I select a column from a source file dropdown
Then that column is mapped to the dimension

Given I am on the Axe screen with an existing dimension
When I change the dimension name
Then the name is updated when I save

Given I am on the Axe screen
When I click "Save Dimension"
Then the dimension is persisted in the Store with all current column mappings

Given a dimension has a column mapped from a source file
When I click Unlink for that source file
Then the mapping is removed from the dimension

Given there are multiple source files with columns of the same name
When I select that column name for the dimension in multiple source files
Then all those columns are mapped to the same dimension

Given I am on the Axe screen
When I click on "Back to Main screen"
Then I return to the Main screen
```
