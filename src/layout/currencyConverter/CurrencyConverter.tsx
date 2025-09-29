"use client";

import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useCurrencyRates } from "@/hooks/useCurrencyRates";
import { useUserLocation } from "@/hooks/useUserLocation";
import { CurrencyInput } from "./CurrencyInput";
import { SwapButton } from "./SwapButton";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatAmount } from "@/utils";
import ExchangeView from "../exchanges/ExchangeView";
import { Currency } from "../../types/currency";
import { Loader } from "../../components/Loader";
import { availableCurrencies } from "@/data/availableCurrencies";
import { getCurrencyByCountry, prioritizeUserCurrency } from "@/utils/currencyUtils";

type CurrencyConverterProps = Record<string, never>;
export const CurrencyConverter: React.FC<CurrencyConverterProps> = () => {
  const [loader, setLoader] = useState<boolean>(false);
  const { fiatCurrencies, cryptoCurrencies, refreshRates } = useCurrencyRates();
  const { location, loading: locationLoading } = useUserLocation();

  // Get user's local currency code
  const userCurrencyCode = location ? getCurrencyByCountry(location.countryCode) : null;
  
  const initialFromCurrency = useRef<Currency>(
    cryptoCurrencies.find((c) => c.code === "USDT") || cryptoCurrencies[0]
  );
  const initialToCurrency = useRef<Currency>(
    fiatCurrencies.find((c) => c.code === userCurrencyCode) || 
    fiatCurrencies.find((c) => c.code === "USD") || 
    fiatCurrencies[0]
  );

  const {
    fromCurrency,
    toCurrency,
    fromAmount,
    toAmount,
    toRates,
    fromRates,
    setFromCurrency,
    setToCurrency,
    handleFromAmountChange,
    handleToAmountChange,
    handleSwap,
  } = useCurrencyConverter(
    initialFromCurrency.current,
    initialToCurrency.current
  );

  const [fromList, setFromList] = useState(cryptoCurrencies);
  const [toList, setToList] = useState(
    userCurrencyCode ? prioritizeUserCurrency(fiatCurrencies, userCurrencyCode) : fiatCurrencies
  );
  const [isActive, setIsActive] = useState(false);

  const handleSwapWithLists = async () => {
    const nextFrom = toCurrency;
    const nextTo = fromCurrency;
    handleSwap();
    try {
      if (nextFrom.type === "crypto") {
        const rates = await refreshRates(nextFrom.code.toLowerCase());
        if (!rates) {
          console.error("No rates found for the selected currency.");
          return;
        }
        setFromList(cryptoCurrencies);
        setToList(userCurrencyCode ? prioritizeUserCurrency(rates, userCurrencyCode) : rates);
        initialToCurrency.current = rates.find((c: any) => c.code === nextTo.code);
        initialFromCurrency.current = cryptoCurrencies.find((c) => c.code === nextFrom.code)!;
      } else {
        const rates = await refreshRates(nextTo.code.toLowerCase(), "buyRate");
        if (!rates) {
          console.error("No rates found for the selected currency.");
          return;
        }
        setFromList(userCurrencyCode ? prioritizeUserCurrency(rates, userCurrencyCode) : rates);
        setToList(cryptoCurrencies);

        // After swap: to = crypto (nextTo), from = fiat (nextFrom)
        initialToCurrency.current = cryptoCurrencies.find((c) => c.code === nextTo.code)!;
        initialFromCurrency.current = rates.find((c: Currency) => c.code === nextFrom.code);
      }
    } catch (error) {
      console.error("Error refreshing rates:", error);
    }
  };


  const initialRatesFetch = async () => {
    try {
      const rates = await refreshRates(fromCurrency.code.toLowerCase());
      if (!rates) {
        console.error("No rates found for the selected currency.");
        return;
      }
      setFromList(cryptoCurrencies);
      setToList(userCurrencyCode ? prioritizeUserCurrency(rates, userCurrencyCode) : rates);

      initialToCurrency.current = rates.find((c: Currency) => c.code === toCurrency.code);

      initialFromCurrency.current = fromCurrency;
      setLoader(false);
    } catch (error) {
      console.error("Error fetching initial rates:", error);
    }
  };

  const updateRates = async (selectedCurrency: Currency, label: string) => {

    if (label === "from" && selectedCurrency.type === "crypto") {
      const rates = await refreshRates(selectedCurrency.code.toLowerCase());
      if (!rates) {
        console.error("No rates found for the selected currency.");
        return;
      }
      setFromList(cryptoCurrencies);
      setToList(userCurrencyCode ? prioritizeUserCurrency(rates, userCurrencyCode) : rates);
      initialToCurrency.current = rates.find((c: Currency) => c.code === toCurrency.code);
      if (!initialToCurrency.current) {
        initialToCurrency.current = rates[0];
      }
      initialFromCurrency.current = selectedCurrency;
    }

    if (label === "to" && selectedCurrency.type === "crypto") {
      const rates = await refreshRates(
        selectedCurrency.code.toLowerCase(),
        "buyRate"
      );
      if (!rates) {
        console.error("No rates found for the selected currency.");
        return;
      }
      setFromList(userCurrencyCode ? prioritizeUserCurrency(rates, userCurrencyCode) : rates);
      setToList(cryptoCurrencies);
      initialFromCurrency.current = rates.find(
        (c: Currency) => c.code === fromCurrency.code
      );
      if (!initialFromCurrency.current) {
        initialFromCurrency.current = rates[0];
      }
      initialToCurrency.current = selectedCurrency;
    }
  };

  const isAvailableCurrency = (currency: string) => {
    return availableCurrencies.includes(currency);
  }

  const getNoblocksUrl = () => {
    const token = fromCurrency.type === "crypto" ? fromCurrency.code : toCurrency.code;
    const currency = toCurrency.type === "fiat" ? toCurrency.code : fromCurrency.code;
    const tokenAmount = toCurrency.type === "crypto" ? toAmount : fromAmount;
    return `https://noblocks.xyz/?token=${encodeURIComponent(token)}&currency=${encodeURIComponent(currency)}&tokenAmount=${encodeURIComponent(String(tokenAmount))}`;
  }

  // Update currency lists when location is loaded (only prioritize, don't force selection)
  useEffect(() => {
    if (location && userCurrencyCode && fiatCurrencies.length > 0) {
      // Update the currency list to prioritize user's currency at the top
      setToList(prioritizeUserCurrency(fiatCurrencies, userCurrencyCode));
    }
  }, [location, userCurrencyCode, fiatCurrencies]);

  useEffect(() => {
    initialRatesFetch();
  }, []);

  // Safe to early-return after all hooks are declared
  if (fiatCurrencies.length === 0 || cryptoCurrencies.length === 0) return null;

  return (
    <div>
      <div className="md:flex min-h-[10.4rem] border-1 border-white/10 items-center bg-converter-bg text-white p-[.6rem] max-w-[55rem] rounded-[2.8rem] gap-3 mx-7 mt-10 md:mx-auto relative z-140 justify-self-center">
        <>
          {loader ? (
            <Loader className="spinner mx-auto mt-[1.5rem] self-center" />
          ) : (
            <>
              <CurrencyInput
                label="from"
                selectedCurrency={fromCurrency}
                onCurrencySelect={setFromCurrency}
                setStablecoin={updateRates}
                amount={fromAmount}
                onAmountChange={handleFromAmountChange}
                type="from"
                currencies={fromList}
                isActive={isActive}
                setActive={setIsActive}
              />

              <div className="flex justify-center -my-1">
                <SwapButton onClick={handleSwapWithLists} />
              </div>

              <CurrencyInput
                label="to"
                selectedCurrency={toCurrency}
                onCurrencySelect={setToCurrency}
                setStablecoin={updateRates}
                amount={toAmount}
                onAmountChange={handleToAmountChange}
                type="to"
                currencies={toList}
                isActive={isActive}
                setActive={setIsActive}
              />
            </>
          )}
        </>
      </div>
      {isActive && <div className="mt-4 text-center text-xl text-white/50">
        {formatAmount(fromRates)} {fromCurrency.code} ={" "}
        {formatAmount(toRates)} {toCurrency.code ?? fiatCurrencies[0].code}
        {isAvailableCurrency(toCurrency.type === "fiat" ? toCurrency.code : fromCurrency.code) && <div className="flex flex-col items-center justify-center mt-6 text-swap-text text-2xl cursor-pointer" onClick={() => {
          window.open(getNoblocksUrl(), "_blank");
        }}>Swap on Noblocks</div>}
        <Image
          src='/hline.svg'
          alt="Hline"
          width={120}
          height={120}
          className="w-2 h-52 lg:h-52 xl:h-60 md:h-60 mx-auto"
        />
        <p className="text-center text-lg text-white/50 mb-2">
          Aggregated from
        </p>
        <div className="mx-auto">
          <ExchangeView />
        </div>
      </div>}
    </div>
  );
};
