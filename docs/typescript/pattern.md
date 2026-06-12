# Typescript / React guidelines

### Code Style
- Use **Functional Components** with React Hooks
- Type all props and state with **TypeScript interfaces**
- Use **descriptive type names** for complex types
- **Component naming**: PascalCase (e.g., `PivotGrid`, `DataCell`)
- **File naming**: `ComponentName.tsx`, `ComponentName.css`
- **Variable naming**: camelCase for variables, UPPER_CASE for constants

## React + MobX Pattern
We use **MobX** with React following this layer structure: **View - Store - Service - Model**

- **Store**: Acts as the controller (MVC pattern). In MobX, stores are **Observable** singletons.
  They are located in `src/stores`
  - Aggregate models
  - Expose methods to perform actions on models
  - Expose methods to compute operations on models
  - Use services to fetch, send, build, and compute models
  - Help keep React components as simple as possible

- **View**: React components are **Observers** that react to store changes.
  They are located in `src/components` or `src/screens`
  - Consume stores via React Context

- **Model**: Simple data objects, located in `src/models`

- **Service**: Act as model factories, fetcher factories, and transformers.
  Controllers (stores) use services to transform and manipulate models.


## Context Propagation Pattern

Stores are instantiated as **singletons** at the screen level and propagated down the component tree via **React Context**:

```
Screen (instantiates singleton)
   ↓
Context.Provider (provides store)
   ↓
Component A (consumes via useContext)
   ↓
Component B (consumes via useContext)
```

## Code Examples

**Model** (`src/models/`):
```typescript
interface SampleData {
    filter: string;
    list: string[];
}
```

**Service** (`src/services/`):
```typescript
export class SampleService {
    constructor() { }
    
    buildEmpty(): SampleData {
        return {
            filter: "",
            list: ["A", "B", "C"]
        };
    }

    updateFilter(previous: SampleData, filter: string): SampleData {
        return { ...previous, filter: filter };
    }

    getFiltered(data: SampleData): string[] {
        return data.list.filter(s => s.indexOf(data.filter) >= 0);
    }
}
```

**Store** (`src/stores/SampleStore.ts`):
```typescript
import { makeObservable, observable, action } from "mobx";

export class SampleStore {
    data: SampleData;
    private static instance: SampleStore | null = null;
    
    private constructor(private sampleService: SampleService) {
        makeObservable(this, {
            data: observable.ref,
            updateFilter: action,
        });
        this.data = sampleService.buildEmpty();
    }

    // Singleton accessor
    public static getInstance(sampleService: SampleService): SampleStore {
        if (!SampleStore.instance) {
            SampleStore.instance = new SampleStore(sampleService);
        }
        return SampleStore.instance;
    }

    updateFilter(filter: string): void {
        this.data = this.sampleService.updateFilter(this.data, filter);
    }

    getFiltered(): string[] {
        return this.sampleService.getFiltered(this.data);
    }
}
```

**Context** (`src/stores/contexts/SampleStoreContext.tsx`):
```typescript
import { createContext, useContext } from "react";
import { SampleStore } from "../SampleStore";

export const SampleStoreContext = createContext<SampleStore | null>(null);

export const useSampleStore = (): SampleStore => {
    const store = useContext(SampleStoreContext);
    if (!store) {
        throw new Error("useSampleStore must be used within a SampleStoreProvider");
    }
    return store;
};
```

**Screen** (`src/screens/SampleScreen/SampleScreen.tsx`):
```jsx
import { SampleStore } from '../../stores/SampleStore';
import { SampleService } from '../../services/SampleService';
import { SampleStoreContext } from '../../stores/contexts/SampleStoreContext';
import { InputFilter, ListData } from '../../components';

// Instantiate singleton at screen level
const sampleService = new SampleService();
const sampleStore = SampleStore.getInstance(sampleService);

export const SampleScreen = () => {
    return (
        <SampleStoreContext.Provider value={sampleStore}>
            <div>
                <InputFilter />
                <ListData />
            </div>
        </SampleStoreContext.Provider>
    );
};
```

**Component** (`src/components/InputFilter/InputFilter.tsx`):
```jsx
import { observer } from "mobx-react-lite";
import { useSampleStore } from '../../stores/contexts/SampleStoreContext';

export const InputFilter = observer(() => {
    const store = useSampleStore();
    return (
        <input 
            type="text" 
            value={store.data.filter} 
            onChange={e => store.updateFilter(e.target.value)} 
        />
    );
});
```

**Component** (`src/components/InputFilter/ListData.tsx`):
```jsx
import { observer } from "mobx-react-lite";
import { useSampleStore } from '../../stores/contexts/SampleStoreContext';

export const ListData = observer(() => {
    const store = useSampleStore();
    const filtered = store.getFiltered();
    return (
        <div>
            {filtered.map(s => <div key={s}>{s}</div>)}
        </div>
    );
});
```


## TypeScript Conventions
- Define **interfaces** for complex data structures
- Use **type aliases** for union types and literal types
- Always specify **return types** for functions
- Use **generics** when appropriate for reusable components
- Handle **null/undefined** cases explicitly