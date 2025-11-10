"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { Currency } from "@/types/currency";

interface CurrencySelectProps {
  currencies: Currency[];
  selectedCurrency: Currency;
  onSelect: (currency: Currency) => void;
  type?: "from" | "to";
  isSwapAnimating?: boolean;
  animationDelay?: number;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({
  currencies,
  selectedCurrency,
  onSelect,
  type = "from",
  isSwapAnimating = false,
  animationDelay = 0,
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
      // prevent body scroll on mobile when modal is open
      if (window.innerWidth < 768) {
        document.body.style.overflow = "hidden";
      }
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  let filteredCurrencies = currencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(search.toLowerCase()) ||
      currency.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* backdrop overlay for mobile modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[9998] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex px-2 py-2 items-center !rounded-[2rem] bg-white/5 hover:bg-[#3C3C3E] active:bg-[#2C2C2E] transition-all duration-200 min-w-[9rem] cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <div className={`flex w-full items-center ${isSwapAnimating ? "overflow-visible" : "overflow-hidden"}`}>
             <img
            src={selectedCurrency.type !== "fiat" ? selectedCurrency.iconUrl : `https://flagcdn.com/w40/${selectedCurrency.symbol!.toLowerCase()}.png`}
            alt={selectedCurrency.code}
            className={`w-8 h-8 rounded-full flex-shrink-0 ${
                isSwapAnimating 
                  ? "animate-slide-up-in" 
                  : ""
              }`}
              style={{
                animationDelay: isSwapAnimating ? `${animationDelay}ms` : '0ms',
                animationDuration: '200ms',
                animationFillMode: 'both',
              }}
          />
            <span 
              key={`${selectedCurrency.code}-text-${isSwapAnimating}`}
              className={`font-medium text-[1.16667rem] ml-3 ${
                isSwapAnimating 
                  ? "animate-slide-up-in" 
                  : ""
              }`}
              style={{
                animationDelay: isSwapAnimating ? `${animationDelay}ms` : '0ms',
                animationDuration: '400ms',
                animationFillMode: 'both',
              }}
            >
              {selectedCurrency.code}
            </span>
            <ChevronDown 
              key={`chevron-${isSwapAnimating}`}
              className={`w-8 h-8 ml-auto transition-transform duration-200 flex-shrink-0 ${
                isOpen ? "rotate-180" : ""
              } ${
                isSwapAnimating 
                  ? "animate-slide-up-in" 
                  : ""
              }`}
              style={{
                animationDelay: isSwapAnimating ? `${animationDelay}ms` : '0ms',
                animationDuration: '400ms',
                animationFillMode: 'both',
              }}
            />
          </div>
        </button>

        {isOpen && (
          <>
            {/* mobile modal - slides from bottom */}
            <div className="fixed inset-x-0 bottom-0 md:hidden z-[9999] animate-modal-slide-up">
              <div className="bg-converter-bg rounded-t-[2rem] border-t-[0.5px] border-white/10 shadow-2xl max-h-[85vh] flex flex-col">
                {/* modal header */}
                <div className="flex items-center justify-between p-4 border-b-[0.5px] border-white/10">
                  <h3 className="text-[1.333rem] font-semibold text-white">
                    Select {type === "from" ? "From" : "To"} Currency
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-white/80" />
                  </button>
                </div>

                {/* search input */}
                <div className="p-4">
                  <div className="relative border-[0.5px] border-white/10 rounded-[1.2rem] bg-white/5 focus-within:border-white/20 transition-colors">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30 h-8 w-8" />
                    <input
                      type="text"
                      placeholder="Search currency"
                      className="w-full bg-transparent rounded-[1.2rem] pl-14 pr-4 py-2.5 text-[1.16667rem] text-white placeholder-white/50 focus:outline-none"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* currency list */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
                  {filteredCurrencies.map((currency, index) => (
                    <button
                      key={currency.code}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#3C3C3E] active:bg-[#2C2C2E] rounded-lg transition-all duration-150 cursor-pointer my-1 focus:outline-none focus:bg-[#3C3C3E]"
                      onClick={() => {
                        onSelect(currency);
                        setIsOpen(false);
                      }}
                    >
                      <img
                        src={(() => {
                          const flagCode = currency.countryCode || currency.code;
                          return flagCode ? `https://flagcdn.com/w40/${flagCode.toLowerCase()}.png` : currency.iconUrl;
                        })()}
                        alt={currency.code}
                        className="w-10 h-10 rounded-full flex-shrink-0"
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
                            <Check className="w-5 h-5 text-white/80 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* desktop dropdown - regular behavior */}
            <div
              className={`emoji-element absolute top-full mt-2 border-[0.5px] border-white/10 w-[23rem] max-w-[90vw] bg-converter-bg rounded-[1.6667rem] shadow-lg z-100 overflow-hidden animate-dropdown-container opacity-0 hidden md:block ${type === "from" ? "left-0" : "right-0"
                }`}
            >
              <div className="p-2">
                <div className="relative border-[0.5px] border-white/10 rounded-[1.2rem] bg-white/5 focus-within:border-white/20 transition-colors animate-search-input">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30 h-8 w-8" />
                  <input
                    type="text"
                    placeholder="Search currency"
                    className="w-full bg-transparent rounded-[1.2rem] pl-14 pr-4 py-2.5 text-[1.16667rem] text-white placeholder-white/50 focus:outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-[24rem] overflow-y-auto overflow-x-hidden px-2 rounded-b-[1.6667rem]">
                {filteredCurrencies.map((currency, index) => (
                  <button
                    key={currency.code}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#3C3C3E] active:bg-[#2C2C2E] hover:rounded-lg transition-all duration-150 cursor-pointer my-1 focus:outline-none focus:bg-[#3C3C3E] animate-dropdown-item"
                    style={{
                      animationDelay: `${200 + index * 30}ms`,
                    }}
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
          </>
        )}
      </div>
    </>
  );
};

export { CurrencySelect };
