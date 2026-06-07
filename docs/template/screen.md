# {Name of the screen}

## Design 

In pseudo HTML
```
<border>
Login: <input>
Password: <password>
<button>Connect</button>
</border>
```

A component <component name>

## Actions

```gherkin
Given login is filled, password is empty
When I click the Connect button
Then I should see an error message "Password is required"
``` 