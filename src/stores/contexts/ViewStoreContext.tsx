/**
 * ViewStoreContext - Contexte React pour ViewStore
 * 
 * Fournit l'accès au ViewStore aux composants React via le hook useViewStore().
 * Ce contexte permet aux composants d'accéder au store dédié à la gestion de la vue courante.
 */

import { createContext, useContext } from "react";
import { ViewStore } from "../ViewStore";

// Créer le contexte avec une valeur par défaut null
export const ViewStoreContext = createContext<ViewStore | null>(null);

// Provider component pour envelopper l'application
export const ViewStoreProvider = ViewStoreContext.Provider;

/**
 * Hook personnalisé pour accéder au ViewStore
 * 
 * @returns L'instance de ViewStore
 * @throws Error si utilisé en dehors d'un ViewStoreProvider
 */
export function useViewStore(): ViewStore {
    const store = useContext(ViewStoreContext);
    if (!store) {
        throw new Error("useViewStore must be used within a ViewStoreProvider");
    }
    return store;
}

/**
 * Hook optionnel pour accéder au ViewStore (retourne null si non disponible)
 * Utile pour les composants qui peuvent fonctionner sans ViewStore
 * 
 * @returns L'instance de ViewStore ou null
 */
export function useViewStoreOptional(): ViewStore | null {
    return useContext(ViewStoreContext);
}
