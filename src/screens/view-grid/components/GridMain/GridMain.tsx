import type { View } from '../../../../models/pivot-project/types';

/**
 * GridMain component
 * Zone principale affichant le tableau pivot (80% de l'espace)
 */

interface GridMainProps {
  view: View;
}

export function GridMain({ view }: GridMainProps) {
  return (
    <main className="grid-main">
      <div className="pivot-grid-container">
        <div className="pivot-grid-placeholder">
          <p>Pivot Grid Area</p>
          <p>Rows: {view.rowDimensions.length} | Columns: {view.columnDimensions.length} | Measures: {view.measures.length}</p>
        </div>
      </div>
    </main>
  );
}
