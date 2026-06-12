/**
 * PivotGridSummary Component
 * 
 * Displays a summary of the current pivot table configuration.
 * Part of the MVC View layer.
 */

import { observer } from 'mobx-react-lite';
import { useStore } from '../../stores/contexts/StoreContext';
import type { PivotData } from '../../models/types';

interface PivotGridSummaryProps {
  pivotData: PivotData;
}

export const PivotGridSummary: React.FC<PivotGridSummaryProps> = observer(({ pivotData }) => {
  const store = useStore();
  const {
    rowFields,
    columnFields,
    valueFields,
    aggregation
  } = store;

  return (
    <div className="pivot-summary">
      <p>
        <strong>Configuration:</strong> 
        {rowFields.length > 0 && `Rows: ${rowFields.join(', ')} | `}
        {columnFields.length > 0 && `Columns: ${columnFields.join(', ')} | `}
        {valueFields.length > 0 && `Values: ${valueFields.join(', ')} | `}
        Aggregation: {aggregation.toUpperCase()}
      </p>
      <p>
        <strong>Total Rows:</strong> {pivotData.rows.length} | 
        <strong>Total Columns:</strong> {pivotData.columns.length}
      </p>
    </div>
  );
});

export default PivotGridSummary;
