"use client";

import { useEffect, useRef, useState } from "react";
import { Currency } from "@/types/currency";
import { CurrencySelect } from "./CurrencySelect";
import { useCurrencyRates } from "@/hooks/useCurrencyRates";
import { ChangeEvent } from "react";

interface CurrencyInputProps {
  label: string;
  selectedCurrency: Currency;
  onCurrencySelect: (currency: Currency) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  type: "from" | "to";
  currencies: Currency[];
  isActive: boolean;
  setActive: (active: boolean) => void;
  setStablecoin?: (selectedCurrency: Currency, label: string) => void;
  isSwapAnimating?: boolean;
  animationDelay?: number;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  selectedCurrency,
  onCurrencySelect,
  amount,
  onAmountChange,
  type,
  currencies,
  isActive,
  setActive,
  setStablecoin,
  isSwapAnimating = false,
  animationDelay = 0,
}: CurrencyInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState(amount);

  const updateCurrency = (currency: Currency) => {
    setStablecoin?.(currency, label);
    onCurrencySelect(currency);
  };

  const formatNumber = (num: string): string => {
    const parts = num.replace(/,/g, "").split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  useEffect(() => {
    setDisplayValue(formatNumber(amount));
  }, [amount]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value.replace(/,/g, "");

    const sanitizedValue = rawValue.replace(/[^0-9.]/g, "");
    const parts = sanitizedValue.split(".");
    if (parts.length > 2) return; // Prevent multiple decimals

    // Format integer part with commas for display
    let formattedValue = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (parts.length === 2) {
      formattedValue += "." + parts[1];
    }

    const selectionStart = input.selectionStart || 0;
    const charsBeforeCursor = input.value
      .slice(0, selectionStart)
      .replace(/,/g, "");
    let newCursorPos = formattedValue.length;

    let j = 0,
      i = 0;
    while (i < charsBeforeCursor.length && j < formattedValue.length) {
      if (charsBeforeCursor[i] === formattedValue[j]) {
        i++;
      }
      j++;
    }
    newCursorPos = j;

    setDisplayValue(formattedValue);
    onAmountChange(sanitizedValue);
    setHasTyped(true);
    setActive(true);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  useEffect(() => {
    if (!amount) {
      setActive(false);
      setHasTyped(false);
    }
  }, [amount, setActive]);

  return (
    <div
      className={`
        rounded-[2.2rem] p-[0.33332rem] 
        ${
          isActive || isFocused
            ? "bg-gradient-to-br from-[#5c462e] to-[#402d50]"
            : "bg-zinc-800"
        }
        transition-all duration-300 
      `}
    >
      <div className="bg-[#141414] rounded-[1.95rem] p-4 border border-white/5">
        <div
          className={`${
            type === "from"
              ? "flex md:justify-start justify-end"
              : "flex justify-end md:justify-start"
          } mb-2`}
        >
          <label className="text-[1.16667rem] text-white/50 leading-[2rem]">{label}</label>
        </div>
        <div
          className={`flex justify-between gap-4 ${
            type === "from"
              ? "md:flex-row flex-row-reverse"
              : "flex-row-reverse"
          }`}
        >
          <CurrencySelect
            currencies={currencies}
            selectedCurrency={selectedCurrency}
            onSelect={updateCurrency}
            type={type}
            isSwapAnimating={isSwapAnimating}
            animationDelay={animationDelay}
          />
          <input
            value={displayValue}
            onChange={(e) => {
              handleChange(e);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => !hasTyped && setIsFocused(false)}
            ref={inputRef}
            placeholder="0"
            className={`bg-transparent w-full focus:outline-none placeholder-white/50 text-[2rem] ${
              type === "from" ? "md:text-right text-left" : "text-left"
            }`}
            min="0"
            step="any"
          />
        </div>
      </div>
    </div>
  );
};
