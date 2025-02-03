const fs = require('fs');
const path = require('path');
const jscodeshift = require('jscodeshift');
const esprima = require('esprima');
const escodegen = require('escodegen'); // To generate code from AST
const mongooseMigration = require('./mongoose-migration'); // Import migration script

describe('Mongoose Migration Script - Edge Cases', () => {
    const testCases = [
        { name: 'Standard Callback Hell', input: 'input.js', expected: 'expected.js' },
        // { name: 'Empty Callback', input: 'empty-callback-input.js', expected: 'empty-callback-expected.js' },
        // { name: 'No Error Handling', input: 'no-error-handling-input.js', expected: 'no-error-handling-expected.js' },
        // { name: 'Nested Callbacks with Unused Variables', input: 'nested-unused-vars-input.js', expected: 'nested-unused-vars-expected.js' },
        // { name: 'Multiple Error Handlers', input: 'multiple-error-handlers-input.js', expected: 'multiple-error-handlers-expected.js' },
        // { name: 'Callback with Early Return', input: 'early-return-input.js', expected: 'early-return-expected.js' },
        // { name: 'Callback with Multiple Operations', input: 'multiple-operations-input.js', expected: 'multiple-operations-expected.js' },
        // { name: 'Callback with Conditional Logic', input: 'conditional-logic-input.js', expected: 'conditional-logic-expected.js' },
        // { name: 'Callback with Multiple Callbacks', input: 'multiple-callbacks-input.js', expected: 'multiple-callbacks-expected.js' },
        // { name: 'Callback with No Parameters', input: 'no-params-input.js', expected: 'no-params-expected.js' },
        // { name: 'Callback with Complex Logic', input: 'complex-logic-input.js', expected: 'complex-logic-expected.js' },
        // { name: 'Callback with BeforeAll', input: 'before-all-input.js', expected: 'before-all-expected.js' },
        // { name: 'Callback with Test File', input: 'test-file-input.js', expected: 'test-file-expected.js' },
        // { name: 'Callback with HttpConnector', input: 'httpConnector.test-input.js', expected: 'httpConnector.test-expected.js' }
    ];

    testCases.forEach(({ name, input, expected }) => {
        it(`should correctly transform: ${name}`, () => {
            const inputPath = path.join(__dirname, input);
            const expectedPath = path.join(__dirname, expected);

            const inputCode = fs.readFileSync(inputPath, 'utf8');
            const expectedCode = fs.readFileSync(expectedPath, 'utf8');

            // Call the migration function correctly
            const transformedCode = mongooseMigration(
                { source: inputCode },      // Pass as fileInfo
                { jscodeshift },            // Pass jscodeshift API
            );

           
            // save the transformed code to a file
            fs.writeFileSync(__dirname + "/results/"+ input + '-transformed.js', transformedCode);

             // Parse the transformed code and expected code into ASTs using esprima
             const transformedAST = esprima.parse(transformedCode);
            const expectedAST = esprima.parse(expectedCode);

            // Generate minified code from the ASTs using escodegen
            const transformedMinified = escodegen.generate(transformedAST, { format: { compact: true } });
            const expectedMinified = escodegen.generate(expectedAST, { format: { compact: true } });

            // Compare the minified code
            expect(transformedMinified).toBe(expectedMinified);
        });
    });
});
