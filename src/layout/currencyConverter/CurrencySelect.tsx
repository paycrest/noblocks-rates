"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { Currency } from "@/types/currency";

interface CurrencySelectProps {
  currencies: Currency[];
  selectedCurrency: Currency;
  onSelect: (currency: Currency) => void;
  type?: "from" | "to";
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({
  currencies,
  selectedCurrency,
  onSelect,
  type = "from",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch("");
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  let filteredCurrencies = currencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(search.toLowerCase()) ||
      currency.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex px-2 py-2 items-center !rounded-[2rem] bg-white/5 hover:bg-[#3C3C3E] transition-colors min-w-[9rem] cursor-pointer"
      >
        <div className="flex w-full items-center">
          <img
            src={selectedCurrency.type !== "fiat" ? selectedCurrency.iconUrl : `https://flagcdn.com/w40/${selectedCurrency.symbol!.toLowerCase()}.png`}
            alt={selectedCurrency.code}
            className="w-8 h-8 rounded-full pr--3"
          />
          <span className="font-medium text-[1.16667rem] ml-3">
            {selectedCurrency.code}
          </span>
          <ChevronDown className="w-8 h-8 ml-auto" />
        </div>

      </button>

      {isOpen && (
        <div
          className={`emoji-element absolute top-[3.5rem] border-1 border-white/10 mt-8 w-screen max-w-[23rem] bg-converter-bg rounded-[1.6667rem] shadow-lg z-100 ${type === "from" ? "right-0" : "right-0"
            }`}
        >
          <div className="p-2 rounded-[rounded-[1rem]rem]">
            <div className="relative border-1 border-white/10 rounded-[1.2rem]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30 h-8 w-8" />
              <input
                type="text"
                placeholder="Search currency"
                className="w-full bg-transparent rounded-[rounded-[1rem] pl-14 pr-4 py-2 text-[1.16667rem] text-white placeholder-white/50 focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-[24rem] overflow-y-auto overflow-x-hidden">
            {filteredCurrencies.map((currency) => (
              <button
                key={currency.code}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#3C3C3E] transition-colors cursor-pointer"
                onClick={() => {
                  onSelect(currency);
                  setIsOpen(false);
                }}
              >

                <img
                  src={currency.type === "fiat" ? `https://flagcdn.com/w40/${currency.symbol!.toLowerCase()}.png` : currency.iconUrl}
                  alt={currency.code}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />

                <div className="flex flex-col w-full min-w-0">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-medium text-[1.16667rem] text-white whitespace-nowrap flex-shrink-0">
                        {currency.code}
                      </span>
                      <span className="text-[1.16667rem] text-white/80 truncate min-w-0">
                        {currency.name}
                      </span>
                    </div>
                    {selectedCurrency.code === currency.code && (
                      <Check className="w-4 h-4 text-white/80 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { CurrencySelect };
