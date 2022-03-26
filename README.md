# JSON2Dict

Analyze stream of JSON documents and produce a dictionary of their structure and values.

### Usage

```
(stream of JSON lines) | node index.js > CSV file
```

### Details

This script receives a stream of JSON objects, one object per line. Each object is recursively parsed and each property analyzed according to its data type. Output is then produced as a CSV file, containing the following structure:

- FIELD: the path to the JSON property. Array fields are output as field[] and objects inside arrays are output as field[].property.
- COUNT: number of times a field is seen in all documents. If the field is inside an array of objects, it is counted every time it appears in every object.
- TYPE: data type of the field. Supported types: date, string, number, boolean.
- MIN: minimum value found for the field (applies to fields of type number or date).
- MAX: maximum value found for the field (applies to fields of type number or date).
- TOP VALUES: the top 20 most frequent values for the field (applies to fields of type string, outputs counts for "true" and "false" for booleans). Displayed as a list of strings separated by newline, each string formatted as "value: count". If all counts are 1, the field is probably a unique identifier.

Number of records processed is displayed at the end of the CSV file.
