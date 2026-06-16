/**
 * Temperature Conversion Utilities
 * Provides functions to convert between Celsius, Fahrenheit, and Kelvin
 */

/**
 * Convert Celsius to Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
function celsiusToFahrenheit(celsius) {
  return (celsius * 9/5) + 32;
}

/**
 * Convert Fahrenheit to Celsius
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
function fahrenheitToCelsius(fahrenheit) {
  return (fahrenheit - 32) * 5/9;
}

/**
 * Convert Celsius to Kelvin
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Kelvin
 */
function celsiusToKelvin(celsius) {
  return celsius + 273.15;
}

/**
 * Convert Kelvin to Celsius
 * @param {number} kelvin - Temperature in Kelvin
 * @returns {number} Temperature in Celsius
 */
function kelvinToCelsius(kelvin) {
  return kelvin - 273.15;
}

/**
 * Round temperature to specified decimal places
 * @param {number} temp - Temperature value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded temperature
 */
function roundTemperature(temp, decimals = 2) {
  return Math.round(temp * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  celsiusToKelvin,
  kelvinToCelsius,
  roundTemperature
};
