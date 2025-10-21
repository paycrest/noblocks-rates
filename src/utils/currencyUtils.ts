import currenciesCodes from '@/data/currenciesCodes.json';

/**
 * Maps country codes to their primary currency codes
 * This handles cases where countries might have multiple currencies
 */
export const getCurrencyByCountry = (countryCode: string): string | null => {
  const currency = currenciesCodes.find(
    (item) => item.country_code === countryCode.toUpperCase()
  );
  
  return currency?.currency_code || null;
};

/**
 * Gets the currency name by currency code
 */
export const getCurrencyName = (currencyCode: string): string | null => {
  const currency = currenciesCodes.find(
    (item) => item.currency_code === currencyCode
  );
  
  return currency?.currency_name || null;
};

/**
 * Sorts currencies array to prioritize user's local currency
 */
export const prioritizeUserCurrency = (
  currencies: any[],
  userCurrencyCode: string
): any[] => {
  if (!userCurrencyCode) return currencies;
  
  const userCurrency = currencies.find(
    (currency) => currency.code === userCurrencyCode
  );
  
  if (!userCurrency) return currencies;
  
  // Move user's currency to the top
  const otherCurrencies = currencies.filter(
    (currency) => currency.code !== userCurrencyCode
  );
  
  return [userCurrency, ...otherCurrencies];
};
