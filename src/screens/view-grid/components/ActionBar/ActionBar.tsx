/**
 * ActionBar component
 * Barre d'actions pour ViewGridScreen (Back, Apply)
 */

interface ActionBarProps {
  onBack: () => void;
  onApply: () => void;
}

export function ActionBar({ onBack, onApply }: ActionBarProps) {
  return (
    <div className="view-actions">
      <button className="btn-secondary" onClick={onBack}>
        Back to Main screen
      </button>
      <button className="btn-primary" onClick={onApply}>
        Apply Configuration
      </button>
    </div>
  );
}
