const CSV = require('csv-string');

function newDictionary() {
    let dictionary = {
        count: 0,
        fields: []
    };
    return dictionary;
}

function newField(name, type) {
    let field = {
        name: name,
        count: 1,
        types: [type],
        min: Number.MAX_SAFE_INTEGER,
        max: 0,
        uniques: {}
    };
    return field;
}

function fieldExists(dict, name) {
    let field = null;
    dict.fields.map( f => {
        if(f.name == name) field = f;
    } );
    return field;
}

function objToDictionary(dict, obj, path='') {
    Object.keys(obj).map( key => {
        propToField(dict, key, obj[key], path);
    } )
}

function propToField(dict, key, value, path) {
    let fieldType = getType(value);

    switch(fieldType) {
        case 'array':
            path += key + '[]';
            // console.log(fieldType, path);
            value.map( v => {
                let itemType = getType(v);
                switch(itemType) {
                    case 'object':
                        objToDictionary(dict, v, path + '.');
                        break;
                    default:
                        // Cuando es un array de valores, ¿cómo se maneja?
                        updateFields(dict, fieldType, path, v);
                        break;
                }
            })
            break;
        case 'object':
            path += key + '.';
            // console.log(fieldType, path);
            objToDictionary(dict, value, path);
            break;
        case 'date':
        case 'string':
        case 'number':
            path += key;
            updateFields(dict, fieldType, path, value);
            break;
        case 'boolean':
            path += key;
            updateFields(dict, typeof value, path, value);
            break;
        case 'empty':
        case 'unknown':
        default:
            // console.log('EMPTY OR UNKNOWN VALUE:', key, value);
            break;
    }
}

function updateFields(dict, fieldType, path, value) {
    let field = fieldExists(dict, path);
    if(!field) {
        // Create new field
        let field = newField(path, fieldType);
        dict.fields.push(field);
    }
    else {
        updateFieldProperties(field, fieldType, value);
    }
}

function updateFieldProperties(field, type, value) {
    field.count++;
    if( field.types.indexOf(type) < 0 ) field.types.push(type);
    if(type == 'number') {
        if(field.min > value) field.min = value;
        if(field.max < value) field.max = value;
    }
    else if(type == 'string') {
        if(value.length > 64) value = value.substring(0, 64);
        if(!field.uniques.hasOwnProperty(value)) field.uniques[value] = 1;
        else field.uniques[value]++;
    }
    else if(type == 'boolean') {
        if(value) {
            if(!field.uniques.hasOwnProperty('true')) field.uniques['true'] = 1;
            else field.uniques['true']++;
        }
        else {
            if(!field.uniques.hasOwnProperty('true')) field.uniques['false'] = 1;
            else field.uniques['false']++;
        }
    }
    else if(type == 'date') {
        if(typeof value === 'string') value = new Date(value);
        if(field.min == Number.MAX_SAFE_INTEGER) { // First time this field has been seen, reinitialize min and max values
            field.min = new Date('2999-01-01');
            field.max = new Date('1900-01-01');
        }
        if(value < field.min) field.min = value;
        if(value > field.max) field.max = value;
    }
}

function getType(value) {
    if( isArray(value) ) return 'array';
    else if( isObject(value) ) return 'object';
    else if( isDate(value) ) return 'date';
    else if( isString(value) ) return 'string';
    else if( isNumeric(value) ) return 'number';
    // else if( isEmpty(value) ) return 'empty';
    else return typeof value;
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function isObject(val) {
    if (val === null) { return false;}
    return ( (typeof val === 'function') || (typeof val === 'object') );
}

function isArray(obj) {
    return !!obj && obj.constructor === Array;
}

function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isDate(d) {
    let dateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2,3}.*/
    return typeof d.toISOString === "function" || (typeof d === 'string' && d.match(dateRegex));
}

function outputDictionary(dict) {
    process.stdout.write( CSV.stringify( ["FIELD", "COUNT", "TYPE", "MIN", "MAX", "TOP VALUES"] ) )
    dict.fields.map( f => {
        outputField(f);
        delete f;
    } );
    process.stdout.write('NUMBER OF RECORDS:' + dict.count + '\n');
}

function outputField(field) {
    // CSV.stringify( ["line", "launder(line)", "simpleName(launder(line))", "isCompany(line)", "companyType(line)"] )
    field.types.map( fieldType => {
        let row = [];
        row.push( field.name );
        row.push( field.count );

        switch(fieldType) {
            case 'number':
                row.push('number');
                row.push(field.min);
                row.push(field.max);
                row.push('');
                break;
            case 'boolean':
                row.push('boolean');
                row.push('');
                row.push('');
                row.push( 'true: ' + field.uniques['true'] + '\nfalse: ' + field.uniques['false'] );
                break;
            case 'string':
                row.push('string');
                row.push('');
                row.push('');
                row.push( getTopValues(field.uniques, field.count) );
                break;
            case 'date':
                row.push('date');
                row.push(field.min.toISOString());
                row.push(field.max.toISOString());
                row.push('');
                break;
        }

        process.stdout.write( CSV.stringify( row ) );
    } );
}

function getTopValues(uniques, count) {
    let keysSorted = Object.keys(uniques).sort(function(a,b){return uniques[b]-uniques[a]});
    let forLimit = (keysSorted.length > 20)? 20 : keysSorted.length;
    let outputString = [];

    // If top result has count of 1, the field is a unique key
    // if(uniques[keysSorted[i]] == 1) {}

    for(let i=0; i<forLimit; i++) {
        outputString.push( keysSorted[i] + ': ' + uniques[keysSorted[i]] );
    }
    delete keysSorted;

    return outputString.join('\n');
}

module.exports = { newDictionary, objToDictionary, outputDictionary };
