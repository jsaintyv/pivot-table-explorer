# Dimensions Screen

The dimensions screen allows users to **create and edit dimensions** by associating columns from source CSV files as axes for pivoting data. Dimensions can be configured with hierarchical structures using either **Parent Mode** (parent code references) or **Generation Mode** (fixed generation levels).

## Related use cases

[configureHierarchicalDimension](../../useCases/configureHierarchicalDimension/useCase.md)

## Design

[design.html](design.html)

## Modes

The dimension editor supports two distinct modes for defining hierarchical relationships:

### Parent Mode
- Uses a **Parent Code** column to reference parent nodes
- Hierarchy is built by following parent-child relationships
- Suitable for data where parentage is explicitly defined
- Mapping types available: `Parent Code`, `Label`, `Property`

### Generation Mode
- Each column represents a **fixed generation level**
- Hierarchy depth is determined by column mapping
- Suitable for data with explicit level columns (e.g., Year → Quarter → Month)
- Mapping types available: `Racine`, `Génération 1`, `Génération 2`, `Génération 3`, `Label`, `Property`

## Components

### Dimension Identity Section
- **Dimension Name** (required): Unique name for the dimension
- **Description** (optional): Human-readable description
- **Data Type** (required): Type of values in this dimension (`string`, `number`, `date`, `boolean`)
- **Hierarchy Mode** (required): Selection between `Parent Mode` or `Generation Mode`
- **Dimension ID** (read-only): Auto-generated unique identifier

### Data Sources Section
- **Available Data Sources**: List of uploaded CSV files as selectable badges
- Shows all files that can provide columns for mapping

### Column Mappings Section
- **Data Source selector**: Dropdown to select which CSV file provides the column
- **Column selector**: Dropdown to select which column from the chosen data source
- **Mapping Type selector**: Type of mapping for the column (options depend on Hierarchy Mode)
  - Parent Mode: `Parent Code`, `Label`, `Property`
  - Generation Mode: `Racine`, `Génération 1`, `Génération 2`, `Génération 3`, `Label`, `Property`
- **Unlink button** (×): Remove this specific column mapping
- **Add Column Mapping button**: Add a new empty mapping row

### Properties Mapping Section
- **Data Source selector**: Dropdown to select the source file
- **Column selector**: Dropdown to select the column containing property data
- **Property Name input**: Text field to name the property (e.g., `color`, `description`, `isActive`)
- **Remove button** (×): Remove this property mapping
- **Add Property Mapping button**: Add a new empty property mapping row

### Hierarchy Preview Section
- Visual representation of the current hierarchy structure
- Shows how nodes are organized based on current mappings
- Displays the mode currently in use

### Action Buttons
- **Back to Main screen**: Return to the main screen without saving
- **Save Dimension**: Persist the dimension with all current configurations

## Actions

### Navigation
```gherkin
Given I am on the Main screen
When I click "Create Dimension"
Then I navigate to Dimension Editor screen with a new empty dimension

Given I am on the Dimension Editor screen
When I click "Back to Main screen"
Then I return to the Main screen
```

### Dimension Identity
```gherkin
Given I am on the Dimension Editor screen with a new dimension
When I enter a dimension name
And I select a datatype
And I select a hierarchy mode
Then the dimension identity is valid

Given I am on the Dimension Editor screen with an existing dimension
When I change the dimension name
Then the new name is reflected in the form

Given I am on the Dimension Editor screen
When I change the hierarchy mode from Parent to Generation
Then the Mapping Type selectors update to show Generation Mode options

Given I am on the Dimension Editor screen
When I change the hierarchy mode from Generation to Parent
Then the Mapping Type selectors update to show Parent Mode options
```

### Column Mappings
```gherkin
Given I am on the Dimension Editor screen
When I select a data source
And I select a column from that source
And I select a mapping type
Then that column is mapped to the dimension with the specified type

Given I am on the Dimension Editor screen in Parent Mode
When I select "Parent Code" as mapping type for a column
Then that column is used to identify parent-child relationships

Given I am on the Dimension Editor screen in Generation Mode
When I select "Racine" as mapping type for a column
Then that column defines the root level of the hierarchy

Given I am on the Dimension Editor screen in Generation Mode
When I select "Génération 1" as mapping type for a column
Then that column defines the first child level of the hierarchy

Given a dimension has a column mapped from a source file
When I click Unlink for that source file
Then the mapping is removed from the dimension

Given there are multiple source files with columns of the same name
When I select that column name for the dimension in multiple source files
Then all those columns are mapped to the same dimension
```

### Properties Mapping
```gherkin
Given I am on the Dimension Editor screen
When I add a property mapping
And I select a data source
And I select a column
And I enter a property name
Then that column is associated with the property for this dimension

Given a dimension has a property mapping
When I click the remove button for that property
Then the property mapping is removed
```

### Saving
```gherkin
Given I am on the Dimension Editor screen
When I click "Save Dimension"
Then the dimension is persisted in the Store with all current configurations:
  - Dimension identity (name, description, data type, hierarchy mode)
  - All column mappings with their mapping types
  - All property mappings

Given I am on the Dimension Editor screen with invalid data
When I click "Save Dimension"
Then validation errors are displayed
And the dimension is not saved
```

### Hierarchy Preview
```gherkin
Given I am on the Dimension Editor screen
When I configure column mappings
Then the Hierarchy Preview updates to reflect the current structure

Given I am on the Dimension Editor screen in Generation Mode
When I map ParentCode to "Racine"
And ProductCode to "Génération 1"
Then the preview shows MEM and GRAPH as Racine nodes with their children
```
