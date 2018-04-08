/**
 * Calculate tick step.
 * Implementation from d3-array (ticks.js)
 * https://github.com/d3/d3-array/blob/master/src/ticks.js
 * @param start Start value
 * @param stop End value
 * @param count Ticks count
 */
export declare function tickStep(start: number, stop: number, count: number): number;
export declare function getScaledDecimals(decimals: any, tick_size: any): number;
/**
 * Calculate tick size based on min and max values, number of ticks and precision.
 * Implementation from Flot.
 * @param min           Axis minimum
 * @param max           Axis maximum
 * @param noTicks       Number of ticks
 * @param tickDecimals  Tick decimal precision
 */
export declare function getFlotTickSize(
  min: number,
  max: number,
  noTicks: number,
  tickDecimals: number
): any;
/**
 * Calculate axis range (min and max).
 * Implementation from Flot.
 */
export declare function getFlotRange(
  panelMin: any,
  panelMax: any,
  datamin: any,
  datamax: any
): {
  min: number;
  max: number;
};
/**
 * Calculate tick decimals.
 * Implementation from Flot.
 */
export declare function getFlotTickDecimals(
  data: any,
  axis: any
): {
  tickDecimals: any;
  scaledDecimals: number;
};
/**
 * Format timestamp similar to Grafana graph panel.
 * @param ticks Number of ticks
 * @param min Time from (in milliseconds)
 * @param max Time to (in milliseconds)
 */
export declare function grafanaTimeFormat(ticks: any, min: any, max: any): string;
/**
 * Logarithm of value for arbitrary base.
 */
export declare function logp(value: any, base: any): number;
/**
 * Get decimal precision of number (3.14 => 2)
 */
export declare function getPrecision(num: number): number;
/**
 * Get decimal precision of number stored as a string ("3.14" => 2)
 */
export declare function getStringPrecision(num: string): number;
