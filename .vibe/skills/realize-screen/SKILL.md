---
name: realize-screen
description: Realize documentation of the project
---

# Goal

Realize or complete the screen.

# Steps
1. Analyze docs/screens/ and understand the structure of the documentation, Read [react/mobx pattern](../../../docs/typescript/pattern.md)
2. Ask the user which screen to realize or complete
3. Analyze React src/screens/
4. Prepare plan-dev.md in docs/screens/{screen name}
5. Add in plan-dev.md a section to define new models to create, suggest to the user, and validate them with them
6. Add in plan-dev.md a section to define new services to create or complete, suggest to the user, and validate them with them
7. Add in plan-dev.md a section to define new service tests to create or complete, suggest to the user, and validate them with them
8. Add in plan-dev.md a section to define new store methods to create or complete, suggest to the user, and validate them with them
9. Add in plan-dev.md a section to define new React components to create or complete, suggest to the user, and validate them with them
    - React components should be short (max 100 lines); when they grow, they should be split into sub-components
    - Each React component should be a MobX observer
    - Each React component should use stores from React context
    - Define new tests for React sub-components
    - Follow [react/mobx pattern](../../../docs/typescript/pattern.md)
10. Add in plan-dev.md new methods to complete the store to handle events from React components
11. Ask the user to clarify any missing information or to validate the documentation
12. Ask user to validate plan-dev.md before continuing
13. Implement changes in src/models
14. Implement changes in src/services & src/utils
15. Implement changes in src/stores
16. Implement changes in src/screens & src/components. 
17. Never end development if `npm run build` or `npm run test` fails 


