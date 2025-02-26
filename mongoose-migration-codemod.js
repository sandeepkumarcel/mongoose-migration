export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Pattern to match Mongoose methods with callbacks
  const mongoosePattern = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier' },
      property: { type: 'Identifier' }
    },
    arguments: [
      { type: 'ObjectExpression' }, // Query/update doc
      { type: 'FunctionExpression' } // Callback
    ]
  };

  root.find(j.CallExpression, mongoosePattern)
    .replaceWith(path => {
      const method = path.node.callee.property.name;
      const obj = path.node.callee.object;
      const args = path.node.arguments.slice(0, -1);
      const callback = path.node.arguments[path.node.arguments.length - 1];

      return j.memberExpression(
        j.memberExpression(
          j.callExpression(
            j.memberExpression(obj, j.identifier(method)),
            args
          ),
          j.callExpression(
            j.identifier('then'),
            [
              j.arrowFunctionExpression(
                [j.identifier('result')],
                j.blockStatement([
                  j.returnStatement(
                    j.callExpression(
                      j.memberExpression(
                        j.identifier('result'),
                        j.identifier('toObject')
                      ),
                      []
                    )
                  )
                ])
              )
            ]
          )
        ),
        j.callExpression(
          j.identifier('catch'),
          [
            j.arrowFunctionExpression(
              [j.identifier('err')],
              j.blockStatement([
                j.expressionStatement(
                  j.callExpression(
                    callback,
                    [j.identifier('err'), j.nullLiteral()]
                  )
                )
              ])
            )
          ]
        )
      );
    });

  // 2. Convert nested Mongoose callbacks to promise chains
  root.find(j.FunctionExpression)
    .forEach(path => {
      j(path).replaceWith(
        j.arrowFunctionExpression(
          path.node.params,
          j.blockStatement([
            j.returnStatement(
              j.awaitExpression(
                j.callExpression(
                  j.memberExpression(
                    path.node.body.body[0].expression.callee,
                    j.identifier('then')
                  ),
                  []
                )
              )
            )
          ])
        )
      );
    });

  // 3. Add promise return types to parent functions
  root.find(j.FunctionDeclaration)
    .forEach(path => {
      if (path.node.async) return;
      path.node.async = true;
    });

  return root.toSource();
} 