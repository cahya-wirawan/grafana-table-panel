System.register(
  ['lodash', './core/utils/flatten', './core/time_series2', './core/table_model'],
  function(exports_1) {
    var lodash_1, flatten_1, time_series2_1, table_model_1;
    var transformers;
    function transformDataToTable(data, panel) {
      var model = new table_model_1.default();
      if (!data || data.length === 0) {
        return model;
      }
      var transformer = transformers[panel.transform];
      if (!transformer) {
        throw {message: 'Transformer ' + panel.transform + ' not found'};
      }
      transformer.transform(data, panel, model);
      return model;
    }
    return {
      setters: [
        function(lodash_1_1) {
          lodash_1 = lodash_1_1;
        },
        function(flatten_1_1) {
          flatten_1 = flatten_1_1;
        },
        function(time_series2_1_1) {
          time_series2_1 = time_series2_1_1;
        },
        function(table_model_1_1) {
          table_model_1 = table_model_1_1;
        },
      ],
      execute: function() {
        transformers = {};
        transformers['timeseries_to_rows'] = {
          description: 'Time series to rows',
          getColumns: function() {
            return [];
          },
          transform: function(data, panel, model) {
            model.columns = [
              {text: 'Time', type: 'date'},
              {text: 'Metric'},
              {text: 'Value'},
            ];
            for (var i = 0; i < data.length; i++) {
              var series = data[i];
              for (var y = 0; y < series.datapoints.length; y++) {
                var dp = series.datapoints[y];
                model.rows.push([dp[1], series.target, dp[0]]);
              }
            }
          },
        };
        transformers['timeseries_to_columns'] = {
          description: 'Time series to columns',
          getColumns: function() {
            return [];
          },
          transform: function(data, panel, model) {
            model.columns.push({text: 'Time', type: 'date'});
            // group by time
            var points = {};
            for (var i = 0; i < data.length; i++) {
              var series = data[i];
              model.columns.push({text: series.target});
              for (var y = 0; y < series.datapoints.length; y++) {
                var dp = series.datapoints[y];
                var timeKey = dp[1].toString();
                if (!points[timeKey]) {
                  points[timeKey] = {time: dp[1]};
                  points[timeKey][i] = dp[0];
                } else {
                  points[timeKey][i] = dp[0];
                }
              }
            }
            for (var time in points) {
              var point = points[time];
              var values = [point.time];
              for (var i = 0; i < data.length; i++) {
                var value = point[i];
                values.push(value);
              }
              model.rows.push(values);
            }
          },
        };
        transformers['timeseries_aggregations'] = {
          description: 'Time series aggregations',
          getColumns: function() {
            return [
              {text: 'Avg', value: 'avg'},
              {text: 'Min', value: 'min'},
              {text: 'Max', value: 'max'},
              {text: 'Total', value: 'total'},
              {text: 'Current', value: 'current'},
              {text: 'Count', value: 'count'},
            ];
          },
          transform: function(data, panel, model) {
            var i, y;
            model.columns.push({text: 'Metric'});
            for (i = 0; i < panel.columns.length; i++) {
              model.columns.push({text: panel.columns[i].text});
            }
            for (i = 0; i < data.length; i++) {
              var series = new time_series2_1.default({
                datapoints: data[i].datapoints,
                alias: data[i].target,
              });
              series.getFlotPairs('connected');
              var cells = [series.alias];
              for (y = 0; y < panel.columns.length; y++) {
                cells.push(series.stats[panel.columns[y].value]);
              }
              model.rows.push(cells);
            }
          },
        };
        transformers['annotations'] = {
          description: 'Annotations',
          getColumns: function() {
            return [];
          },
          transform: function(data, panel, model) {
            model.columns.push({text: 'Time', type: 'date'});
            model.columns.push({text: 'Title'});
            model.columns.push({text: 'Text'});
            model.columns.push({text: 'Tags'});
            if (!data || !data.annotations || data.annotations.length === 0) {
              return;
            }
            for (var i = 0; i < data.annotations.length; i++) {
              var evt = data.annotations[i];
              model.rows.push([evt.time, evt.title, evt.text, evt.tags]);
            }
          },
        };
        transformers['table'] = {
          description: 'Table',
          getColumns: function(data) {
            if (!data || data.length === 0) {
              return [];
            }
            // Single query returns data columns as is
            if (data.length === 1) {
              return data[0].columns.slice();
            }
            // Track column indexes: name -> index
            var columnNames = {};
            // Union of all columns
            var columns = data.reduce(function(acc, series) {
              series.columns.forEach(function(col) {
                var text = col.text;
                if (columnNames[text] === undefined) {
                  columnNames[text] = acc.length;
                  acc.push(col);
                }
              });
              return acc;
            }, []);
            return columns;
          },
          transform: function(data, panel, model) {
            if (!data || data.length === 0) {
              return;
            }
            var noTableIndex = lodash_1.default.findIndex(data, function(d) {
              return d.type !== 'table';
            });
            if (noTableIndex > -1) {
              throw {
                message:
                  'Result of query #' +
                  String.fromCharCode(65 + noTableIndex) +
                  ' is not in table format, try using another transform.',
              };
            }
            // Single query returns data columns and rows as is
            if (data.length === 1) {
              model.columns = data[0].columns.slice();
              model.rows = data[0].rows.slice();
              return;
            }
            // Track column indexes of union: name -> index
            var columnNames = {};
            // Union of all non-value columns
            var columnsUnion = data.reduce(function(acc, series) {
              series.columns.forEach(function(col) {
                var text = col.text;
                if (columnNames[text] === undefined) {
                  columnNames[text] = acc.length;
                  acc.push(col);
                }
              });
              return acc;
            }, []);
            // Map old column index to union index per series, e.g.,
            // given columnNames {A: 0, B: 1} and
            // data [{columns: [{ text: 'A' }]}, {columns: [{ text: 'B' }]}] => [[0], [1]]
            var columnIndexMapper = data.map(function(series) {
              return series.columns.map(function(col) {
                return columnNames[col.text];
              });
            });
            // Flatten rows of all series and adjust new column indexes
            var flattenedRows = data.reduce(function(acc, series, seriesIndex) {
              var mapper = columnIndexMapper[seriesIndex];
              series.rows.forEach(function(row) {
                var alteredRow = [];
                // Shifting entries according to index mapper
                mapper.forEach(function(to, from) {
                  alteredRow[to] = row[from];
                });
                acc.push(alteredRow);
              });
              return acc;
            }, []);
            // Returns true if both rows have matching non-empty fields as well as matching
            // indexes where one field is empty and the other is not
            function areRowsMatching(columns, row, otherRow) {
              var foundFieldToMatch = false;
              for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
                if (
                  row[columnIndex] !== undefined &&
                  otherRow[columnIndex] !== undefined
                ) {
                  if (row[columnIndex] !== otherRow[columnIndex]) {
                    return false;
                  }
                } else if (
                  row[columnIndex] === undefined ||
                  otherRow[columnIndex] === undefined
                ) {
                  foundFieldToMatch = true;
                }
              }
              return foundFieldToMatch;
            }
            // Merge rows that have same values for columns
            var mergedRows = {};
            var compactedRows = flattenedRows.reduce(function(acc, row, rowIndex) {
              if (!mergedRows[rowIndex]) {
                // Look from current row onwards
                var offset = rowIndex + 1;
                // More than one row can be merged into current row
                while (offset < flattenedRows.length) {
                  // Find next row that could be merged
                  var match = lodash_1.default.findIndex(
                    flattenedRows,
                    function(otherRow) {
                      return areRowsMatching(columnsUnion, row, otherRow);
                    },
                    offset
                  );
                  if (match > -1) {
                    var matchedRow = flattenedRows[match];
                    // Merge values from match into current row if there is a gap in the current row
                    for (
                      var columnIndex = 0;
                      columnIndex < columnsUnion.length;
                      columnIndex++
                    ) {
                      if (
                        row[columnIndex] === undefined &&
                        matchedRow[columnIndex] !== undefined
                      ) {
                        row[columnIndex] = matchedRow[columnIndex];
                      }
                    }
                    // Dont visit this row again
                    mergedRows[match] = matchedRow;
                    // Keep looking for more rows to merge
                    offset = match + 1;
                  } else {
                    // No match found, stop looking
                    break;
                  }
                }
                acc.push(row);
              }
              return acc;
            }, []);
            model.columns = columnsUnion;
            model.rows = compactedRows;
          },
        };
        transformers['json'] = {
          description: 'JSON Data',
          getColumns: function(data) {
            if (!data || data.length === 0) {
              return [];
            }
            var names = {};
            for (var i = 0; i < data.length; i++) {
              var series = data[i];
              if (series.type !== 'docs') {
                continue;
              }
              // only look at 100 docs
              var maxDocs = Math.min(series.datapoints.length, 100);
              for (var y = 0; y < maxDocs; y++) {
                var doc = series.datapoints[y];
                var flattened = flatten_1.default(doc, null);
                for (var propName in flattened) {
                  names[propName] = true;
                }
              }
            }
            return lodash_1.default.map(names, function(value, key) {
              return {text: key, value: key};
            });
          },
          transform: function(data, panel, model) {
            var i, y, z;
            for (var _i = 0, _a = panel.columns; _i < _a.length; _i++) {
              var column = _a[_i];
              var tableCol = {text: column.text};
              // if filterable data then set columns to filterable
              if (data.length > 0 && data[0].filterable) {
                tableCol.filterable = true;
              }
              model.columns.push(tableCol);
            }
            if (model.columns.length === 0) {
              model.columns.push({text: 'JSON'});
            }
            for (i = 0; i < data.length; i++) {
              var series = data[i];
              for (y = 0; y < series.datapoints.length; y++) {
                var dp = series.datapoints[y];
                var values = [];
                if (lodash_1.default.isObject(dp) && panel.columns.length > 0) {
                  var flattened = flatten_1.default(dp, null);
                  for (z = 0; z < panel.columns.length; z++) {
                    values.push(flattened[panel.columns[z].value]);
                  }
                } else {
                  values.push(JSON.stringify(dp));
                }
                model.rows.push(values);
              }
            }
          },
        };
        transformers['parsing_decoder'] = {
          parsingCodes: {
            channel: [
              'Invalid packet length',
              'End of data frame reached',
              'Time stamp specifies future time',
              'Invalid number of samples',
              'Invalid authentication switch',
              'Invalid compression switch',
              'Trailing bytes in DFF subframe',
              'Invalid calibration period',
              'Invalid authentication offset',
              'Invalid option switch',
              'Invalid status size',
              'Invalid channel data size',
              'Steim compression not supported',
              'Channel not signed',
              'Invalid channel signature',
              'No certificate found for channel',
              'Invalid Candian compressed data',
              'Unsupported data type',
              'Unexpected signature verification error',
              'Invalid channel time stamp',
              'Invalid calibration factor',
              'Channel start time not within one sample',
              'Invalid site or channel name',
            ],
            frame: [
              'Internal error',
              'Invalid channel(s) in frame',
              'Invalid data frame size',
              'Nominal time specifies future time',
              'Invalid description size',
              'Invalid max. DF size',
              'Invalid channel number',
              'Invalid DFF frame size',
              'Invalid CRC',
              'Frame has channel warning(s)',
              'Invalid frame size',
              'Frame too large',
              'Protocol violation',
              'Frame not signed',
              'Invalid signature',
              'No certificate found',
              'Unsupported frame type (yet)',
              'No certificates loaded',
              'Channel authentication failed',
              'Unknown frame type',
              'Frame not (complete) parsed',
              'Invalid alert type',
              'Invalid station name',
              'Invalid command size',
              'Frame has channel error(s)',
              'Station is not allowed to send commands',
              'Invalid channel string size',
              'Invalid frame time length',
              'Command frame too old',
            ],
          },
          description: 'Frame and channel parsing decoder',
          getColumns: function() {
            return [];
          },
          transform: function(data, panel, model) {
            var parsingCode = this.parsingCodes[panel.parsingCodeType];
            model.columns = [{text: 'Station'}, {text: 'Error Message'}];
            var codeByStation = {};
            for (var i = 0; i < data[0].datapoints.length; i++) {
              if (data[1].datapoints[i][0] == null) continue;
              if (typeof codeByStation[data[0].datapoints[i]] !== 'undefined') {
                codeByStation[data[0].datapoints[i][0]] |= parseInt(
                  data[1].datapoints[i][0],
                  10
                );
              } else {
                codeByStation[data[0].datapoints[i][0]] = parseInt(
                  data[1].datapoints[i][0],
                  10
                );
              }
            }
            var stations = Object.keys(codeByStation).sort();
            for (var i in stations) {
              var decodedString = [];
              var bitPosition = 1;
              for (var j = 0; j < parsingCode.length; j++) {
                var parsedCode = codeByStation[stations[i]] & (bitPosition << j);
                if (parsedCode != 0) {
                  model.rows.push([stations[i], parsingCode[j]]);
                }
              }
            }
          },
        };
        transformers['qualityflags_decoder'] = {
          parsingCodes: {
            qualityflags: [
              'Constant data detected',
              'No input from sensor detected',
              'Data not checked',
              'Data arrived too late',
              'Data authentication failed',
              'Data not authenticated',
              'No cert for data found',
              'Data not signed',
              'Frame authentication failed',
              'Frame not authenticated',
              'No cert for frame found',
              'Frame not signed',
              'Frame authentication N/A',
              'Frame authentication N/A',
              'Frame authentication N/A',
              'Frame authentication N/A',
            ],
          },
          description: 'Qualityflags decoder',
          getColumns: function() {
            return [];
          },
          transform: function(data, panel, model) {
            var parsingCode = this.parsingCodes[panel.parsingCodeType];
            model.columns = [
              {text: 'Station'},
              {text: 'Channel'},
              {text: 'Error Message'},
            ];
            var codeByStation = {};
            for (var i = 0; i < data[0].datapoints.length; i++) {
              if (data[2].datapoints[i][0] == null) continue;
              if (
                typeof codeByStation[
                  data[0].datapoints[i][0] + ':' + data[1].datapoints[i][0]
                ] !== 'undefined'
              ) {
                codeByStation[
                  data[0].datapoints[i][0] + ':' + data[1].datapoints[i][0]
                ] |= parseInt(data[2].datapoints[i][0], 10);
              } else {
                codeByStation[
                  data[0].datapoints[i][0] + ':' + data[1].datapoints[i][0]
                ] = parseInt(data[2].datapoints[i][0], 10);
              }
            }
            var stations = Object.keys(codeByStation).sort();
            for (var i in stations) {
              var decodedString = [];
              var bitPosition = 1;
              for (var j = 0; j < parsingCode.length; j++) {
                var parsedCode = codeByStation[stations[i]] & (bitPosition << j);
                if (parsedCode != 0) {
                  var sta_chan = stations[i].split(':');
                  model.rows.push([sta_chan[0], sta_chan[1], parsingCode[j]]);
                }
              }
            }
          },
        };
        exports_1('transformers', transformers);
        exports_1('transformDataToTable', transformDataToTable);
      },
    };
  }
);
//# sourceMappingURL=transformers.js.map
