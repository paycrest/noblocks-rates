"use client";

/**
 * currencyconverter component
 * 
 * ============================================================================
 * modifications summary
 * ============================================================================
 * 
 * this file contains modifications to handle currency list swapping functionality.
 * 
 * changes made:
 * 1. modified handleswapwithlists() to swap dropdown lists along with currencies
 * 2. added handletofcurrencyselect() wrapper to prevent duplicate updates when swapped
 * 3. modified updaterates() to handle swapped state and prevent left dropdown changes
 * 
 * fixes:
 * - fixed bug where selecting usdc from right dropdown after swap would change left dropdown
 * - prevents left dropdown from changing its selected currency when right dropdown changes
 * - properly handles swapped state to maintain list integrity
 * 
 * ============================================================================
 */

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
import {
  getCurrencyByCountry,
  prioritizeUserCurrency,
} from "@/utils/currencyUtils";

type CurrencyConverterProps = Record<string, never>;
export const CurrencyConverter: React.FC<CurrencyConverterProps> = () => {
  const [loader, setLoader] = useState<boolean>(false);
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
    initialToCurrency.current
  );

  const [fromList, setFromList] = useState(cryptoCurrencies);
  const [toList, setToList] = useState(
    userCurrencyCode
      ? prioritizeUserCurrency(fiatCurrencies, userCurrencyCode)
      : fiatCurrencies
  );
  const [isActive, setIsActive] = useState(false);
  const [isSwapAnimating, setIsSwapAnimating] = useState(false);

  // ============================================================================
  // swap functionality - modified section
  // ============================================================================
  
  /**
   * handle swap with lists
   * 
   * changes made:
   * - modified to swap both selected currencies and their dropdown lists
   * - left dropdown now receives what was in right dropdown (fiat currencies)
   * - right dropdown now receives what was in left dropdown (stablecoins)
   * 
   * behavior:
   * - before swap: left = stablecoins (usdt, usdc), right = fiat currencies
   * - after swap: left = fiat currencies, right = stablecoins (usdt, usdc)
   * 
   * animation:
   * - triggers swap animation state for currency input animations
   * - resets animation state after 500ms
   */
  const handleSwapWithLists = async () => {
    const nextFrom = toCurrency;
    const nextTo = fromCurrency;
    
    // trigger swap animation for currency inputs
    setIsSwapAnimating(true);
    handleSwap();
    
    // reset animation after animation completes
    setTimeout(() => {
      setIsSwapAnimating(false);
    }, 500);
    
    // swap the dropdown lists themselves
    // left dropdown gets what was in right dropdown (fiat currencies)
    // right dropdown gets what was in left dropdown (stablecoins)
    const tempFromList = fromList;
    const tempToList = toList;
    
    setFromList(tempToList);
    setToList(tempFromList);
  };

  // ============================================================================
  // currency selection handlers - modified section
  // ============================================================================
  
  /**
   * handle from currency select
   * 
   * simple wrapper to update left dropdown currency selection
   */
  const handleFromCurrencySelect = (currency: Currency) => {
    setFromCurrency(currency);
  };

  /**
   * handle to currency select
   * 
   * changes made:
   * - added swap detection to prevent duplicate state updates
   * 
   * fixes:
   * - when lists are swapped, prevents calling setToCurrency here
   * - updateRates handles the state update when swapped to avoid conflicts
   * - prevents left dropdown from changing when selecting from right dropdown after swap
   */
  const handleToCurrencySelect = (currency: Currency) => {
    // check if swapped - if swapped, updateRates handles the state update
    // don't call setToCurrency here to avoid duplicate updates
    const isSwapped = fromList.length > 0 && fromList[0].type === "fiat";
    if (!isSwapped) {
      setToCurrency(currency);
    }
  };

  /**
   * update rates
   * 
   * changes made:
   * - added swap detection logic
   * - added currency existence check in current list
   * - modified to preserve swapped lists when selecting currencies
   * 
   * fixes:
   * - fixed bug where selecting usdc from right dropdown after swap would change left dropdown
   * - when swapped and selecting from right dropdown, only updates right side state
   * - prevents updating initialToCurrency.current when swapped to avoid useEffect triggering
   * - prevents left dropdown from changing its selected currency when right dropdown changes
   * 
   * swapped state handling:
   * - detects if lists are swapped (fromList has fiat currencies)
   * - when swapped and selecting from right dropdown, only calls setToCurrency directly
   * - intentionally does not update initialToCurrency.current to prevent useEffect side effects
   */
  const updateRates = async (selectedCurrency: Currency, label: string) => {
    // check if lists are swapped (from has fiat, to has stablecoins)
    const isSwapped = fromList.length > 0 && fromList[0].type === "fiat";

    // check if the selected currency is already in the current list for this position
    const currentList = label === "from" ? fromList : toList;
    const currencyExistsInList = currentList.some(
      (c: Currency) => c.code === selectedCurrency.code
    );

    // if currency exists in current list or lists are swapped, just update selection without changing lists
    if (currencyExistsInList || isSwapped) {
      if (label === "from") {
        initialFromCurrency.current = selectedCurrency;
        setFromCurrency(selectedCurrency);
      } else {
        // critical fix: for right dropdown when swapped, only update right side
        // don't update initialToCurrency.current to prevent useEffect from updating left side
        // the useEffect in useCurrencyConverter watches refs and updates both currencies
        // by only calling setToCurrency directly, we prevent the left dropdown from changing
        setToCurrency(selectedCurrency);
        // note: we intentionally don't update initialToCurrency.current when swapped
        // to prevent the useEffect from updating both currencies and changing left dropdown
      }
      return;
    }

    // otherwise, handle rate fetching and list updates as before (normal non-swapped state)
    if (label === "from" && selectedCurrency.type === "crypto") {
      const rates = await refreshRates(selectedCurrency.code.toLowerCase());
      if (!rates) {
        console.error("No rates found for the selected currency.");
        return;
      }
      setFromList(cryptoCurrencies);
      setToList(
        userCurrencyCode
          ? prioritizeUserCurrency(rates, userCurrencyCode)
          : rates
      );
      initialToCurrency.current = rates.find(
        (c: Currency) => c.code === toCurrency.code
      );
      if (!initialToCurrency.current) {
        initialToCurrency.current = rates[0];
      }
      initialFromCurrency.current = selectedCurrency;
      setFromCurrency(selectedCurrency);
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
      // normal case: from has stablecoins, to should have fiat
      setFromList(
        userCurrencyCode
          ? prioritizeUserCurrency(rates, userCurrencyCode)
          : rates
      );
      setToList(cryptoCurrencies);
      initialToCurrency.current = selectedCurrency;
      setToCurrency(selectedCurrency);
      
      const matchingFromCurrency = rates.find(
        (c: Currency) => c.code === fromCurrency.code
      );
      if (!matchingFromCurrency && rates.length > 0) {
        initialFromCurrency.current = rates[0];
        setFromCurrency(rates[0]);
      }
    }

    // handle fiat currency selection
    if (label === "from" && selectedCurrency.type === "fiat") {
      initialFromCurrency.current = selectedCurrency;
      setFromCurrency(selectedCurrency);
    }

    if (label === "to" && selectedCurrency.type === "fiat") {
      initialToCurrency.current = selectedCurrency;
      setToCurrency(selectedCurrency);
    }
  };

  /**
   * initial rates fetch
   * 
   * fetches initial currency rates on component mount
   * sets up initial currency lists (left = stablecoins, right = fiat)
   */
  const initialRatesFetch = async () => {
    try {
      const rates = await refreshRates(fromCurrency.code.toLowerCase());
      if (!rates) {
        console.error("No rates found for the selected currency.");
        return;
      }
      setFromList(cryptoCurrencies);
      setToList(
        userCurrencyCode
          ? prioritizeUserCurrency(rates, userCurrencyCode)
          : rates
      );

      initialToCurrency.current = rates.find(
        (c: Currency) => c.code === toCurrency.code
      );

      initialFromCurrency.current = fromCurrency;
      setLoader(false);
    } catch (error) {
      console.error("Error fetching initial rates:", error);
    }
  };

  const isAvailableCurrency = (currency: string) => {
    return availableCurrencies.includes(currency);
  };

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

  // update currency lists when location is loaded (only prioritize, don't force selection)
  useEffect(() => {
    if (location && userCurrencyCode && fiatCurrencies.length > 0) {
      // update the currency list to prioritize user's currency at the top
      setToList(prioritizeUserCurrency(fiatCurrencies, userCurrencyCode));
    }
  }, [location, userCurrencyCode, fiatCurrencies]);

  useEffect(() => {
    initialRatesFetch();
  }, []);

  // safe to early-return after all hooks are declared
  if (fiatCurrencies.length === 0 || cryptoCurrencies.length === 0) return null;

  return (
    <div>
      <div className="converter-card md:flex min-h-[10.4rem] border-[0.5px] border-white/10 items-center bg-converter-bg text-white px-[1rem] max-w-[55rem] rounded-[3rem] gap-3 mx-7 mt-10 md:mx-auto relative z-140 justify-self-center">
        <>
          {loader ? (
            <Loader className="spinner mx-auto mt-[1.5rem] self-center" />
          ) : (
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
