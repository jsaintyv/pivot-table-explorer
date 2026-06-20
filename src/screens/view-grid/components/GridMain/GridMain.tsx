import type { View } from '../../../../models/pivot-project/types';
import type { PivotData } from '../../../../stores';
import { PivotGridTable } from './PivotGridTable';
import './GridMain.css';
import { observer } from 'mobx-react-lite';
import { useViewStore } from '../../../../stores/contexts/ViewStoreContext';

/**
 * GridMain component
 * Zone principale affichant le tableau pivot (80% de l'espace)
 */

interface GridMainProps {  
}

export const GridMain =  observer(({ }: GridMainProps) =>{
  const viewStore = useViewStore();
  const pivotData = viewStore.pivotData;
  if(! pivotData) {
    return (<div>---</div>);
  }
  return (
    <main className="grid-main">
      <div className="pivot-grid-container">
        <PivotGridTable
          pivotData={pivotData}                    
          showTotals={true}
          showGrandTotal={true}
        />
      </div>
    </main>
  );
});
