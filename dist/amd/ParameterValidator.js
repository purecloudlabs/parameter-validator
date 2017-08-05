define(['exports'], function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                arr2[i] = arr[i];
            }

            return arr2;
        } else {
            return Array.from(arr);
        }
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var ParameterValidationError = exports.ParameterValidationError = function (_Error) {
        _inherits(ParameterValidationError, _Error);

        function ParameterValidationError(message) {
            _classCallCheck(this, ParameterValidationError);

            var _this = _possibleConstructorReturn(this, (ParameterValidationError.__proto__ || Object.getPrototypeOf(ParameterValidationError)).call(this, message));

            _this.name = _this.constructor.name;
            _this.message = message;
            if (Error.captureStackTrace) {
                Error.captureStackTrace(_this, _this.constructor.name);
            }
            return _this;
        }

        return ParameterValidationError;
    }(Error);

    var ParameterValidator = function () {

        /**
        * @param {object}   [options]
        * @param {function} [options.defaultValidation] - An optional alternate function to use as the default validation
        *                                                         function instead of isDefined(). The function must accept a parameter
        *                                                         value as an input and return a boolean indicating its validity.
        */
        function ParameterValidator(options) {
            _classCallCheck(this, ParameterValidator);

            if (options) {
                var defaultValidation = options.defaultValidation;


                if (!(defaultValidation === undefined || typeof defaultValidation === 'function')) {
                    throw new ParameterValidationError('The optional defaultValidation parameter provided is not a function.');
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


        _createClass(ParameterValidator, [{
            key: 'validate',
            value: function validate(paramsProvided, paramRequirements, extractedParams) {
                var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};


                extractedParams = this._getExtractedParamsObject(extractedParams);
                var ValidationErrorSubclass = this._getValidationErrorSubclass(options);

                if (!paramsProvided) {
                    // If only I could use the ParameterValidator here...
                    throw new ValidationErrorSubclass('A params object is required.');
                }

                if (!Array.isArray(paramRequirements)) {
                    throw new Error('paramRequirements must be an array.');
                }

                var prefix = options.addPrefix || ''; // Optional prefix to be added to each parameter name.

                if (typeof prefix !== 'string') {
                    throw new Error('addPrefix option must be a string if provided.');
                }

                var errors = [];

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = paramRequirements[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var paramRequirement = _step.value;

                        if (Array.isArray(paramRequirement) && paramRequirement.length) {

                            var validationResult = this._performLogicalOrParamValidation(paramsProvided, paramRequirement);
                            this._assignProperties(extractedParams, validationResult.params, prefix);
                            errors.push.apply(errors, _toConsumableArray(validationResult.errors));
                        } else if ((typeof paramRequirement === 'undefined' ? 'undefined' : _typeof(paramRequirement)) === 'object') {
                            // paramRequirement is an object with one or more keys where each key is a parameter's name
                            // and its value is a validation function that returns true if the value is valid.
                            for (var paramName in paramRequirement) {

                                var validationFunction = paramRequirement[paramName],
                                    _validationResult = this._executeValidationFunction(paramsProvided, paramName, validationFunction);

                                this._assignProperties(extractedParams, _validationResult.params, prefix);
                                errors.push.apply(errors, _toConsumableArray(_validationResult.errors));
                            }
                        } else if (typeof paramRequirement === 'string' && paramRequirement) {
                            // paramRequirement is a string specifying the name of a required parameter,
                            // So use the default validation function for validation.
                            var _validationResult2 = this._executeValidationFunction(paramsProvided, paramRequirement, this.defaultValidation);
                            this._assignProperties(extractedParams, _validationResult2.params, prefix);
                            errors.push.apply(errors, _toConsumableArray(_validationResult2.errors));
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                if (errors.length) {
                    var errorMessage = '';

                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = errors[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var error = _step2.value;

                            errorMessage += error + ' ';
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }

                    errorMessage = errorMessage.slice(0, -1);

                    throw new ValidationErrorSubclass(errorMessage);
                }

                return extractedParams;
            }
        }, {
            key: 'validateAsync',
            value: function validateAsync() {
                var _this2 = this;

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                return Promise.resolve().then(function () {
                    return _this2.validate.apply(_this2, args);
                });
            }
        }, {
            key: '_assignProperties',
            value: function _assignProperties(targetObject, propertiesToAdd) {
                var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';


                for (var propertyName in propertiesToAdd) {
                    targetObject[prefix + propertyName] = propertiesToAdd[propertyName];
                }
            }
        }, {
            key: '_getExtractedParamsObject',
            value: function _getExtractedParamsObject(extractedParams) {

                if ([null, undefined].includes(extractedParams)) {
                    // The client either didn't provide an extractedParams argument or explicitly set
                    // it to null, so just use a new object.
                    return {};
                }

                if (['object', 'function'].includes(typeof extractedParams === 'undefined' ? 'undefined' : _typeof(extractedParams))) {
                    // The client provided an existing object or function on which we'll set the extracted params.
                    return extractedParams;
                }

                throw new Error('Invalid value of \'' + extractedParams + '\' was provided for the extractedParams parameter.');
            }
        }, {
            key: '_getValidationErrorSubclass',
            value: function _getValidationErrorSubclass(options) {

                if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' || options.errorClass === undefined) {
                    return ParameterValidationError;
                }
                var errorClass = options.errorClass;

                // Verify that errorClass is Error or an Error subclass.
                if (errorClass === Error || errorClass.prototype instanceof Error) {
                    return errorClass;
                }
                throw new Error('The errorClass provided was of type ' + (typeof errorClass === 'undefined' ? 'undefined' : _typeof(errorClass)) + ' and was not an Error subclass.');
            }
        }, {
            key: '_performLogicalOrParamValidation',
            value: function _performLogicalOrParamValidation(paramsProvided, paramNames) {
                var extractedParams = {},
                    errors = [],
                    isValid = this.defaultValidation;

                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = paramNames[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var paramName = _step3.value;

                        if (isValid(paramsProvided[paramName])) {
                            extractedParams[paramName] = paramsProvided[paramName];
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }

                if (!Object.keys(extractedParams).length) {
                    var errorMessage = 'One of the following parameters must be included: ';
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;

                    try {
                        for (var _iterator4 = paramNames[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            paramName = _step4.value;

                            errorMessage += '\'' + paramName + '\', ';
                        }
                    } catch (err) {
                        _didIteratorError4 = true;
                        _iteratorError4 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                _iterator4.return();
                            }
                        } finally {
                            if (_didIteratorError4) {
                                throw _iteratorError4;
                            }
                        }
                    }

                    errorMessage = errorMessage.slice(0, -2) + '.';
                    errors.push(errorMessage);
                }

                return {
                    errors: errors,
                    params: extractedParams
                };
            }
        }, {
            key: '_executeValidationFunction',
            value: function _executeValidationFunction(paramsProvided, paramName, validationFunction) {
                var errors = [];
                var extractedParams = {};

                if (typeof validationFunction !== 'function') {
                    throw new Error('A paramRequirement value provided for the parameter ' + paramName + ' is not a function.');
                }

                if (validationFunction(paramsProvided[paramName]) === true) {
                    extractedParams[paramName] = paramsProvided[paramName];
                } else {
                    errors.push('Invalid value of \'' + paramsProvided[paramName] + '\' was provided for parameter \'' + paramName + '\'.');
                }

                return {
                    errors: errors,
                    params: extractedParams
                };
            }
        }, {
            key: 'isDefined',
            value: function isDefined(value) {
                return value !== undefined;
            }
        }, {
            key: 'defaultValidation',
            get: function get() {
                return this._defaultValidation || this.isDefined;
            }
        }]);

        return ParameterValidator;
    }();

    exports.default = ParameterValidator;


    // Also export `validate()` and `validateAsync` as standalone functions by creating a singleton instance.

    var parameterValidator = new ParameterValidator();

    var validate = exports.validate = parameterValidator.validate.bind(parameterValidator);

    var validateAsync = exports.validateAsync = parameterValidator.validateAsync.bind(parameterValidator);
});