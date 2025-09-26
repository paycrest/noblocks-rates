import { useState, useEffect } from 'react';
import currenciesCodes from '@/data/currenciesCodes.json';

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
        
        const response = await fetch('https://get.geojs.io/v1/ip/geo.js');
        
        if (!response.ok) {
          throw new Error('Failed to fetch location data');
        }
        
        const responseText = await response.text();
        const jsonMatch = responseText.match(/geoip\((.+)\)/);
        if (!jsonMatch) {
          throw new Error('Failed to parse location data');
        }
        
        const data = JSON.parse(jsonMatch[1]);
        const countryCode = data.country_code;
        
        const currencyData = currenciesCodes.find(
          (item) => item.country_code === countryCode
        );
        
        const locationData = currencyData ? {
          country: data.country || 'Unknown Country',
          currency: currencyData.currency_name,
          currencyCode: currencyData.currency_code,
        } : {
          country: 'United States',
          currency: 'United States Dollar',
          currencyCode: 'USD',
        };
        
        setLocation({
          country: locationData.country,
          countryCode: countryCode,
          currency: locationData.currency,
          currencyCode: locationData.currencyCode,
        });
        
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
