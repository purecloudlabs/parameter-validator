/**
* Indicates that one or more parameter validation rules failed.
*
* @class
*/
export class ParameterValidationError extends Error {

    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor.name);
        }
    }
}

/**
* Performs validation on parameters contained in an object.
* @class
*/
export default class ParameterValidator {

    /**
    * @param {object}   [options]
    * @param {function} [options.defaultValidation] - An optional alternate function to use as the default validation
    *                                                         function instead of isDefined(). The function must accept a parameter
    *                                                         value as an input and return a boolean indicating its validity.
    */
    constructor(options) {
        if (options) {
            let {defaultValidation} = options;

            if (!(defaultValidation === undefined || typeof defaultValidation === 'function')) {
                throw new ParameterValidationError(`The optional defaultValidation parameter provided is not a function.`);
            }
            this._defaultValidation = options.defaultValidation;
        }
    }

	/**
    * @param 	{Object} 	paramsProvided - The names and values of provided parameters
    * @param 	{Array} 	paramRequirements - Each item in this array is interpretted in order as a validation rule.
    * 								- If an item is a string, it's interpretted as the name of a parameter that must be in paramsProvided.
    * 								- If an item is an Array, it's interpretted as an array of parameter names where at least one of the
    *									parameters in the Array must be in paramsProvided.
    *								- If an item is an Object, it's assumed that the object's only key is the name of a parameter to be validated
    *								 and its corresponding value is a function that returns true if that parameter's value in paramsProvided is
    *								 valid.
    * @param    {Object|null} [extractedParams] - This method returns an object containing the names and values of the validated parameters extracted.
    *                                             By default, it creates a new object and assigns the extracted parameters to it, but if you want this
    *                                             method to add the extracted params to an existing object (such as the class instance that internally
    *                                             invokes this method), you can supply that object as the extractedParams parameter.
    *
    * @param    {Object}    [options] - Additional options
    * @param    {string}    [options.addPrefix] - Specifies a prefix that will be added to each param name before it's assigned to the
    *                                             extractedParams object. This is useful, for example, for prefixing property names with an underscore
    *                                             to indicate that they're private properties.
    * @param    {class}     [options.errorClass] - Specifies a specific `Error` subclass to throw instead of the default `ParameterValidationError
    *                                              when invalid parameters are detected.
    * @returns  {Object}    extractedParams - The names and values of the validated parameters extracted.
    *
    * @throws   {ParameterValidationError} Indicates that one or more parameter validation rules failed.
    *
    * @example
    * let parameterValidator = new ParameterValidator();
	* parameterValidator.validate(params, ['requiredParam0', 'requiredParam1', ['eitherNeedThis', 'orThat'], {param3: (val) => val > 30}]);
	*/
    validate(paramsProvided, paramRequirements, extractedParams, options = {}) {

        extractedParams = this._getExtractedParamsObject(extractedParams);
        const ValidationErrorSubclass = this._getValidationErrorSubclass(options);

        if (!paramsProvided) {
        	// If only I could use the ParameterValidator here...
            throw new ValidationErrorSubclass(`A params object is required.`);
        }

        if (!Array.isArray(paramRequirements)) {
            throw new Error('paramRequirements must be an array.');
        }

        let prefix = options.addPrefix || ''; // Optional prefix to be added to each parameter name.

        if (typeof prefix !== 'string') {
            throw new Error('addPrefix option must be a string if provided.');
        }

        let errors = [];

        for (let paramRequirement of paramRequirements) {
        	if (Array.isArray(paramRequirement) && paramRequirement.length) {

                let validationResult = this._performLogicalOrParamValidation(paramsProvided, paramRequirement);
                this._assignProperties(extractedParams, validationResult.params, prefix);
        		errors.push(...validationResult.errors);

        	} else if (typeof paramRequirement === 'object') {
				// paramRequirement is an object with one or more keys where each key is a parameter's name
				// and its value is a validation function that returns true if the value is valid.
                for (let paramName in paramRequirement) {

                    let validationFunction = paramRequirement[paramName],
                        validationResult = this._executeValidationFunction(paramsProvided, paramName, validationFunction);

                    this._assignProperties(extractedParams, validationResult.params, prefix);
                    errors.push(...validationResult.errors);
                }
        	} else if ((typeof paramRequirement === 'string') && paramRequirement) {
        		// paramRequirement is a string specifying the name of a required parameter,
        		// So use the default validation function for validation.
                let validationResult = this._executeValidationFunction(paramsProvided, paramRequirement, this.defaultValidation);
                this._assignProperties(extractedParams, validationResult.params, prefix);
                errors.push(...validationResult.errors);
        	}
        }

        if (errors.length) {
        	let errorMessage = '';

        	for (let error of errors) {
        		errorMessage += error + ' ';
        	}
        	errorMessage = errorMessage.slice(0, -1);

        	throw new ValidationErrorSubclass(errorMessage);
        }

        return extractedParams;
    }

    /**
    * Same as `validate()`, but wrapped in a promise. This is handy for use in methods that need to be
    * async, because it guarantees that errors bubble up the promise chain as a rejected promise.
    *
    * @example
    * let parameterValidator = new ParameterValidator();
    * return parameterValidator.validateAsync(params, [ 'requiredParam0', 'requiredParam1', [ 'eitherNeedThis', 'orThat' ], { param3: (val) => val > 30 }])
    * then(({ requiredParam0, requiredParam1, param3 }) => {
    *   // do stuff
    * });
    */
    validateAsync(...args) {

        return Promise.resolve()
        .then(() => this.validate(...args));
    }

    /**
    * Returns isDefined() as the defaultValidation if a custom one was not provided.
    */
    get defaultValidation() {
        return this._defaultValidation || this.isDefined;
    }

    /**
    * Like Object.assign(), but with the ability to add an optional prefix to the property names.
    *
    * @param {Object} targetObject
    * @param {Object} propertiesToAdd
    * @param {string} [prefix]
    */
    _assignProperties(targetObject, propertiesToAdd, prefix = '') {

        for (let propertyName in propertiesToAdd) {
            targetObject[prefix + propertyName] = propertiesToAdd[propertyName];
        }
    }

    /**
    * Determines the correct object to use for extractedParams based on what the client provided.
    *
    * @param   {Object|Function|null|undefined} - extractedParams argument provided to `validate()`
    * @returns {Object|Function}
    * @private
    */
    _getExtractedParamsObject(extractedParams) {

        if ([ null, undefined ].includes(extractedParams)) {
            // The client either didn't provide an extractedParams argument or explicitly set
            // it to null, so just use a new object.
            return {};
        }

        if ([ 'object', 'function' ].includes(typeof extractedParams)) {
            // The client provided an existing object or function on which we'll set the extracted params.
            return extractedParams;
        }

        throw new Error(`Invalid value of '${extractedParams}' was provided for the extractedParams parameter.`);
    }

    /**
    * Determines whether to use the default ParameterValidationError or a custom
    * error subclass passed to `validate()`.
    *
    * @param   {options} [options] - options that were passed to `validate()`
    * @param   {class}   [options.errorClass]
    * @returns {class}
    * @private
    */
    _getValidationErrorSubclass(options) {

        if ((typeof options !== 'object') || (options.errorClass === undefined)) {
            return ParameterValidationError;
        }
        let { errorClass } = options;
        // Verify that errorClass is Error or an Error subclass.
        if (errorClass === Error || errorClass.prototype instanceof Error) {
            return errorClass;
        }
        throw new Error(`The errorClass provided was of type ${typeof errorClass} and was not an Error subclass.`);
    }

    /*
    * @param 	{Object} 	paramsProvided - The names and values of provided parameters
    * @param 	{Array} 	paramNames - Names of parameters, only one of which is required.
    * @returns 	{Array} 	errors - Error message strings
    * @returns  {Object}    params - Extracted parameter names & values.
    */
    _performLogicalOrParamValidation(paramsProvided, paramNames) {
        let extractedParams = {},
            errors = [],
            isValid = this.defaultValidation;

		for (var paramName of paramNames) {
			if (isValid(paramsProvided[paramName])) {
                extractedParams[paramName] = paramsProvided[paramName];
			}
		}

		if (!Object.keys(extractedParams).length) {
			var errorMessage = 'One of the following parameters must be included: ';
			for (paramName of paramNames) {
				errorMessage += `'${paramName}', `;
			}
			errorMessage = errorMessage.slice(0, -2) + '.';
			errors.push(errorMessage);
		}

		return {
            errors: errors,
            params: extractedParams
        };
    }

    /*
    * @param 	{Object} 	paramsProvided - The names and values of provided parameters
    * @param 	{Object} 	paramRequirement - object with one key where the key is the parameter's name
	*								and the value is a validation function that returns true if the value is valid.
    * @returns 	{Array} 	errors - Error message strings
    * @returns  {Object}    params - Extracted parameter names & values
    */
    _executeValidationFunction(paramsProvided, paramName, validationFunction) {
    	var errors = [];
        var extractedParams = {};

		if (typeof validationFunction !== 'function') {
			throw new Error(`A paramRequirement value provided for the parameter ${paramName} is not a function.`);
		}

		if (validationFunction(paramsProvided[paramName]) === true) {
            extractedParams[paramName] = paramsProvided[paramName];
        } else {
			errors.push(`Invalid value of '${paramsProvided[paramName]}' was provided for parameter '${paramName}'.`);
		}

		return {
            errors: errors,
            params: extractedParams
        };
    }

    isDefined(value) {
        return value !== undefined;
    }
}

// Also export `validate()` and `validateAsync` as standalone functions by creating a singleton instance.

const parameterValidator = new ParameterValidator();

export const validate = parameterValidator.validate.bind(parameterValidator);

export const validateAsync = parameterValidator.validateAsync.bind(parameterValidator);
