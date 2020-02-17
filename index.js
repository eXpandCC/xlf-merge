#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const convert = require('xml-js');
const shell = require('shelljs');
const mergeXlf = require('./merge-xlf');

async function runMerge(inputPaths, outputPath) {
    const inputFiles = (function*() { yield* shell.ls(inputPaths); })();
    const sourceFile = inputFiles.next().value;

    // console.log('Initial file', inputPaths);
    let fileContent = fs.readFileSync(sourceFile).toString();
    let output = convert.xml2js(fileContent);

    for (let fileIter = inputFiles.next(); !fileIter.done; fileIter = inputFiles.next()) {
        fileContent = fs.readFileSync(fileIter.value).toString();
        output = await mergeXlf(output, convert.xml2js(fileContent), fileIter.value);
    }

    const outXml = convert.js2xml(output, {compact: false, spaces: 4});
    fs.writeFileSync(outputPath, outXml);
    console.log(`Generated output file ${outputPath}`);
    console.log("🔚");
}

program
    .version('1.0.3')
    .usage('[options] <input files or pattern such as *.xlf ...>')
    .option('-o, --output <output>', 'Output file name')
    .parse(process.argv);

if (program.args === 0 || !program.output) {
    program.help();
}

try {
    runMerge(program.args, program.output);
}
catch (err) {
    console.error(err);
}
