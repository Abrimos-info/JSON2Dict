#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const CSV = require('csv-string');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
    { name: 'directory', alias: 'd', type: String, defaultOption: true }
];

const args = commandLineArgs(optionDefinitions);

if (!args.directory) {
    console.error('Usage: node matrix.js -d <directory> or node matrix.js <directory>');
    process.exit(1);
}

if (!fs.existsSync(args.directory) || !fs.statSync(args.directory).isDirectory()) {
    console.error(`Error: Directory "${args.directory}" does not exist or is not a directory.`);
    process.exit(1);
}

function readCSVFiles(directory) {
    const files = fs.readdirSync(directory)
        .filter(file => file.endsWith('.csv'))
        .map(file => path.join(directory, file));
    
    if (files.length === 0) {
        console.error(`Error: No CSV files found in directory "${directory}".`);
        process.exit(1);
    }
    
    const datasets = {};
    
    files.forEach(filePath => {
        const filename = path.basename(filePath, '.csv');
        const content = fs.readFileSync(filePath, 'utf8');
        const rows = CSV.parse(content);
        
        if (rows.length < 2) return; // Skip files without data rows
        
        const headers = rows[0];
        const fieldIndex = headers.indexOf('FIELD');
        const typeIndex = headers.indexOf('TYPE');
        const minIndex = headers.indexOf('MIN');
        const maxIndex = headers.indexOf('MAX');
        const topValuesIndex = headers.indexOf('TOP VALUES');
        
        if (fieldIndex === -1) return; // Skip files without FIELD column
        
        datasets[filename] = {};
        datasets[filename]['__RECORD_COUNT__'] = null;
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length <= fieldIndex) continue;
            
            const fieldName = row[fieldIndex];
            if (!fieldName) continue;
            
            // Handle NUMBER OF RECORDS specially
            if (fieldName.match(/^NUMBER OF RECORDS:/)) {
                // Extract the number after the colon
                const colonIndex = fieldName.indexOf(':');
                const recordCount = colonIndex !== -1 ? fieldName.substring(colonIndex + 1) : '0';
                datasets[filename]['__RECORD_COUNT__'] = recordCount;
                continue;
            }
            
            let cellValue = '';
            
            // Check if we have TOP VALUES
            if (topValuesIndex !== -1 && row[topValuesIndex]) {
                cellValue = row[topValuesIndex];
            }
            // Otherwise use MIN and MAX if available
            else if (minIndex !== -1 && maxIndex !== -1) {
                const minVal = row[minIndex] || '';
                const maxVal = row[maxIndex] || '';
                if (minVal || maxVal) {
                    cellValue = 'MIN: ' + minVal + '\nMAX: ' + maxVal;
                }
            }
            
            datasets[filename][fieldName] = cellValue;
        }
    });
    
    return datasets;
}

function buildMatrix(datasets) {
    const allFields = new Set();
    const fileNames = Object.keys(datasets);
    
    // Collect all unique field names (excluding special record count)
    fileNames.forEach(filename => {
        Object.keys(datasets[filename]).forEach(field => {
            if (field !== '__RECORD_COUNT__') {
                allFields.add(field);
            }
        });
    });
    
    const sortedFields = Array.from(allFields).sort();
    const matrix = [];
    
    // Header row
    const header = ['FIELD', ...fileNames];
    matrix.push(header);
    
    // Data rows
    sortedFields.forEach(field => {
        const row = [field];
        fileNames.forEach(filename => {
            const value = datasets[filename][field] || '';
            row.push(value);
        });
        matrix.push(row);
    });
    
    // Add NUMBER OF RECORDS as final row
    const recordRow = ['NUMBER OF RECORDS'];
    fileNames.forEach(filename => {
        const recordCount = datasets[filename]['__RECORD_COUNT__'] || '';
        recordRow.push(recordCount);
    });
    matrix.push(recordRow);
    
    return matrix;
}

function outputMatrix(matrix) {
    matrix.forEach(row => {
        process.stdout.write(CSV.stringify(row));
    });
}

// Main execution
const datasets = readCSVFiles(args.directory);
const matrix = buildMatrix(datasets);
outputMatrix(matrix);