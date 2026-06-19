/**
 * StorageService
 * 
 * Service for IndexedDB operations to save/load pivot table projects.
 * Uses the browser's IndexedDB API for client-side persistence.
 */

import type { PivotProject } from '../models/pivot-project/types';

const DB_NAME = 'PivotTableExplorer';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

export interface StoredProject {
  id: string;
  name: string;
  savedAt: string;
  pivotProject: PivotProject;
}

export class StorageService {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize or open the IndexedDB database
   */
  private static async getDB(): Promise<IDBDatabase> {
    if (!StorageService.dbPromise) {
      StorageService.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
      });
    }
    return StorageService.dbPromise;
  }

  /**
   * Save a project to IndexedDB
   */
  static async saveProject(name: string, project: PivotProject): Promise<void> {
    const db = await StorageService.getDB();
    
    const storedProject: StoredProject = {
      id: name,
      name,
      savedAt: new Date().toISOString(),
      pivotProject: project,
    };

    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(storedProject);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Load a project from IndexedDB by name
   */
  static async loadProject(name: string): Promise<StoredProject | null> {
    const db = await StorageService.getDB();
    
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(name);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * List all saved projects
   */
  static async listProjects(): Promise<StoredProject[]> {
    const db = await StorageService.getDB();
    
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete a project from IndexedDB
   */
  static async deleteProject(name: string): Promise<void> {
    const db = await StorageService.getDB();
    
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(name);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Export project to a downloadable JSON file
   */
  static async exportProjectToFile(project: PivotProject, filename: string): Promise<void> {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import project from a JSON file
   */
  static async importProjectFromFile(file: File): Promise<PivotProject> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const project: PivotProject = JSON.parse(content);
          resolve(project);
        } catch (error) {
          reject(new Error('Invalid project file: ' + (error as Error).message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Check if IndexedDB is available in the browser
   */
  static isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }
}
