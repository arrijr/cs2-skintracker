// backend/src/config/currency.js
// Static FX table — update by editing this file and redeploying.
// Rates are USD → target. Multiply USD amounts by rate to get target.

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'];

export const FX_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const SUPPORTED_THEMES = ['DARK', 'LIGHT', 'SYSTEM'];

export function isValidCurrency(code) {
  return SUPPORTED_CURRENCIES.includes(code);
}

export function isValidTheme(code) {
  return SUPPORTED_THEMES.includes(code);
}
