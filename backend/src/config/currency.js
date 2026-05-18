// backend/src/config/currency.js
// Static FX table — update by editing this file and redeploying.
// Base currency is EUR (Steam Market scrape currency for our European audience).
// Rates are EUR → target. Multiply EUR amounts by rate to get target.

export const BASE_CURRENCY = 'EUR';

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP'];

export const FX_RATES = {
  EUR: 1.0,
  USD: 1.087,
  GBP: 0.86,
};

export const CURRENCY_SYMBOLS = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

export const SUPPORTED_THEMES = ['DARK', 'LIGHT', 'SYSTEM'];

export function isValidCurrency(code) {
  return SUPPORTED_CURRENCIES.includes(code);
}

export function isValidTheme(code) {
  return SUPPORTED_THEMES.includes(code);
}
