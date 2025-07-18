# JSON2Dict

Analyze stream of JSON documents and produce a dictionary of their structure and values.

### Usage

Generate a dictionary from a single source:

```
(stream of JSON lines) | node index.js > CSV file
```

Generate a comparative matrix of fields from multiple dictionaries:

```
node matrix.js -d [DIRECTORY] > Matrix CSV file
```

### Params

```
-d      --directory         Path to directory containing multiple generated CSVs.
```

### Details

**Generating dictionary files**

This script receives a stream of JSON objects, one object per line. Each object is recursively parsed and each property analyzed according to its data type. Output is then produced as a CSV file, containing the following structure:

- FIELD: the path to the JSON property. Array fields are output as field[] and objects inside arrays are output as field[].property.
- COUNT: number of times a field is seen in all documents. If the field is inside an array of objects, it is counted every time it appears in every object.
- TYPE: data type of the field. Supported types: date, string, number, boolean.
- MIN: minimum value found for the field (applies to fields of type number or date).
- MAX: maximum value found for the field (applies to fields of type number or date).
- TOP VALUES: the top 20 most frequent values for the field (applies to fields of type string, outputs counts for "true" and "false" for booleans). Displayed as a list of strings separated by newline, each string formatted as "value: count". If all counts are 1, the field is probably a unique identifier.

Number of records processed is displayed at the end of the CSV file.

**Generating field matrix**

When dealing with multiple versions of the same source, for example: data published by multiple sources using the same data standard, or data from the same source published in separate files by year, it can be helpful to compare the field structure side-by-side. The *matrix.js* script generates a matrix from multiple CSVs produced by the *index.js* script to help with these use cases.

Simply place all CSVs into the same directory, and run the script with the path to the directory as only parameter.

Generated CSV contains:
- Field names in the first column
- Field values for each dataset in each successive column, with filename as a header
- Last row contains number of records
