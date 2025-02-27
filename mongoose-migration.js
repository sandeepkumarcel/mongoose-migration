module.exports = function (fileInfo, { jscodeshift: j }, defaultCallbackIdentifier = "done") {
  // console.log(`\n🔍 Processing File: ${fileInfo.path || 'Unknown File'}`);
  // console.log(`📜 Original Source Code:\n${fileInfo.source}\n`);

  const root = j(fileInfo.source)

  root.find(j.CallExpression).forEach(path => {
    migrateCallbacks(j, path, defaultCallbackIdentifier)
    migrateObjectId(j, path)
    migrateRemove(j, path)
  }

  )

  const transformedSource = root.toSource({ quote: 'single' })

  return transformedSource
}

function migrateCallbacks (j, path,defaultCallbackIdentifier) {
  const MONGOOSE_METHODS = ['find', 'findOne', 'findOneAndUpdate' ,'updateOne', 'deleteOne', 'deleteMany', 'save', 'remove', 'exec', 'findOneAndRemove']
  const { callee, arguments: args } = path.node
  if (
    callee.type === 'MemberExpression' &&
            MONGOOSE_METHODS.includes(callee.property.name) &&
            args.length > 0 &&
            (args[args.length - 1].type === 'FunctionExpression' ||
             args[args.length - 1].type === 'ArrowFunctionExpression') &&
            // Special check for 'find' method to ensure it's called on a Model (starts with capital letter)
            (callee.property.name !== 'find' || 
             (callee.object.type === 'Identifier' && /^[A-Z]/.test(callee.object.name)))
  ) {
    // console.log(`✅ Found Mongoose callback for method: ${callee.property.name}`);

    const callbackFn = args.pop()
    const errVar = callbackFn.params[0]?.name || 'err'
    const dataVar = callbackFn.params[1]?.name || 'result'
    const body = callbackFn.body.body

    // Find the first "if" block that checks for err availability
    let errorHandlingBlock = null
    let successPath = []
    let foundErrorBlock = false

    body?.forEach(statement => {
      if (!foundErrorBlock &&
                    statement.type === 'IfStatement' &&
                    statement.test.name === errVar) {
        // Handle both block statements and single statements
        const consequentBody = statement.consequent.type === 'BlockStatement'
          ? statement.consequent.body
          : [statement.consequent]

        if (consequentBody.length > 0) {
          errorHandlingBlock = {
            ...statement,
            consequent: {
              ...statement.consequent,
              body: consequentBody
            }
          }
          foundErrorBlock = true
          
          // Add else block to successPath if it exists
          if (statement.alternate) {
            successPath.push(statement.alternate)
          }
          return // Skip adding to successPath
        }
      }
      successPath.push(statement)
    })

    if(successPath.length === 0 && !callbackFn.body.body){
        successPath = [j.expressionStatement(j.callExpression(j.identifier(defaultCallbackIdentifier), [j.literal(null),j.identifier(dataVar)]))]
    }

    const hasAwait = j(callbackFn.body).find(j.AwaitExpression).size() > 0

    // Check if the original callback is async
    const isOriginalCallbackAsync = callbackFn.async

    // Convert function expression to function expression, arrow to arrow
    const callbackType = callbackFn.type === 'FunctionExpression'
      ? 'FunctionExpression'
      : 'ArrowFunctionExpression'

    // Create .then callback with proper arguments
    const thenCallback = callbackType === 'FunctionExpression'
      ? j.functionExpression(
        null,
        [j.identifier(dataVar)],
        j.blockStatement(successPath)
      )
      : j.arrowFunctionExpression(
        [j.identifier(dataVar)],
        j.blockStatement(successPath)
      )

    // Ensure async functions are generated correctly
    if (isOriginalCallbackAsync) {
      thenCallback.async = true
    }

    // Check if neither error handling nor data/error variables are used
    const noErrorHandling = !errorHandlingBlock
    const noDataOrErrorUsed = j(callbackFn.body).find(j.Identifier, {
      name: name => [errVar, dataVar].includes(name)
    }).size() === 0
  // Case 1: model.find(callback)


      if (noErrorHandling && noDataOrErrorUsed) {
      // Use .finally block
      const finallyCallback = callbackType === 'FunctionExpression'
        ? j.functionExpression(
          null,
          [],
          j.blockStatement(successPath),
          isOriginalCallbackAsync
        )
        : j.arrowFunctionExpression(
          [],
          j.blockStatement(successPath),
          isOriginalCallbackAsync
        )

      // Add a dummy catch block
      const dummyCatch = j.arrowFunctionExpression(
        [],
        j.blockStatement([])
      )

      const catchExpression = j.callExpression(
        j.memberExpression(j.callExpression(callee, args), j.identifier('catch')),
        [dummyCatch]
      )

      finalExpression = j.callExpression(
        j.memberExpression(catchExpression, j.identifier('finally')),
        [finallyCallback]
      )
    } 
    else {
      // Use .then and .catch blocks (existing logic)
      const thenExpression = j.callExpression(
        j.memberExpression(j.callExpression(callee, args), j.identifier('then')),
        [thenCallback]
      )

      // Define catchStatements before using it
      const catchStatements = errorHandlingBlock
        ? (errorHandlingBlock.consequent.type === 'BlockStatement'
            ? errorHandlingBlock.consequent.body
            : [errorHandlingBlock.consequent])
        : [
            j.expressionStatement(j.callExpression(j.identifier(defaultCallbackIdentifier), [
              j.identifier(errVar?.name || 'err')
            ]))
          ]

      // Add the comment separately after creating the block
      const catchBlock = j.blockStatement(catchStatements)
      if (!errorHandlingBlock) {
        catchBlock.comments = [j.commentLine(' fix_this_manually')]
      }

      const catchCallback = callbackType === 'FunctionExpression'
        ? j.functionExpression(
          null,
          [j.identifier(errVar)],
          catchBlock // Use the block with comments
        )
        : j.arrowFunctionExpression(
          [j.identifier(errVar)],
          catchBlock // Use the block with comments
        )

      if (isOriginalCallbackAsync) {
        catchCallback.async = true
      }

      finalExpression = j.callExpression(
        j.memberExpression(thenExpression, j.identifier('catch')),
        [catchCallback]
      )
    }

    path.replace(finalExpression)
  }
}

function migrateObjectId (j, path) {
  const { node } = path
  // Handle ObjectId conversion
  if (
    node.callee.type === 'MemberExpression' &&
        node.callee.property.name === 'ObjectId' &&
        node.arguments.length === 1 &&
        node.arguments[0].type === 'Literal'
  ) {
    // Convert mongoose.Types.ObjectId("string") to new mongoose.Types.ObjectId("string")
    path.replace(
      j.newExpression(
        j.memberExpression(
          j.memberExpression(
            j.identifier('mongoose'),
            j.identifier('Types')
          ),
          j.identifier('ObjectId')
        ),
        node.arguments
      )
    )
  }
}

function migrateRemove (j, path) {
  const { node } = path
  // Handle deprecated remove() method
  if (
    node.callee.type === 'MemberExpression' &&
        node.callee.property.name === 'remove'
  ) {
    // Replace remove() with deleteOne() or deleteMany()
    const newMethod = j.identifier('deleteMany') // Default to deleteMany
    // delete or deleteMany ==> decide??
    path.replace(
      j.callExpression(
        j.memberExpression(
          node.callee.object,
          newMethod
        ),
        node.arguments
      )
    )
  }
}
