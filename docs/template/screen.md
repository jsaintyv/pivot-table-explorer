# {Name of the screen}

## Design 

@sketch.html 

Note: This sketch.html use src/App.css to be consistent with the global design


## Actions

```gherkin
Given login is filled, password is empty
When I click the Connect button
Then I should see an error message "Password is required"
``` 