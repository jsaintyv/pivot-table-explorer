# Main screen

The Main screen is the primary interface for managing data sources and dimensions in the Pivot Table Explorer application.

## Design

In pseudo HTML:
```
<forEach src in sourceFiles>
  {src} <button>Delete</button>
</forEach>
<button>Import a new CSV</button>

<forEach dim in dimensions>
  {dim} <button>Edit</button> <button>Delete</button>
</forEach>
<button>Add new dimension</button>

<forEach view in views>
  {view} <button>Show</button> <button>Delete</button>
</forEach>
<button>Add new view</button>
```

## Components

- **Source file list**: Displays all imported CSV files with delete buttons
- **Import button**: Opens file picker to import new CSV files
- **Dimension list**: Displays all configured dimensions with delete buttons
- **Add dimension button**: Opens interface to add new dimensions

## Actions

```gherkin
Given there is no source file and there is no dimension
When I click on "Import a new CSV"
Then a new entry is added to sourceFiles

Given there are source files
When I click Delete on a source file
Then that source file is removed from sourceFiles

Given there are dimensions
When I click Delete on a dimension
Then that dimension is removed from dimensions

Given the application is running
When I click on "Add new dimension"
Then the dimension configuration interface opens
``` 