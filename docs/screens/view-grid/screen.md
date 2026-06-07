# View Grid Screen

The View Grid screen allows users to configure the pivot table structure by defining row dimensions, column dimensions, filters, and value fields to display.

## Design

In pseudo HTML:
```
<h2>Configure Pivot View</h2>
<h3>Name: <inputText>[View name]</inputText></h3>
  


<h3>Dimensions</h3>
<div class="dimension-config">
  <div class="available-dimensions">
    <h4>Available Dimensions</h4>
    <forEach dimension in dimensions>
      <div class="dimension-item" draggable="true">{dimension.name}</div>
    </forEach>
  </div>
  
  <div class="drop-zones">
    <div class="drop-zone" id="rows">
      <h4>Row Dimensions</h4>
      <div class="drop-area">Drop dimensions here for rows</div>
      <forEach rowDim in rowDimensions>
        <div class="dimension-badge">{rowDim.name} <button>Remove</button></div>
      </forEach>
    </div>
    
    <div class="drop-zone" id="columns">
      <h4>Column Dimensions</h4>
      <div class="drop-area">Drop dimensions here for columns</div>
      <forEach colDim in columnDimensions>
        <div class="dimension-badge">{colDim.name} <button>Remove</button></div>
      </forEach>
    </div>
    
    <div class="drop-zone" id="values">
      <h4>Value Fields</h4>
      <div class="drop-area">Drop value fields here</div>
      <forEach valueField in valueFields>
        <div class="dimension-badge">{valueField.name} <button>Remove</button></div>
      </forEach>
    </div>
  </div>
</div>

<h3>Filters</h3>
<div class="filters-config">
  <forEach dimension in allDimensions>
    <div class="filter-group">
      <h4>{dimension.name}</h4>
      <select multiple>
        <forEach value in dimension.values>
          <option value="{value}" selected>{value}</option>
        </forEach>
      </select>
    </div>
  </forEach>
</div>

<h3>Value Configuration</h3>
<div class="value-config">
  <forEach valueField in valueFields>
    <div class="value-field">
      <span>{valueField.name}</span>
      <select>
        <option>sum</option>
        <option>avg</option>
        <option>count</option>
        <option>min</option>
        <option>max</option>
      </select>
    </div>
  </forEach>
</div>

<pivotGrid></pivotGrid>

<button>Back to Main screen</button>
<button>Apply Configuration</button>
```

## Components

- **Available Dimensions Panel**: Lists all available dimensions that can be dragged to drop zones
- **Row Dimensions Drop Zone**: Target area for dropping dimensions to be used as row axes
- **Column Dimensions Drop Zone**: Target area for dropping dimensions to be used as column axes
- **Value Fields Drop Zone**: Target area for dropping fields that contain values to be aggregated
- **Filter Configuration**: Multi-select controls for each dimension to filter which values to include
- **Value Configuration**: For each value field, select the aggregation function (sum, avg, count, min, max)
- **pivot grid**: The pivot grid 
- **Back Button**: Returns to the Main screen
- **Apply Button**: Applies the current configuration and generates the pivot table

## Actions

```gherkin
Given I am on the View Grid screen
When I drag a dimension from Available Dimensions to Row Dimensions drop zone
Then that dimension is added to row dimensions and update the pivot grid

Given I am on the View Grid screen
When I drag a dimension from Available Dimensions to Column Dimensions drop zone
Then that dimension is added to column dimensions and update the pivot grid

Given I am on the View Grid screen
When I drag a value field from Available Dimensions to Value Fields drop zone
Then that field is added to value fields and update the pivot grid

Given I am on the View Grid screen
When I drag a dimension from Row Dimensions back to Available Dimensions
Then that dimension is removed from row dimensions and update the pivot grid

Given I am on the View Grid screen
When I select specific values in a dimension's multi-select filter
Then only those selected values will be included for that dimension  and update the pivot grid

Given I am on the View Grid screen
When I select an aggregation function for a value field
Then that aggregation function is applied to the value field and update the pivot grid

Given I am on the View Grid screen
When I click on "Apply Configuration"
Then the pivot table is generated with the current row, column, filter, and value configurations and update the pivot grid

Given I am on the View Grid screen
When I click on "Back to Main screen"
Then I return to the Main screen
```
