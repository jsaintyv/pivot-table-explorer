import { createContext, useContext } from "react";
import { Store } from "../Store";

export const StoreContext = createContext<Store | null>(null);

export const useStore = (): Store => {
    const store = useContext(StoreContext);
    if (!store) {
        throw new Error("useStore must be used within a StoreContext.Provider");
    }
    return store;
};
