import { expect, fail } from 'chai';
import sinon from 'sinon';
import ParameterValidator from '../src/ParameterValidator';
import { ParameterValidationError } from '../src/ParameterValidator';

describe('ParameterValidator', () => {
    let parameterValidator;

    beforeEach(() => {
        parameterValidator = new ParameterValidator();
    });

    describe('validate()', () => {
        describe('parameter existence validation', () => {
            it('should return the parameters specified if they all exist', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    squirrel: 'Rocky'
                };

                var extractedParams =  parameterValidator.validate(animalNames, ['cat', 'dog', 'squirrel']);

                expect(extractedParams).to.deep.equal(animalNames);
            });

            it('should not return any parameters not specified', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    squirrel: 'Rocky',
                    mouse: 'Jerry'
                };

                var expectedExtractedParams = cloneDeep(animalNames);
                delete expectedExtractedParams.mouse;

                var extractedParams =  parameterValidator.validate(animalNames, ['cat', 'dog', 'squirrel']);

                expect(extractedParams).to.deep.equal(expectedExtractedParams);
            });

            it('should throw a ParameterValidationError if a required parameter is not included', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake'
                };

                try {
                    parameterValidator.validate(animalNames, ['cat', 'dog', 'squirrel']);
                    throw new Error('validate() didn\'t throw an error like it was supposed to.');
                } catch(error) {
                    expect(error).to.be.instanceof(ParameterValidationError);
                    expect(error.toString()).to.equal('ParameterValidationError: Invalid value of \'undefined\' was provided for parameter \'squirrel\'.');
                }
            });

            it('should throw a ParameterValidationError decribing multiple failures if multiple required parameters are not included', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake'
                };

                try {
                    parameterValidator.validate(animalNames, ['cat', 'dog', 'squirrel', 'kangaroo']);
                    throw new Error('validate() didn\'t throw an error like it was supposed to.');
                } catch(error) {
                    expect(error).to.be.instanceof(ParameterValidationError);
                    expect(error.toString()).to.equal('ParameterValidationError: Invalid value of \'undefined\' was provided for parameter \'squirrel\'. ' +
                        'Invalid value of \'undefined\' was provided for parameter \'kangaroo\'.');
                }
            });

            it('should accept a parameter with a null value without throwing a ParameterValidationError', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    dragon: null
                };

                var extractedParams =  parameterValidator.validate(animalNames, ['cat', 'dog', 'dragon']);
                expect(extractedParams).to.deep.equal(animalNames);
            });

            it('should accept a parameter that is a blank string without throwing a ParameterValidationError', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    dragon: ''
                };

                var extractedParams =  parameterValidator.validate(animalNames, ['cat', 'dog', 'dragon']);
                expect(extractedParams).to.deep.equal(animalNames);
            });

            it('should add extracted parameters to an existing object if one is supplied as the extractedParams parameter', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    squirrel: 'Rocky'
                };

                var existingParams = {
                    elephant: 'Dumbo'
                };

                var expectedUpdatedExistingParams = cloneDeep(existingParams);
                Object.assign(expectedUpdatedExistingParams, animalNames);

                var extractedParams =  parameterValidator.validate(animalNames, ['cat', 'dog', 'squirrel'], existingParams);

                expect(extractedParams).to.deep.equal(expectedUpdatedExistingParams);
                expect(existingParams).to.deep.equal(expectedUpdatedExistingParams);
            });
        });

        describe('logical OR parameter existence validation', () => {
            it('should return the parameters specified if they all exist', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    squirrel: 'Rocky'
                };

                var extractedParams =  parameterValidator.validate(animalNames, [['dog', 'cat', 'squirrel']]);

                expect(extractedParams).to.deep.equal(animalNames);
            });

            it('should not return any parameters not specified', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    squirrel: 'Rocky',
                    mouse: 'Jerry'
                };

                var expectedExtractedParams = cloneDeep(animalNames);
                delete expectedExtractedParams.mouse;

                var extractedParams =  parameterValidator.validate(animalNames, [['cat', 'dog', 'squirrel']]);

                expect(extractedParams).to.deep.equal(expectedExtractedParams);
            });

            it('should not throw an error if one of the parameters in the logical OR group is included but others in the group are not', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    squirrel: 'Rocky',
                    mouse: 'Jerry'
                };

                var expectedExtractedParams = cloneDeep(animalNames);
                delete expectedExtractedParams.mouse;
                delete expectedExtractedParams.squirrel;

                var extractedParams =  parameterValidator.validate(animalNames, [['cat', 'dog', 'chimp']]);

                expect(extractedParams).to.deep.equal(expectedExtractedParams);
            });

            it('should throw a ParameterValidationError if none of the parameters specified are included', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake'
                };

                try {
                    parameterValidator.validate(animalNames, [['moose', 'kangaroo', 'mouse']]);
                    throw new Error('validate() didn\'t throw an error like it was supposed to.');
                } catch(error) {
                    expect(error).to.be.instanceof(ParameterValidationError);
                    expect(error.toString()).to.equal('ParameterValidationError: One of the following parameters must be included: \'moose\', \'kangaroo\', \'mouse\'.');
                }
            });


            it('should add extracted parameters to an existing object if one is supplied as the extractedParams parameter', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    squirrel: 'Rocky'
                };

                var existingParams = {
                    elephant: 'Dumbo'
                };

                var expectedUpdatedExistingParams = cloneDeep(existingParams);
                Object.assign(expectedUpdatedExistingParams, animalNames);
                delete expectedUpdatedExistingParams.squirrel;

                var extractedParams =  parameterValidator.validate(animalNames, [['cat', 'dog', 'chimp']], existingParams);

                expect(extractedParams).to.deep.equal(expectedUpdatedExistingParams);
                expect(existingParams).to.deep.equal(expectedUpdatedExistingParams);
            });
        });

        describe('execution of a custom validation function', () => {
            it('should return a parameter specified if it passes validation', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    squirrel: 'Rocky'
                };

                var extractedParams =  parameterValidator.validate(animalNames, [{cat: catNameIsCool}]);

                expect(extractedParams).to.deep.equal({cat: 'Garfield'});
            });

            it('should throw a ParameterValidationError if a custom validation function determines a parameter is invalid', () => {
                var animalNames = {
                    cat: 'Sylvester',
                    dog: 'Jake'
                };

                try {
                    parameterValidator.validate(animalNames, [{cat: catNameIsCool}]);
                    throw new Error('validate() didn\'t throw an error like it was supposed to.');
                } catch(error) {
                    expect(error).to.be.instanceof(ParameterValidationError);
                    expect(error.toString()).to.equal('ParameterValidationError: Invalid value of \'Sylvester\' was provided for parameter \'cat\'.');
                }
            });


            it('should add extracted parameters to an existing object if one is supplied as the extractedParams parameter', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Beethoven',
                    squirrel: 'Rocky'
                };

                var existingParams = {
                    elephant: 'Dumbo'
                };

                var expectedUpdatedExistingParams = cloneDeep(existingParams);
                Object.assign(expectedUpdatedExistingParams, animalNames);
                delete expectedUpdatedExistingParams.squirrel;

                var extractedParams =  parameterValidator.validate(animalNames, [{cat: catNameIsCool}, {dog: dogNameIsCool}], existingParams);

                expect(extractedParams).to.deep.equal(expectedUpdatedExistingParams);
                expect(existingParams).to.deep.equal(expectedUpdatedExistingParams);
            });
        });

        describe('combining different types of validation', () => {
            it('should return the parameters specified if they are valid', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    squirrel: 'Rocky',
                    mouse: 'Speedy'
                };

                var expectedExtractedParams = cloneDeep(animalNames);
                delete expectedExtractedParams.dog;

                var extractedParams =  parameterValidator.validate(animalNames, ['mouse', ['squirrel', 'moose'], {cat: catNameIsCool}]);

                expect(extractedParams).to.deep.equal(expectedExtractedParams);
            });

            it('should throw a ParameterValidationError listing the validation errors', () => {
                var animalNames = {
                    cat: 'Sylvester',
                    dog: 'Jake',
                    mouse: 'Jerry'
                };

                var expectedErrorMessage = 'ParameterValidationError: Invalid value of \'undefined\' was provided for parameter \'chicken\'. ' +
                    'One of the following parameters must be included: \'squirrel\', \'moose\'. Invalid value of \'Sylvester\' was provided for parameter \'cat\'. ' +
                    'Invalid value of \'Jake\' was provided for parameter \'dog\'.';

                try {
                    parameterValidator.validate(animalNames,
                        ['mouse', 'chicken', ['squirrel', 'moose'], {cat: catNameIsCool}, {dog: dogNameIsCool}]);
                    throw new Error('validate() didn\'t throw an error like it was supposed to.');
                } catch(error) {
                    expect(error).to.be.instanceof(ParameterValidationError);
                    expect(error.toString()).to.equal(expectedErrorMessage);
                }
            });

            it('should add extracted parameters to an existing object if one is supplied as the extractedParams parameter', () => {
                var animalNames = {
                    cat: 'Garfield',
                    dog: 'Jake',
                    squirrel: 'Rocky'
                };

                var existingParams = {
                    elephant: 'Dumbo'
                };

                var expectedUpdatedExistingParams = cloneDeep(existingParams);
                Object.assign(expectedUpdatedExistingParams, animalNames);

                var extractedParams =  parameterValidator.validate(animalNames, [{cat: catNameIsCool}, 'dog', ['squirrel', 'moose']], existingParams);

                expect(extractedParams).to.deep.equal(expectedUpdatedExistingParams);
                expect(existingParams).to.deep.equal(expectedUpdatedExistingParams);
            });
        });

        describe('addPrefix option', () => {

            let animalNames,
                accumulator;

            beforeEach(() => {

                animalNames = {
                    dog: 'Scooby',
                    bear: 'Yogi',
                    penguin: 'Tux'
                };

                accumulator = {};
            });

            it(`throws an error when a value is provided that's not a string`, () => {

                try {
                    parameterValidator.validate(animalNames, [ 'penguin', 'bear' ], accumulator, { addPrefix: 4 });
                    fail();
                } catch (error) {
                    expect(error).to.be.instanceof(Error);
                }
            });

            it('adds a given string prefix to the validated properties it extracts', () => {

                parameterValidator.validate(animalNames, [ 'penguin', 'bear' ], accumulator, { addPrefix: '_' });
                expect(accumulator).to.deep.equal({
                    _penguin: 'Tux',
                    _bear: 'Yogi'
                });
            });
        });
    });

    describe('validateAsync()', () => {

        it('calls validate() asynchronously', () => {

            let expectedReturnValue = { testParam: 'first', testParam2: 'second' };
            let params = [ { first: true }, [ 'second' ] ];
            sinon.stub(parameterValidator, 'validate').returns(Promise.resolve(expectedReturnValue));

            return parameterValidator.validateAsync(...params)
            .then(validatedParams => {
                expect(parameterValidator.validate.callCount).to.equal(1);
                expect(parameterValidator.validate.firstCall.args).to.deep.equal(params);
                expect(validatedParams).to.deep.equal(expectedReturnValue);
            });
        });

        it('wraps errors thrown by validate() in a promise', () => {

            let expectedError = new Error('Uh oh...');
            parameterValidator.validate = () => { throw expectedError; };

            return parameterValidator.validateAsync()
            .then(() => {
                throw new Error(`validate() didn't throw an error like it's supposed to.`);
            })
            .catch(error => {
                expect(error).to.equal(expectedError);
            });
        });
    });
});

function catNameIsCool(name) {
    var presidents = ['Lincoln', 'Washington', 'Roosevelt', 'Garfield'];
    return presidents.indexOf(name) !== -1;
}

function dogNameIsCool(name) {
    var composers = ['Tchaikovsky', 'Gershwin', 'Beethoven'];
    return composers.indexOf(name) !== -1;
}

function cloneDeep(object) {
    return JSON.parse(JSON.stringify(object));
}
