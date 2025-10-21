import { useState, useEffect } from 'react';
import currenciesCodes from '@/data/currenciesCodes.json';
import { getCurrencyByCountry, getCurrencyName } from '@/utils/currencyUtils';

interface LocationData {
  country: string;
  countryCode: string;
  currency: string;
  currencyCode: string;
}

export const useUserLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
        
        if (!response.ok) {
          throw new Error('Failed to fetch location data');
        }
        
        const data = await response.json();
        const countryCode = data.country_code;
        
        const resolvedCurrencyCode =
          getCurrencyByCountry(countryCode) ?? 'USD';
        const resolvedCurrencyName =
          getCurrencyName(resolvedCurrencyCode) ?? 'United States Dollar';

        const hasMapping = !!getCurrencyByCountry(countryCode);
        const locationData = hasMapping
          ? {
              country: data.country || 'Unknown Country',
              countryCode: countryCode,
              currency: resolvedCurrencyName,
              currencyCode: resolvedCurrencyCode,
            }
          : {
              country: 'United States',
              countryCode: 'US',
              currency: 'United States Dollar',
              currencyCode: 'USD',
            };
        
        setLocation(locationData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching user location:', err);
        setError(err instanceof Error ? err.message : 'Failed to detect location');
        
        setLocation({
          country: 'United States',
          countryCode: 'US',
          currency: 'US Dollar',
          currencyCode: 'USD',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return { location, loading, error };
};
