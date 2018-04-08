'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
var time_series2_1 = require('../time_series2');
/**
 * Calculate tick step.
 * Implementation from d3-array (ticks.js)
 * https://github.com/d3/d3-array/blob/master/src/ticks.js
 * @param start Start value
 * @param stop End value
 * @param count Ticks count
 */
function tickStep(start, stop, count) {
  var e10 = Math.sqrt(50),
    e5 = Math.sqrt(10),
    e2 = Math.sqrt(2);
  var step0 = Math.abs(stop - start) / Math.max(0, count),
    step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
    error = step0 / step1;
  if (error >= e10) {
    step1 *= 10;
  } else if (error >= e5) {
    step1 *= 5;
  } else if (error >= e2) {
    step1 *= 2;
  }
  return stop < start ? -step1 : step1;
}
exports.tickStep = tickStep;
function getScaledDecimals(decimals, tick_size) {
  return decimals - Math.floor(Math.log(tick_size) / Math.LN10);
}
exports.getScaledDecimals = getScaledDecimals;
/**
 * Calculate tick size based on min and max values, number of ticks and precision.
 * Implementation from Flot.
 * @param min           Axis minimum
 * @param max           Axis maximum
 * @param noTicks       Number of ticks
 * @param tickDecimals  Tick decimal precision
 */
function getFlotTickSize(min, max, noTicks, tickDecimals) {
  var delta = (max - min) / noTicks,
    dec = -Math.floor(Math.log(delta) / Math.LN10),
    maxDec = tickDecimals;
  var magn = Math.pow(10, -dec),
    norm = delta / magn, // norm is between 1.0 and 10.0
    size;
  if (norm < 1.5) {
    size = 1;
  } else if (norm < 3) {
    size = 2;
    // special case for 2.5, requires an extra decimal
    if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
      size = 2.5;
      ++dec;
    }
  } else if (norm < 7.5) {
    size = 5;
  } else {
    size = 10;
  }
  size *= magn;
  return size;
}
exports.getFlotTickSize = getFlotTickSize;
/**
 * Calculate axis range (min and max).
 * Implementation from Flot.
 */
function getFlotRange(panelMin, panelMax, datamin, datamax) {
  var autoscaleMargin = 0.02;
  var min = +(panelMin != null ? panelMin : datamin);
  var max = +(panelMax != null ? panelMax : datamax);
  var delta = max - min;
  if (delta === 0.0) {
    // Grafana fix: wide Y min and max using increased wideFactor
    // when all series values are the same
    var wideFactor = 0.25;
    var widen = Math.abs(max === 0 ? 1 : max * wideFactor);
    if (panelMin === null) {
      min -= widen;
    }
    // always widen max if we couldn't widen min to ensure we
    // don't fall into min == max which doesn't work
    if (panelMax == null || panelMin != null) {
      max += widen;
    }
  } else {
    // consider autoscaling
    var margin = autoscaleMargin;
    if (margin != null) {
      if (panelMin == null) {
        min -= delta * margin;
        // make sure we don't go below zero if all values
        // are positive
        if (min < 0 && datamin != null && datamin >= 0) {
          min = 0;
        }
      }
      if (panelMax == null) {
        max += delta * margin;
        if (max > 0 && datamax != null && datamax <= 0) {
          max = 0;
        }
      }
    }
  }
  return {min: min, max: max};
}
exports.getFlotRange = getFlotRange;
/**
 * Calculate tick decimals.
 * Implementation from Flot.
 */
function getFlotTickDecimals(data, axis) {
  var _a = time_series2_1.getDataMinMax(data),
    datamin = _a.datamin,
    datamax = _a.datamax;
  var _b = getFlotRange(axis.min, axis.max, datamin, datamax),
    min = _b.min,
    max = _b.max;
  var noTicks = 3;
  var tickDecimals, maxDec;
  var delta = (max - min) / noTicks;
  var dec = -Math.floor(Math.log(delta) / Math.LN10);
  var magn = Math.pow(10, -dec);
  // norm is between 1.0 and 10.0
  var norm = delta / magn;
  var size;
  if (norm < 1.5) {
    size = 1;
  } else if (norm < 3) {
    size = 2;
    // special case for 2.5, requires an extra decimal
    if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
      size = 2.5;
      ++dec;
    }
  } else if (norm < 7.5) {
    size = 5;
  } else {
    size = 10;
  }
  size *= magn;
  tickDecimals = Math.max(0, maxDec != null ? maxDec : dec);
  // grafana addition
  var scaledDecimals = tickDecimals - Math.floor(Math.log(size) / Math.LN10);
  return {tickDecimals: tickDecimals, scaledDecimals: scaledDecimals};
}
exports.getFlotTickDecimals = getFlotTickDecimals;
/**
 * Format timestamp similar to Grafana graph panel.
 * @param ticks Number of ticks
 * @param min Time from (in milliseconds)
 * @param max Time to (in milliseconds)
 */
function grafanaTimeFormat(ticks, min, max) {
  if (min && max && ticks) {
    var range = max - min;
    var secPerTick = range / ticks / 1000;
    var oneDay = 86400000;
    var oneYear = 31536000000;
    if (secPerTick <= 45) {
      return '%H:%M:%S';
    }
    if (secPerTick <= 7200 || range <= oneDay) {
      return '%H:%M';
    }
    if (secPerTick <= 80000) {
      return '%m/%d %H:%M';
    }
    if (secPerTick <= 2419200 || range <= oneYear) {
      return '%m/%d';
    }
    return '%Y-%m';
  }
  return '%H:%M';
}
exports.grafanaTimeFormat = grafanaTimeFormat;
/**
 * Logarithm of value for arbitrary base.
 */
function logp(value, base) {
  return Math.log(value) / Math.log(base);
}
exports.logp = logp;
/**
 * Get decimal precision of number (3.14 => 2)
 */
function getPrecision(num) {
  var str = num.toString();
  return getStringPrecision(str);
}
exports.getPrecision = getPrecision;
/**
 * Get decimal precision of number stored as a string ("3.14" => 2)
 */
function getStringPrecision(num) {
  var dot_index = num.indexOf('.');
  if (dot_index === -1) {
    return 0;
  } else {
    return num.length - dot_index - 1;
  }
}
exports.getStringPrecision = getStringPrecision;
