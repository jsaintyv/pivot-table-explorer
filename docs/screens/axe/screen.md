# Axe Screen

The Axe screen allows users to configure which columns from source CSV files will be used as axes (dimensions) for pivoting data.

## Design

In pseudo HTML:
```
<forEach sourceFile in sourceFiles>
  <select>
    <option disabled>Select a column for axis</option>
    <forEach column in sourceFile.columns>
      <option value="{column.name}">{column.name}</option>
    </forEach>
  </select>
  <button>Unlink</button>
</forEach>

<h3>Associated columns</h3>
<forEach dimension in dimensions>
  <h4>{dimension.name}</h4>
  <forEach sourceFile in dimension.sourceFiles>
    {sourceFile.name}.{sourceFile.column.name}
  </forEach>
</forEach>

<button>Back to Main screen</button>
```

## Components

- **Source file dropdowns**: Dropdown selector for each source file to select which column will be used as an axis
- **Unlink button**: Allows users to unlink a dimension from a column in a specific source file
- **Associated columns display**: Shows all columns currently associated with each dimension across source files
- **Back button**: Returns to the Main screen

## Actions

```gherkin
Given there are source files loaded
When I navigate to the Axe screen
Then I see a dropdown for each source file with all its columns as options

Given I am on the Axe screen
When I select a column from a source file dropdown
Then that column is associated with the selected dimension

Given there are multiple source files with columns of the same name
When I select that column name in multiple source files
Then all those columns are automatically associated with the same dimension

Given a column is associated with a dimension in a source file
When I click the Unlink button for that source file
Then that column is no longer associated with the dimension

Given I am on the Axe screen
When I click on "Back to Main screen"
Then I return to the Main screen
```
