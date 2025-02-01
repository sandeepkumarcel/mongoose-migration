module.exports = function(fileInfo, { jscodeshift: j }) {
    // console.log(`\n🔍 Processing File: ${fileInfo.path || 'Unknown File'}`);
    // console.log(`📜 Original Source Code:\n${fileInfo.source}\n`);

    const root = j(fileInfo.source);

    const MONGOOSE_METHODS = ['find', 'findOne', 'updateOne', 'deleteOne', 'save', 'remove', 'exec'];

    root.find(j.CallExpression).forEach(path => {
        const { callee, arguments: args } = path.node;

        if (
            callee.type === "MemberExpression" &&  
            MONGOOSE_METHODS.includes(callee.property.name) &&  
            args.length > 0 &&  
            (args[args.length - 1].type === "FunctionExpression" || 
             args[args.length - 1].type === "ArrowFunctionExpression") 
        ) {
            // console.log(`✅ Found Mongoose callback for method: ${callee.property.name}`);

            const callbackFn = args.pop();
            const errVar = callbackFn.params[0]?.name || 'err';  
            const dataVar = callbackFn.params[1]?.name || 'result';  
            let body = callbackFn.body.body;  

            // Find the first "if" block that checks for err availability
            let errorHandlingBlock = null;
            let successPath = [];
            let foundErrorBlock = false;
            
            body.forEach(statement => {
                if (!foundErrorBlock && 
                    statement.type === "IfStatement" &&  
                    statement.test.name === errVar) {
                    
                    // Handle both block statements and single statements
                    const consequentBody = statement.consequent.type === 'BlockStatement' 
                        ? statement.consequent.body
                        : [statement.consequent];
                    
                    if (consequentBody.length > 0) {
                        errorHandlingBlock = {
                            ...statement,
                            consequent: {
                                ...statement.consequent,
                                body: consequentBody
                            }
                        };
                        foundErrorBlock = true;
                        return; // Skip adding to successPath
                    }
                }
                successPath.push(statement);
            });

            // console.log(`🔍 Extracted Callback Function:\n`, j(callbackFn).toSource());
            // console.log(`🔹 Error Variable: ${errVar}, Data Variable: ${dataVar}`);
            // console.log(`📝 Success Path for .then():\n`, j(successPath).toSource());

            const thenExpression = j.callExpression(
                j.memberExpression(j.callExpression(callee, args), j.identifier("then")),
                [j.arrowFunctionExpression([j.identifier(dataVar)], j.blockStatement(successPath))]
            );

            // Use the extracted error handling block in catch
            const catchStatements = errorHandlingBlock 
                ? (errorHandlingBlock.consequent.type === 'BlockStatement'
                    ? errorHandlingBlock.consequent.body
                    : [errorHandlingBlock.consequent])
                : [
                    j.expressionStatement(j.callExpression(j.identifier("callback"), []))
                ];

            const catchExpression = j.callExpression(
                j.memberExpression(thenExpression, j.identifier("catch")),
                [j.arrowFunctionExpression([j.identifier(errVar)], j.blockStatement(catchStatements))]
            );

            // console.log(`🚀 Generated .then().catch() Expression:\n`, j(catchExpression).toSource());

            path.replace(catchExpression);
        }
    });

    const transformedSource = root.toSource({ quote: 'single' });
    const normalizedSource = transformedSource.replace(/\breturn\s+/g, 'return ');
    // console.log(`🎯 Transformed Source Code:\n${normalizedSource}\n`);

    return transformedSource;
};