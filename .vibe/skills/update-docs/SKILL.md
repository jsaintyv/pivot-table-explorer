---
name: update-docs
description: Update documentation of the project
---

# Goal 
Update the documentation.

Analyse React components and update docs/screens/, with one screen per folder

# Steps

1. Analyse docs/screens/ 
2. Ask the user which screen to update
3. Analyse src/. 
4. Update docs/screens/ with the new information
   * Be concise and clear
   * Use markdown format
   * Content should be at user level, not technical level

# Example of documentation structure

```markdown

# Name of the screen

## Design 

A component <component name>

```
<border>
Login: <input>
Password: <password>
<button>Connect</button>
</border>

```

## Actions

```gerkin
Given login is filled, password is empty
When I click the Connect button
Then I should see an error message "Password is required"
``` 

``` 
