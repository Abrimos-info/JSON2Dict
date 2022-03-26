#!/usr/bin/env node
const JSONStream = require('JSONStream');
const es = require('event-stream');
const commandLineArgs = require('command-line-args');
const { newDictionary, objToDictionary, outputDictionary } = require('./lib/dict');

const optionDefinitions = [
    { name: 'verbose', alias: 'v', type: String }
];
const args = commandLineArgs(optionDefinitions);
const dict = newDictionary();

process.stdin.setEncoding('utf8');

process.stdin
.pipe(JSONStream.parse())
.pipe(es.mapSync(function (obj) {
    objToDictionary(dict, obj);
    dict.count++;
    delete obj;
}))
// .pipe(JSONStream.stringify(false))
// .pipe(process.stdout);

process.stdin.on('end', () => {
    // process.stdout.write( JSON.stringify(dict, null, 4) );
    outputDictionary(dict);
    process.stdout.write('\n');
    process.exit(0);
});
