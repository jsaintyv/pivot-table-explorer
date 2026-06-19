# Main Screen

The Main screen is the primary interface for managing pivot table projects in the Pivot Table Explorer application. It serves as the entry point and central hub where users can create, load, save, and manage their pivot table configurations.

## Design

> **👉 [View Interactive Design Mockup](./design.html)** - Open this file in a browser to see the visual layout.

## Initial State

When the page is opened, the application starts with:
- Empty project name
- No data sources loaded
- No dimensions configured
- No views created
- "New Project" button creates a fresh empty project

## Components

### Project Header Bar (NEW)
- **Project Name Input**: Editable text field for the project name
  - Placeholder: "Enter project name or import a CSV to auto-generate"
  - Auto-populated when first CSV is imported if project name is empty (uses CSV filename)
- **New Project Button**: Creates a new empty project, clearing all current data
- **Export Button**: Exports the current project as a JSON file
- **Import Button**: Imports a project from a JSON file (file picker dialog)
- **Save As Button**: Saves the current project to IndexedDB with a user-provided name
- **Load Button**: Opens a dialog to select and load a project from IndexedDB

### Data Sources Section
- **File List**: Displays all imported CSV files with their column counts
- **Delete Button**: Removes a data source and all its associated dimensions/nodes
- **Import CSV Button**: Opens a file picker dialog to import new CSV files
  - On import: If project name is empty, automatically sets project name to the CSV filename (without extension)

### Dimensions Section
- **Dimension List**: Displays all configured dimensions with their data type and source file
- **Source Hint**: Shows which data source each dimension originates from
- **Edit Button**: Navigates to the Axe Screen to edit the dimension
- **Delete Button**: Removes the dimension and all its associated nodes
- **Create Dimension Button**: Navigates to the Axe Screen to create a new dimension

### Views Section
- **View List**: Displays all saved views with Show and Delete buttons
- **Show Button**: Loads the view configuration and navigates to the View Grid Screen
- **Delete Button**: Removes the view
- **View Creation Form**: Input field and button to create a new view from the current configuration

### Navigation Section
- **Configure View Grid Button**: Navigates to the View Grid Screen

## Actions

```gherkin
# Project Management (NEW)
Given I am on the Main screen
When I click "New Project"
Then a new empty project is created
And the project name is cleared
And all data sources, dimensions, and views are removed

Given I am on the Main screen
And I have entered a project name
When I click "Save As"
Then a dialog prompts me for a project name
When I enter a name and confirm
Then the current project is saved to IndexedDB with that name

Given I am on the Main screen
When I click "Load"
Then a dialog shows all projects saved in IndexedDB
When I select a project and click Load
Then that project is loaded and replaces the current project

Given I am on the Main screen
When I click "Export"
Then the current project is downloaded as a JSON file

Given I am on the Main screen
When I click "Import"
And I select a valid JSON project file
Then that project is loaded and replaces the current project

# Project Name Auto-Generation
Given I am on the Main screen
And the project name is empty
When I import a CSV file named "sales_data.csv"
Then the project name is automatically set to "sales_data"

# Source File Management
Given there are no data sources
When I click on "Import CSV"
And I select a valid CSV file
Then a new data source entry is added to dataSources
And dimensions are auto-created for each column in the CSV

Given there are data sources
When I click Delete on a data source
Then that data source is removed from dataSources
And all dimensions using that data source have their column mappings removed
And all nodes exclusively from that source are removed

# Dimension Management
Given there are no dimensions
When I click on "Create Dimension"
Then I navigate to the Axe Screen to create a new dimension

Given there are dimensions
When I click Delete on a dimension
Then that dimension is removed from dimensions
And all nodes belonging to that dimension are removed
And all view references to that dimension are removed

Given there are dimensions
When I click Edit on a dimension
Then I navigate to the Axe Screen with that dimension pre-loaded for editing

# View Management
Given there are no views
When I enter a view name and click "Add View"
Then a new view is created with the specified name

Given there are views
When I click Show on a view
Then that view is loaded as the active view
And I navigate to the View Grid Screen

Given there are views
When I click Delete on a view
Then that view is removed from views

# Navigation
Given I am on the Main screen
When I click "Create Dimension"
Then I navigate to the Axe screen

Given I am on the Main screen
When I click "Configure View Grid"
Then I navigate to the View Grid screen
```

## Data Flow

### IndexedDB Storage
- Projects are stored as JSON in IndexedDB
- Multiple projects can be saved with unique names
- Projects include: name, data sources, dimensions, views, nodes, and all configuration
- The `saveAs` operation allows the user to provide a name for the project in IndexedDB
- The `load` operation presents a list of saved projects for the user to select from

### File Export/Import
- Export: Current project serialized to JSON and downloaded as a file
- Import: JSON file parsed and loaded as the current project
- File format: Standard JSON with project structure

### Project Name Auto-Generation
- Trigger: When project name is empty AND a CSV is imported
- Action: Set project name to the CSV filename without extension
- Example: "data/sales_2024.csv" → "sales_2024"

## Notes

- The Main screen is the landing page and central hub of the application
- All project management (create, load, save, export, import) happens in the header bar
- All data source management happens in the Data Sources section
- Users can navigate to specialized configuration screens (Axe, View Grid) from this screen
- The screen displays a comprehensive overview of the current project: data sources, dimensions, and views
- Empty states are shown when sections have no content to guide the user