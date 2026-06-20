/**
 * ActionBar component
 * Barre d'actions pour ViewGridScreen (Back, Apply)
 */

interface ActionBarProps {
  onBack: () => void;
}

export function ActionBar({ onBack }: ActionBarProps) {
  return (
    <div className="view-actions">
      <button className="btn-secondary" onClick={onBack}>
        Back to Main screen
      </button>      
    </div>
  );
}
