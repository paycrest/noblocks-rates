"use client";

import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useCurrencyRates } from "@/hooks/useCurrencyRates";
import { useUserLocation } from "@/hooks/useUserLocation";
import { CurrencyInput } from "./CurrencyInput";
import { SwapButton } from "./SwapButton";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatAmount } from "@/utils";
import ExchangeView from "../exchanges/ExchangeView";
import { Currency } from "../../types/currency";
import { Loader } from "../../components/Loader";
import { availableCurrencies } from "@/data/availableCurrencies";
import {
  getCurrencyByCountry,
  prioritizeUserCurrency,
} from "@/utils/currencyUtils";

type CurrencyConverterProps = Record<string, never>;

export const CurrencyConverter: React.FC<CurrencyConverterProps> = () => {
  const [loader, setLoader] = useState(true);
  const [isSwapped, setIsSwapped] = useState(false);
  const [isSwapAnimating, setIsSwapAnimating] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const { fiatCurrencies, cryptoCurrencies, refreshRates } = useCurrencyRates();
  const { location, loading: locationLoading } = useUserLocation();

  // get user's local currency code
  const userCurrencyCode = location
    ? getCurrencyByCountry(location.countryCode)
    : null;

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
    initialToCurrency.current || fiatCurrencies[0]
  );

  const [fromList, setFromList] = useState(cryptoCurrencies);
  const [toList, setToList] = useState(
    userCurrencyCode
      ? prioritizeUserCurrency(fiatCurrencies, userCurrencyCode)
      : fiatCurrencies
  );

  /**
   * Fetch rates and setup lists on mount
   */

  useEffect(() => {
    const initialRatesFetch = async () => {
      try {
        const rates = await refreshRates(initialFromCurrency.current.code.toLowerCase());
        if (!rates) return;

        setFromList(cryptoCurrencies);
        setToList(
          userCurrencyCode
            ? prioritizeUserCurrency(rates, userCurrencyCode)
            : rates
        );
        setLoader(false);
      } catch (error) {
        console.error("Error fetching initial rates:", error);
        setLoader(false);
      }
    };

    initialRatesFetch();
  }, []);

  /**
   * Handle swapping currencies and lists cleanly
   */
  const handleSwapWithLists = async () => {
    // trigger swap animation for currency inputs
    setIsSwapAnimating(true);
    handleSwap();

    // Swap the lists too
    setFromList(toList);
    setToList(fromList);

    // Toggle visual swap state
    setIsSwapped(prev => !prev);

    setTimeout(() => {
      setIsSwapAnimating(false);
    }, 500);
  };

  /**
   * Update rates on currency select
   */
  const updateRates = useCallback(
    async (selectedCurrency: Currency, label: string) => {
      try {
        if (label === "from" && selectedCurrency.type === "crypto") {
          const rates = await refreshRates(selectedCurrency.code.toLowerCase());
          if (!rates) return;
          setFromList(cryptoCurrencies);
          setToList(
            userCurrencyCode
              ? prioritizeUserCurrency(rates, userCurrencyCode)
              : rates
          );
          setFromCurrency(selectedCurrency);
        } else if (label === "to" && selectedCurrency.type === "crypto") {
          const rates = await refreshRates(
            selectedCurrency.code.toLowerCase(),
            "buyRate"
          );
          if (!rates) return;
          setFromList(
            userCurrencyCode
              ? prioritizeUserCurrency(rates, userCurrencyCode)
              : rates
          );
          setToList(cryptoCurrencies);
          setToCurrency(selectedCurrency);
        } else {
          // fiat case
          if (label === "from") setFromCurrency(selectedCurrency);
          else setToCurrency(selectedCurrency);
        }
      } catch (err) {
        console.error("Error updating rates:", err);
      }
    },
    [refreshRates, cryptoCurrencies, userCurrencyCode, setFromCurrency, setToCurrency]
  );

  /**
   * Prioritize user’s fiat after location load
   */
  useEffect(() => {
    if (!isSwapped && userCurrencyCode && fiatCurrencies.length > 0) {
      setToList(prioritizeUserCurrency(fiatCurrencies, userCurrencyCode));
    }
  }, [location, userCurrencyCode, fiatCurrencies, isSwapped]);

  const handleFromCurrencySelect = (currency: Currency) =>
    setFromCurrency(currency);

  const handleToCurrencySelect = (currency: Currency) =>
    setToCurrency(currency);

  const isAvailableCurrency = (currency: string) =>
    availableCurrencies.includes(currency);

  const getNoblocksUrl = () => {
    const token =
      fromCurrency.type === "crypto" ? fromCurrency.code : toCurrency.code;
    const currency =
      toCurrency.type === "fiat" ? toCurrency.code : fromCurrency.code;
    const tokenAmount = toCurrency.type === "crypto" ? toAmount : fromAmount;
    return `https://noblocks.xyz/?token=${encodeURIComponent(
      token
    )}&currency=${encodeURIComponent(
      currency
    )}&tokenAmount=${encodeURIComponent(String(tokenAmount))}`;
  };

  if (loader) {
    return (
      <div className="converter-card text-white text-center py-10">
        <Loader className="spinner mx-auto" />
      </div>
    );
  }

  return (
    <div>
      <div className={`converter-card md:flex ${isSwapped ? "flex-row-reverse" : "flex-row"} min-h-[10.4rem] border-[0.5px] border-white/10 items-center bg-converter-bg text-white px-[1rem] max-w-[55rem] rounded-[3rem] gap-3 mx-7 mt-10 md:mx-auto relative z-140 justify-self-center`}>
        <>
          {!isSwapped ? (
            // Normal state: from on left, to on right
            <>
              <CurrencyInput
                label="from"
                selectedCurrency={fromCurrency}
                onCurrencySelect={handleFromCurrencySelect}
                setStablecoin={updateRates}
                amount={fromAmount}
                onAmountChange={handleFromAmountChange}
                type="from"
                currencies={fromList}
                isActive={isActive}
                setActive={setIsActive}
                isSwapAnimating={isSwapAnimating}
                animationDelay={0}
              />

              <div className="flex justify-center my-3 md:-my-1">
                <SwapButton onClick={handleSwapWithLists} />
              </div>

              <CurrencyInput
                label="to"
                selectedCurrency={toCurrency}
                onCurrencySelect={handleToCurrencySelect}
                setStablecoin={updateRates}
                amount={toAmount}
                onAmountChange={handleToAmountChange}
                type="to"
                currencies={toList}
                isActive={isActive}
                setActive={setIsActive}
                isSwapAnimating={isSwapAnimating}
                animationDelay={200}
              />
            </>
          ) : (
            // Swapped state: to on left, from on right
            <>
              <CurrencyInput
                label="to"
                selectedCurrency={toCurrency}
                onCurrencySelect={handleToCurrencySelect}
                setStablecoin={updateRates}
                amount={toAmount}
                onAmountChange={handleToAmountChange}
                type="to"
                currencies={toList}
                isActive={isActive}
                setActive={setIsActive}
                isSwapAnimating={isSwapAnimating}
                animationDelay={0}
              />

              <div className="flex justify-center my-3 md:-my-1">
                <SwapButton onClick={handleSwapWithLists} />
              </div>

              <CurrencyInput
                label="from"
                selectedCurrency={fromCurrency}
                onCurrencySelect={handleFromCurrencySelect}
                setStablecoin={updateRates}
                amount={fromAmount}
                onAmountChange={handleFromAmountChange}
                type="from"
                currencies={fromList}
                isActive={isActive}
                setActive={setIsActive}
                isSwapAnimating={isSwapAnimating}
                animationDelay={200}
              />
            </>
          )}
        </>
      </div>
      {isActive && (
        <div className="mt-4 text-center text-xl text-white/50">
          {formatAmount(fromRates)} {fromCurrency.code} ={" "}
          {formatAmount(toRates)} {toCurrency.code ?? fiatCurrencies[0].code}
          {isAvailableCurrency(
            toCurrency.type === "fiat" ? toCurrency.code : fromCurrency.code
          ) && (
              <a
                href={getNoblocksUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center mt-6 text-swap-text text-2xl cursor-pointer"
              >
                Swap on Noblocks
              </a>
            )}
          <Image
            src="/hline.svg"
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
        </div>
      )}
    </div>
  );
};
