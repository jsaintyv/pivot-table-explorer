import type { View } from '../../../../models/pivot-project/types';
import type { PivotData } from '../../../../stores';
import { PivotGridTable } from './PivotGridTable';
import './GridMain.css';
import { observer } from 'mobx-react-lite';

/**
 * GridMain component
 * Zone principale affichant le tableau pivot (80% de l'espace)
 */

interface GridMainProps {
  view: View;
  pivotData: PivotData;
}

export const GridMain =  observer(({ view, pivotData }: GridMainProps) =>{
  return (
    <main className="grid-main">
      <div className="pivot-grid-container">
        <PivotGridTable
          rows={pivotData.rows}
          columns={pivotData.columns}
          data={pivotData.data}
          showTotals={view.showTotals}
          showGrandTotal={view.showGrandTotal}
        />
      </div>
    </main>
  );
});
