/**
 * ProjectHeader component
 * 
 * Header bar for project management (name, save, load, import, export)
 * Follows MVC pattern: Uses store from React context, is a MobX observer
 * Max lines: < 200
 */

import { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../../stores/contexts/StoreContext';
import type { StoredProject } from '../../../../services/StorageService';
import './ProjectHeader.css';

interface SaveProjectModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
}

function SaveProjectModal({ onClose, onSave }: SaveProjectModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    }
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Save Project As</h3>
          <button className="close-modal" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="project-name">Project Name:</label>
            <input
              type="text"
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-apply-modal" disabled={!name.trim()}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LoadProjectModalProps {
  onClose: () => void;
  onLoad: (name: string) => void;
  projects: StoredProject[];
}

function LoadProjectModal({ onClose, onLoad, projects }: LoadProjectModalProps) {
  const [selectedProject, setSelectedProject] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProject) {
      onLoad(selectedProject);
      onClose();
    }
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Load Project</h3>
          <button className="close-modal" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="load-project">Select Project:</label>
            <select
              id="load-project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              required
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} (Saved: {new Date(project.savedAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-apply-modal" disabled={!selectedProject}>
              Load
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ImportProjectModalProps {
  onClose: () => void;
  onImport: (file: File) => void;
}

function ImportProjectModal({ onClose, onImport }: ImportProjectModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      onClose();
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Import Project</h3>
          <button className="close-modal" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="form-group">
          <p>Select a JSON project file to import:</p>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button type="button" className="btn-apply-modal" onClick={handleButtonClick}>
            Select File
          </button>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main ProjectHeader component
 */
export const ProjectHeader = observer(() => {
  const store = useStore();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [savedProjects, setSavedProjects] = useState<StoredProject[]>([]);

  // Load saved projects list when load modal opens
  const handleOpenLoadModal = async () => {
    const projects = await store.listSavedProjects();
    setSavedProjects(projects);
    setShowLoadModal(true);
  };

  const handleSave = async (name: string) => {
    await store.saveProjectAs(name);
  };

  const handleLoad = async (name: string) => {
    await store.loadSavedProject(name);
  };

  const handleImport = async (file: File) => {
    await store.importProject(file);
  };

  return (
    <header className="project-header">
      <div className="project-name-section">
        <input
          type="text"
          value={store.projectName}
          onChange={(e) => store.setProjectName(e.target.value)}
          placeholder="Enter project name or import a CSV to auto-generate"
          className="project-name-input"
        />
      </div>
      
      <div className="project-actions">
        <button 
          onClick={() => store.createProject()} 
          className="action-button"
          title="Create new project"
        >
          New Project
        </button>
        
        <button 
          onClick={() => setShowSaveModal(true)} 
          className="action-button"
          title="Save project to IndexedDB"
        >
          Save As
        </button>
        
        <button 
          onClick={handleOpenLoadModal} 
          className="action-button"
          title="Load project from IndexedDB"
        >
          Load
        </button>
        
        <button 
          onClick={() => setShowImportModal(true)} 
          className="action-button"
          title="Import project from JSON file"
        >
          Import
        </button>
        
        <button 
          onClick={() => store.exportProject()} 
          className="action-button"
          title="Export project to JSON file"
        >
          Export
        </button>
      </div>

      {/* Save Project Modal */}
      {showSaveModal && (
        <SaveProjectModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Load Project Modal */}
      {showLoadModal && (
        <LoadProjectModal
          onClose={() => setShowLoadModal(false)}
          onLoad={handleLoad}
          projects={savedProjects}
        />
      )}

      {/* Import Project Modal */}
      {showImportModal && (
        <ImportProjectModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
    </header>
  );
});
