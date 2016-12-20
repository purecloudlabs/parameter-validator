# Parameter Validator

Parameter validator makes it easy to verify that an object of parameters passed to a function contains required parameters.

## Examples

### Basic Examples

```js
import ParameterValidator from 'parameter-validator'
import { ParameterValidationError } from 'parameter-validator';

let params = { name: 'Paula PureCloud', id: 'user1' };

let parameterValidator = new ParameterValidator();
let { name, id } = parameterValidator.validate(params, [ 'name', 'id' ]);
// parameters exist, so no error is thrown

try {
    let { age } = parameterValidator.validate(params, [ 'age' ]);
} catch (error) {
    if (error instanceof ParameterValidationError) {
        console.log(error.message);
        // "Invalid value of 'undefined' was provided for parameter 'age'."
    }
}
```

### Async Example

To ensure that the any errors thrown are wrapped in a Promise, use the async version:

```js
parameterValidator.validateAsync(params, [ 'price', 'quantity' ])
.then(({ price, quantity }) => {

    console.log(`Price: ${price}, Quantity: ${quantity}`) ;
})
.catch(error => {

    if (error instanceof ParameterValidationError) {
        // Handle invalid parameters
    } else {
        throw error;
    }
});
```

### Advanced Example

Other types of validation:

* specify that at least one of a group of parameters must be included by placing those together within a nested array (either `username` or `email` must be specified in the example below)

* provide a specific validation function for a parameter by providing it in an object

```js
this.parameterValidator.validate(params, [
    'firstName',
    'lastName',
    [ 'username', 'email' ],
    { age: val => val > 30 }
]);
```

### Parameters

```
param:   {Object}    paramsProvided    - The names and values of provided parameters
param:   {Array}     paramRequirements - Each item in this array is interpretted in order as a validation rule.
                                       - If an item is a string, it's interpretted as the name of a parameter that must be contained in paramsProvided.
                                       - If an item is an Array, it's interpretted as an array of parameter names where at least one of the
                                         parameters in the Array must be in paramsProvided.
                                       - If an item is an Object, it's assumed that the object's only key is the name of a parameter to be validated
                                         and its corresponding value is a function that returns true if that parameter's value in paramsProvided is
                                         valid.
param:   {Object}    [extractedParams] - This method returns an object containing the names and values of the validated parameters extracted.
                                         By default, it creates a new object and assigns the extracted parameters to it, but if you want this
                                         method to add the extracted params to an existing object (such as the class instance that internally
                                         invokes this method), you can optionally supply that object as the extractedParams parameter.

returns: {Object}    extractedParams   - The names and values of the validated parameters extracted.

throws:  {ParameterValidationError}    - Indicates that one or more parameter validation rules failed. The error message identifies the names and
                                         values of each invalid parameter.
```


## Running Tests

