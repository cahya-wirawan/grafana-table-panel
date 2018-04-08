/**
 * Calculate decimals for legend and update values for each series.
 * @param data series data
 * @param panel
 */
export declare function updateLegendValues(data: TimeSeries[], panel: any): void;
export declare function getDataMinMax(
  data: TimeSeries[]
): {
  datamin: any;
  datamax: any;
};
export default class TimeSeries {
  datapoints: any;
  id: string;
  label: string;
  alias: string;
  aliasEscaped: string;
  color: string;
  valueFormater: any;
  stats: any;
  legend: boolean;
  allIsNull: boolean;
  allIsZero: boolean;
  decimals: number;
  scaledDecimals: number;
  hasMsResolution: boolean;
  isOutsideRange: boolean;
  lines: any;
  dashes: any;
  bars: any;
  points: any;
  yaxis: any;
  zindex: any;
  stack: any;
  nullPointMode: any;
  fillBelowTo: any;
  transform: any;
  flotpairs: any;
  unit: any;
  constructor(opts: any);
  applySeriesOverrides(overrides: any): void;
  getFlotPairs(fillStyle: any): any[];
  updateLegendValues(formater: any, decimals: any, scaledDecimals: any): void;
  formatValue(value: any): any;
  isMsResolutionNeeded(): boolean;
  hideFromLegend(options: any): boolean;
}
