# View Grid Screen

The View Grid screen allows users to configure and visualize pivot table data by defining row dimensions, column dimensions, value fields, and applying filters. The screen features a main grid area occupying **80% of the space** for data visualization, with a **20% sidebar** for configuration options.

## Related use cases

[multi dimension in cols & in rows](../../useCases/viewWithMultiDimensionsInColsInRows/useCase.md)

## Design
> **👉 [View Interactive Design Mockup](./design.html)** - Open this file in a browser to see the visual layout.

## Components

### Layout Structure
- **View Header**: Contains row dimensions, column dimensions, and value fields selectors with (+) buttons to add new dimensions/measures
- **Screen Layout**: Flex container with sidebar (20%) and grid area (80%)

### Header Components
- **Row Dimensions Selector**: Add row dimensions via (+) button, displays selected dimensions as badges with remove option
- **Column Dimensions Selector**: Add column dimensions via (+) button, displays selected dimensions as badges with remove option
- **Value Fields Selector**: Add measures via (+) button, displays selected measures with their aggregation type (sum, average, etc.) and remove option
- **View Name Input**: Editable text field to rename the current view

### Sidebar Components (20%)
- **Filters Section**: Contains filter controls for each dimension
- **Filter Groups**: For each dimension, shows a multi-select dropdown to include/exclude specific values
- **Clear Filter Button**: Removes all filters for a specific dimension

### Main Content (80%)
- **PivotGridTable**: Displays the cross-tabulated pivot table with:
  - Row headers showing row dimension values
  - Column headers showing column dimension values
  - Data cells showing aggregated values
  - Row totals (optional)
  - Column totals (optional)
  - Grand total (optional)

### Modal Dialogs
- **Add Dimension Modal**: Opens when clicking (+) buttons, allows selecting available dimensions to add as row, column, or value
- **Aggregation Modal**: Opens when clicking on a measure badge, allows selecting aggregation function (sum, average, count, min, max, first, last)

### Action Bar
- **Back Button**: Returns to Main screen
- **Apply Button**: Triggers pivot table generation with current configuration

## Layout Constraints

| Element | Width | Behavior |
|---------|-------|----------|
| Sidebar | 20% | Fixed width, scrollable if content overflows |
| Grid Area | 80% | Flexible width, minimum height for data display |
| Full Layout | 100% | Responsive: on small screens, sidebar moves to top |

## Responsive Behavior

On screens smaller than 1024px:
- Sidebar moves from left to top
- Sidebar width becomes 100%
- Grid area remains 100% width
- Minimum height of 500px for grid area

## Actions

```gherkin
# Navigation
Given I am on the View Grid screen
When I click on "Back to Main screen"
Then I return to the Main screen

# Dimension Management
Given I am on the View Grid screen
When I click the (+) button next to Row dimensions
Then a modal opens showing all available dimensions
When I select a dimension from the modal
Then that dimension is added as a row dimension
And the pivot grid updates automatically

Given I am on the View Grid screen
When I click the (+) button next to Column dimensions
Then a modal opens showing all available dimensions
When I select a dimension from the modal
Then that dimension is added as a column dimension
And the pivot grid updates automatically

Given I am on the View Grid screen
When I click the (+) button next to Value fields
Then a modal opens showing all available dimensions
When I select a dimension from the modal
Then that dimension is added as a measure with default aggregation (sum)
And the pivot grid updates automatically

Given I am on the View Grid screen
When I click the remove button (×) on a row dimension badge
Then that dimension is removed from row dimensions
And the pivot grid updates automatically

Given I am on the View Grid screen
When I click the remove button (×) on a column dimension badge
Then that dimension is removed from column dimensions
And the pivot grid updates automatically

Given I am on the View Grid screen
When I click the remove button (×) on a measure badge
Then that measure is removed from value fields
And the pivot grid updates automatically

# Aggregation Configuration
Given I am on the View Grid screen
When I click on a measure badge in the Value fields section
Then an aggregation modal opens
When I select a different aggregation function (e.g., average, count, min, max)
Then the measure's aggregation is updated
And the pivot grid recalculates with the new aggregation

# Filter Configuration
Given I am on the View Grid screen
When I select specific values in a dimension's filter dropdown
Then only rows/columns matching those selected values are displayed
And the pivot grid updates to show only filtered data

Given I am on the View Grid screen
When I click the trash can button (🗑) next to a dimension filter
Then all filters for that dimension are cleared
And the pivot grid shows all values for that dimension

# View Management
Given I am on the View Grid screen
When I change the text in the View Name input
Then the current view is renamed

# Pivot Table Generation
Given I am on the View Grid screen
When I click on "Apply Configuration"
Then the pivot table is generated with the current row, column, filter, and aggregation configurations

# Empty State
Given I am on the View Grid screen
When there are no views available
Then I see a message "No view available. Create a view from the main screen."
And a button to return to the Main screen
```
