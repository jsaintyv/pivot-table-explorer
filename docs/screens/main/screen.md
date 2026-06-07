# Main Screen

The Main screen is the primary interface for managing data sources, dimensions, and views in the Pivot Table Explorer application. It serves as the entry point and central hub for the application.

## Design

In pseudo HTML:
```
<main>
  <h1>Pivot Table Explorer</h1>
  
  <section class="source-files">
    <h2>Source Files</h2>
    <forEach sourceFile in sourceFiles>
      <div class="source-file-item">
        <span>{sourceFile.name} ({sourceFile.columns.length} columns)</span>
        <button>Delete</button>
      </div>
    </forEach>
    <button>Import a new CSV</button>
  </section>

  <section class="dimensions">
    <h2>Dimensions</h2>
    <forEach dimension in dimensions>
      <div class="dimension-item">
        <span>{dimension.name}</span>
        <span>from {dimension.sourceFile.name}</span>
        <button>Edit</button>
        <button>Delete</button>
      </div>
    </forEach>
    <button>Add new dimension</button>
  </section>

  <section class="views">
    <h2>Views</h2>
    <forEach view in views>
      <div class="view-item">
        <span>{view.name}</span>
        <button>Show</button>
        <button>Delete</button>
      </div>
    </forEach>
    <input type="text" placeholder="View name">
    <button>Add new view</button>
  </section>

  <section class="navigation">
    <button>Configure Axes</button>
    <button>Configure View Grid</button>
  </section>
</main>
```

## Components

- **Header**: Displays the application title "Pivot Table Explorer"
- **Source Files Section**: Displays all imported CSV files with their column counts and delete buttons
- **Import Button**: Opens a file picker dialog to import new CSV files
- **Dimensions Section**: Displays all configured dimensions with their source file origin, edit button, and delete button
- **Add Dimension Button**: Opens the dimension configuration interface
- **Views Section**: Displays all saved views with Show and Delete buttons
- **View Creation Form**: Input field and button to create new views
- **Navigation Buttons**: Buttons to navigate to the Axe Screen and View Grid Screen

## Actions

```gherkin
# Source File Management
Given there are no source files
When I click on "Import a new CSV"
And I select a valid CSV file
Then a new source file entry is added to sourceFiles

Given there are source files
When I click Delete on a source file
Then that source file is removed from sourceFiles

# Dimension Management
Given there are no dimensions
When I click on "Add new dimension"
Then the dimension configuration interface opens

Given there are dimensions
When I click Delete on a dimension
Then that dimension is removed from dimensions

Given there are dimensions
When I click Edit on a dimension
Then the dimension edit interface opens

# View Management
Given there are no views
When I enter a view name and click "Add new view"
Then a new view is created with the specified name

Given there are views
When I click Show on a view
Then that view is loaded and displayed

Given there are views
When I click Delete on a view
Then that view is removed from views

# Navigation
Given I am on the Main screen
When I click "Configure Axes"
Then I navigate to the Axe screen

Given I am on the Main screen
When I click "Configure View Grid"
Then I navigate to the View Grid screen
```

## Notes

- The Main screen is the landing page and central hub of the application
- All data source management happens on this screen
- Users can navigate to specialized configuration screens from here
- The screen displays a summary of all loaded data sources, configured dimensions, and saved views 