/**
 * PivotGridConfiguration Component
 * 
 * Configuration panel for PivotGrid with field selectors and aggregation controls.
 * Part of the MVC View layer.
 */

import { observer } from 'mobx-react-lite';
import { store } from '../../store';
import { aggregationFunctions } from '../../utils/aggregations';
import type { AggregationFunction } from '../../models/types';

interface PivotGridConfigurationProps {
  allFields: string[];
}

export const PivotGridConfiguration: React.FC<PivotGridConfigurationProps> = observer(({ allFields }) => {
  const {
    rowFields,
    columnFields,
    valueFields,
    aggregation
  } = store;

  /**
   * Handle field selection changes
   */
  const handleRowFieldChange = (field: string, isChecked: boolean) => {
    if (isChecked) {
      store.setRowFields([...rowFields, field]);
    } else {
      store.setRowFields(rowFields.filter(f => f !== field));
    }
  };

  const handleColumnFieldChange = (field: string, isChecked: boolean) => {
    if (isChecked) {
      store.setColumnFields([...columnFields, field]);
    } else {
      store.setColumnFields(columnFields.filter(f => f !== field));
    }
  };

  const handleValueFieldChange = (field: string, isChecked: boolean) => {
    if (isChecked) {
      store.setValueFields([...valueFields, field]);
    } else {
      store.setValueFields(valueFields.filter(f => f !== field));
    }
  };

  const handleAggregationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    store.setAggregation(e.target.value as AggregationFunction);
  };

  const handleReset = () => {
    store.resetAll();
  };

  return (
    <div className="pivot-configuration">
      {/* Row Fields Section */}
      <div className="config-section">
        <h3>Row Fields (Y-Axis)</h3>
        <div className="field-checkboxes">
          {allFields.map(field => (
            <label key={`row-${field}`} className="field-checkbox">
              <input
                type="checkbox"
                checked={rowFields.includes(field)}
                onChange={(e) => handleRowFieldChange(field, e.target.checked)}
                disabled={columnFields.includes(field) || valueFields.includes(field)}
              />
              {field}
            </label>
          ))}
        </div>
      </div>

      {/* Column Fields Section */}
      <div className="config-section">
        <h3>Column Fields (X-Axis)</h3>
        <div className="field-checkboxes">
          {allFields.map(field => (
            <label key={`col-${field}`} className="field-checkbox">
              <input
                type="checkbox"
                checked={columnFields.includes(field)}
                onChange={(e) => handleColumnFieldChange(field, e.target.checked)}
                disabled={rowFields.includes(field) || valueFields.includes(field)}
              />
              {field}
            </label>
          ))}
        </div>
      </div>

      {/* Value Fields Section */}
      <div className="config-section">
        <h3>Value Fields</h3>
        <div className="field-checkboxes">
          {allFields.map(field => (
            <label key={`val-${field}`} className="field-checkbox">
              <input
                type="checkbox"
                checked={valueFields.includes(field)}
                onChange={(e) => handleValueFieldChange(field, e.target.checked)}
                disabled={rowFields.includes(field) || columnFields.includes(field)}
              />
              {field}
            </label>
          ))}
        </div>
      </div>

      {/* Aggregation Function Section */}
      <div className="config-section">
        <h3>Aggregation Function</h3>
        <select 
          value={aggregation} 
          onChange={handleAggregationChange}
          className="aggregation-select"
        >
          {Object.keys(aggregationFunctions).map(agg => (
            <option key={agg} value={agg}>
              {agg.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Reset Button */}
      <button onClick={handleReset} className="reset-button">
        Reset All
      </button>
    </div>
  );
});

export default PivotGridConfiguration;
