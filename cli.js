#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const jscodeshift = require('jscodeshift');
const  transform  = require('./mongoose-migration');
const util = require('util');

// Parse command-line arguments
const [,, pattern] = process.argv;

if (!pattern) {
    console.error('Error: Please provide a glob pattern (e.g., "src/**/*.js")');
    process.exit(1);
}

// Find all files matching the pattern
const files = glob.sync(pattern);

if (files.length === 0) {
    console.error(`Error: No files found matching pattern "${pattern}"`);
    process.exit(1);
}

console.log(`🔍 Found ${files.length} files to process\n`);

// Process each file
let successCount = 0;
let errorCount = 0;
const modifiedFiles = [];
const errorFiles = [];
const unchangedFiles = [];

files.forEach(filePath => {
    const absolutePath = path.resolve(filePath);
    
    try {
        // Check if the file exists
        if (!fs.existsSync(absolutePath)) {
            console.error(`❌ File not found: ${absolutePath}`);
            errorCount++;
            errorFiles.push(absolutePath);
            return;
        }

        // Read the file content
        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        const originalContent = fileContent;

        // Apply the transformation
        const transformedContent = transform(
            {
                path: absolutePath,
                source: fileContent
            },
            { jscodeshift },
           filePath.includes(".test.js") ? "done" : "callback_identifier"
        );

        // Check if content was modified
        if (transformedContent !== originalContent) {
            // Write the transformed content back to the file
            fs.writeFileSync(absolutePath, transformedContent);
            console.log(`✅ Transformed: ${absolutePath}`);
            successCount++;
            modifiedFiles.push(absolutePath);
        } else {
            console.log(`ℹ️  No changes needed: ${absolutePath}`);
            unchangedFiles.push(absolutePath);
        }
    } catch (error) {
        console.error(`❌ Error processing ${absolutePath}:`, util.inspect(error));
        errorCount++;
        errorFiles.push(absolutePath);
    }
});

// Print summary
console.log('\n📊 Summary:');
console.log(`Total files processed: ${files.length}`);
console.log(`Successfully transformed: ${successCount}`);
console.log(`No changes needed: ${files.length - successCount - errorCount}`);
console.log(`Errors: ${errorCount}`);

// Print modified files
if (modifiedFiles.length > 0) {
    console.log('\n✅ Modified files:');
    modifiedFiles.forEach(file => console.log(`  - ${file}`));
}

// Print unchanged files
if (unchangedFiles.length > 0) {
    console.log('\nℹ️  Unchanged files:');
    unchangedFiles.forEach(file => console.log(`  - ${file}`));
}

// Print error files
if (errorFiles.length > 0) {
    console.log('\n❌ Files with errors:');
    errorFiles.forEach(file => console.log(`  - ${file}`));
} 