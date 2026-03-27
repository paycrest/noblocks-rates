import { useState, useEffect, useRef } from "react";
import { api } from "@/utils/axios";
import { cryptoCurrencies } from "@/data/cryptoCurrencies";
import currenciesCodes from "@/data/currenciesCodes.json";

export const useCurrencyRates = () => {
  const rates = useRef<any[]>([
    {
      code: "NGN",
      name: "Nigerian Naira",
      rate: 1600,
      symbol: "NG",
      type: "fiat",
    },
  ]);
  const [fiatCodes, setFiatCodes] = useState<{}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async (stablecoin: string, rateType = "sellRate") => {
    try {
      setLoading(true);
      const res = await api.get(`/rates/${stablecoin}`);

      let data = res.data;

      const fiatRates = data.map((item: any) => {
        const currency = currenciesCodes.find(
          (currencyItem: any) => currencyItem.currency_code === item.fiat
        );

        return {
          code: item.fiat,
          name: currency?.currency_name,
          type: "fiat",
          rate: rateType == "sellRate" ? item.sellRate : item.buyRate,
          symbol: currency?.country_code,
        };
      });

      const codes = fiatRates.reduce((acc: any, item: any) => {
        const country = currenciesCodes.find(
          (countryItem) => countryItem.currency_code === item.code
        );
        return { ...acc, [item.code]: country?.country_code };
      }, {});

      setFiatCodes(codes);
      rates.current = fiatRates;
      return fiatRates;
    } catch (err) {
      console.log(err);

      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetchRates('usdc');
  }, []);

  return {
    rates,
    loading,
    error,
    cryptoCurrencies,
    fiatCurrencies: rates.current,
    fiatCodes,
    refreshRates: fetchRates,
  };
};
