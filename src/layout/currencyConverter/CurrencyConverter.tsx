"use client";

import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useCurrencyRates } from "@/hooks/useCurrencyRates";
import { CurrencyInput } from "./CurrencyInput";
import { SwapButton } from "./SwapButton";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatAmount } from "@/utils";
import ExchangeView from "../exchanges/ExchangeView";
import { Currency } from "../../types/currency";
import { Loader } from "../../components/Loader";
import { availableCurrencies } from "@/data/availableCurrencies";

interface CurrencyConverterProps { }
export const CurrencyConverter: React.FC<CurrencyConverterProps> = () => {
  const [loader, setLoader] = useState<boolean>(false);
  const { fiatCurrencies, cryptoCurrencies, refreshRates } = useCurrencyRates();

  const initialFromCurrency = useRef<Currency>(
    cryptoCurrencies.find((c) => c.code === "USDT") || cryptoCurrencies[0]
  );
  const initialToCurrency = useRef<Currency>(
    fiatCurrencies.find((c) => c.code === "HUF") || fiatCurrencies[0]
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
  const [toList, setToList] = useState(fiatCurrencies);
  const [isActive, setIsActive] = useState(false);

  const handleSwapWithLists = async () => {
    handleSwap();
    try {
      if (toCurrency.type === "crypto") {
        const rates = await refreshRates(toCurrency.code.toLowerCase());
        if (!rates) {
          console.error("No rates found for the selected currency.");
          return;
        }
        setFromList(cryptoCurrencies);
        setToList(rates);
        initialToCurrency.current = rates.find(
          (c: any) => c.code === fromCurrency.code
        );

        initialFromCurrency.current = cryptoCurrencies.find(
          (c) => c.code === toCurrency.code
        )!;
      } else {
        const rates = await refreshRates(
          fromCurrency.code.toLowerCase(),
          "buyRate"
        );
        if (!rates) {
          console.error("No rates found for the selected currency.");
          return;
        }
        setFromList(rates);
        setToList(cryptoCurrencies);

        initialToCurrency.current = cryptoCurrencies.find(
          (c) => c.code === fromCurrency.code
        )!;

        initialFromCurrency.current = rates.find(
          (c: Currency) => c.code === toCurrency.code
        );
      }
    } catch (error) {
      console.error("Error refreshing rates:", error);
    }
  };

  if (fiatCurrencies.length === 0 || cryptoCurrencies.length === 0) return null;

  const initialRatesFetch = async () => {
    try {
      const rates = await refreshRates(fromCurrency.code.toLowerCase());
      if (!rates) {
        console.error("No rates found for the selected currency.");
        return;
      }
      setFromList(cryptoCurrencies);
      setToList(rates);

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
      setToList(rates);
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
      setFromList(rates);
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
    return `https://noblocks.xyz/?token=${fromCurrency.type === "crypto" ? fromCurrency.code : toCurrency.code}&currency=${toCurrency.type === "fiat" ? toCurrency.code : fromCurrency.code}&tokenAmount=${toCurrency.type === "crypto" ? toAmount : fromAmount}`;
  }

  useEffect(() => {
    initialRatesFetch();
  }, []);

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
        {isAvailableCurrency(toCurrency.code) && <div className="flex flex-col items-center justify-center mt-6 text-swap-text text-2xl cursor-pointer" onClick={() => {
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
