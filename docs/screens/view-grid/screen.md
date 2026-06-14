# View Grid Screen

The View Grid screen allows users to configure and visualize the pivot table structure by defining row dimensions, column dimensions, filters, and value fields. The pivot grid occupies **80% of the screen space** for optimal data visualization, with a **20% sidebar** for configuration.

> **👉 [View Interactive Design Mockup](./design.html)** - Open this file in a browser to see the visual layout.

## Components

### Layout Structure
- **View Header**: Contains row and column dimension selectors with (+) buttons to add dimensions
- **Screen Layout**: Flex container with sidebar (20%) and grid area (80%)

### Sidebar Components (20%)
- **Available Dimensions**: List of all available dimensions that can be selected
- **Selected Dimensions**: Clickable badges showing currently selected row and column dimensions (click to configure aggregation)
- **Filters Configuration**: Multi-select controls for each dimension to filter included values

### Main Content (80%)
- **PivotGrid**: The main data visualization component displaying the cross-tabulated data

### Action Bar
- **Back Button**: Returns to Main screen
- **Apply Button**: Applies the current configuration

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
Given I am on the View Grid screen
When I click the (+) button next to Row dimensions
Then a modal opens allowing me to select dimensions to add as row dimensions

Given I am on the View Grid screen
When I click the (+) button next to Column dimensions
Then a modal opens allowing me to select dimensions to add as column dimensions

Given I am on the View Grid screen
When I click on a selected dimension badge in the sidebar
Then a modal opens allowing me to configure the aggregation function for that dimension

Given I am on the View Grid screen
When I select specific values in a dimension's multi-select filter
Then only those selected values are included for that dimension and the pivot grid updates

Given I am on the View Grid screen
When I change the aggregation function for a dimension by clicking its badge
Then that aggregation is applied to the dimension and the pivot grid updates

Given I am on the View Grid screen
When I enter a view name and click "Save View"
Then the current configuration is saved as a new view

Given I am on the View Grid screen
When I click on "Apply Configuration"
Then the pivot table is generated with the current row, column, filter, and aggregation configurations

Given I am on the View Grid screen
When I click on "Back to Main screen"
Then I return to the Main screen
```

## CSS Classes Reference

| Class | Purpose |
|-------|---------|
| `.view-grid-screen` | Main container |
| `.view-header` | Header with row/column dimension selectors |
| `.dimension-config-line` | Configuration line for row or column dimensions |
| `.config-label` | Label for dimension configuration |
| `.add-dimension-btn` | Button to add dimensions |
| `.selected-badge` | Badge showing selected dimension in header |
| `.screen-layout` | Flex container for sidebar + grid |
| `.config-sidebar` | Left sidebar (20%) with all configuration |
| `.config-section` | Section within sidebar |
| `.grid-main` | Main grid container (80%) |
| `.dimension-item` | Dimension from available list |
| `.dimension-badge-full` | Clickable dimension badge in sidebar |
| `.dimension-name` | Name of the dimension in badge |
| `.agg-indicator` | Aggregation indicator on dimension badge |
| `.filter-group` | Filter controls for a single dimension |
| `.filter-select` | Multi-select filter dropdown |
| `.view-actions` | Container for action buttons |
