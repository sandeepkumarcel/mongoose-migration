/**
 * jscodeshift transform to convert Mongoose save callbacks into .then/.catch calls,
 * with the following rules:
 *
 * 1. Remove statements exactly matching `expect(err).toBeFalsy()`
 * 2. If statement is exactly `expect(err).toBeTruthy()`, move to .catch()
 * 3. Otherwise, if statement contains `err` identifier at all, move to .catch()
 * 4. Everything else goes to .then()
 *
 * Usage:
 *   npx jscodeshift -t mongoose-callbacks-to-promises.js path/to/your/file.js
 */

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  /**
   * Returns true if a statement is exactly `expect(err).toBeFalsy()`.
   */
  function isExpectErrToBeFalsy(statement, errParamName) {
    if (!j.ExpressionStatement.check(statement)) return false;
    const expr = statement.expression;
    if (!j.CallExpression.check(expr)) return false;

    // e.g.: expect(err).toBeFalsy()
    const { callee } = expr;
    if (!j.MemberExpression.check(callee)) return false;
    if (callee.property.name !== 'toBeFalsy') return false;

    const object = callee.object;
    if (!j.CallExpression.check(object)) return false;
    if (!object.callee || object.callee.name !== 'expect') return false;

    const [arg] = object.arguments;
    if (!arg || !j.Identifier.check(arg)) return false;
    if (arg.name !== errParamName) return false;

    return true;
  }

  /**
   * Returns true if a statement is exactly `expect(err).toBeTruthy()`.
   */
  function isExpectErrToBeTruthy(statement, errParamName) {
    if (!j.ExpressionStatement.check(statement)) return false;
    const expr = statement.expression;
    if (!j.CallExpression.check(expr)) return false;

    // e.g.: expect(err).toBeTruthy()
    const { callee } = expr;
    if (!j.MemberExpression.check(callee)) return false;
    if (callee.property.name !== 'toBeTruthy') return false;

    const object = callee.object;
    if (!j.CallExpression.check(object)) return false;
    if (!object.callee || object.callee.name !== 'expect') return false;

    const [arg] = object.arguments;
    if (!arg || !j.Identifier.check(arg)) return false;
    if (arg.name !== errParamName) return false;

    return true;
  }

  /**
   * Check if a statement contains ANY identifier named `errParamName`, ignoring scope.
   * This ensures references like `err.errors['foo']` or `console.log(err)` get moved to catch.
   */
  function referencesErrIgnoringScope(statement, errParamName) {
    return j(statement)
      .find(j.Identifier, { name: errParamName })
      .size() > 0;
  }

  // 1) Find `.save(...)` calls that have exactly one function argument (the callback).
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        property: { name: 'save' },
      },
    })
    .filter(path => {
      const args = path.value.arguments;
      if (args.length !== 1) return false;
      const callback = args[0];
      return (
        j.FunctionExpression.check(callback) ||
        j.ArrowFunctionExpression.check(callback)
      );
    })
    .forEach(path => {
      const callbackPath = path.get('arguments', 0);
      const callbackFn = callbackPath.value;
      if (!callbackFn.params || !callbackFn.body || !callbackFn.body.body) {
        return;
      }

      // Callback signature: function(err, doc) { ... }
      // If no errParam, use default 'err'
      const [errParam, docParam] = callbackFn.params;
      const errParamName = errParam ? errParam.name : 'err';

      // We'll build new arrays of statements: thenStatements and catchStatements
      const thenStatements = [];
      const catchStatements = [];

      callbackFn.body.body.forEach(statement => {
        // (1) Remove `expect(err).toBeFalsy()`
        if (isExpectErrToBeFalsy(statement, errParamName)) {
          // skip it entirely
          return;
        }

        // (2) If `expect(err).toBeTruthy()`, goes to catch
        if (isExpectErrToBeTruthy(statement, errParamName)) {
          catchStatements.push(statement);
          return;
        }

        // (3) Else if statement references `err` anywhere, goes to catch
        if (referencesErrIgnoringScope(statement, errParamName)) {
          catchStatements.push(statement);
          return;
        }

        // (4) Otherwise => then
        thenStatements.push(statement);
      });

      // Build arrow functions for .then(...) and .catch(...)
      const thenFn = j.arrowFunctionExpression(
        docParam ? [docParam] : [],
        j.blockStatement(thenStatements)
      );
      const catchFn = j.arrowFunctionExpression(
        [j.identifier(errParamName)],
        j.blockStatement(catchStatements)
      );

      // Remove the original callback from `.save(...)`
      path.value.arguments = [];

      // Now transform `.save(...)` into `.save().then(...).catch(...)`
      const thenCall = j.callExpression(
        j.memberExpression(path.value, j.identifier('then')),
        [thenFn]
      );
      const catchCall = j.callExpression(
        j.memberExpression(thenCall, j.identifier('catch')),
        [catchFn]
      );

      // Replace the original call in the AST
      j(path).replaceWith(catchCall);
    });

  return root.toSource({ quote: 'single' });
};
