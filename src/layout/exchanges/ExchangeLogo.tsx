"use client";

import { useEffect } from 'react';

interface ExchangeLogoProps {
  src: string;
  alt: string;
  exchangeName: string;
  curveOffset: number;
  index: number;
  isHoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  tappedIndex: number | null;
  setTappedIndex: (index: number | null) => void;
}

const ExchangeLogo = ({
  src,
  alt,
  exchangeName,
  curveOffset,
  index,
  isHoveredIndex,
  setHoveredIndex,
  tappedIndex,
  setTappedIndex,
}: ExchangeLogoProps) => {
  const isActive = isHoveredIndex === index || tappedIndex === index;

  // Calculate translateX to push logos away when another is active
  const isAnotherActive = (isHoveredIndex !== null && isHoveredIndex !== index) ||
                         (tappedIndex !== null && tappedIndex !== index);
  const translateX = isAnotherActive
    ? index < (isHoveredIndex ?? tappedIndex ?? index)
      ? -20 // Push left if this logo is before the active one
      : 20 // Push right if this logo is after the active one
    : 0;

    useEffect(() => {
      if (tappedIndex === index) {
        const timer = setTimeout(() => {
          setTappedIndex(null);
          setHoveredIndex(null);
        }, 3000); // 3 second timeout
        return () => clearTimeout(timer);
      }
    }, [tappedIndex, index, setTappedIndex, setHoveredIndex]);

  const handleTap = () => {
    if (tappedIndex === index) {
      // If tapping the already active logo, deactivate it
      setTappedIndex(null);
      setHoveredIndex(null);
    } else {
      // If tapping a different logo, activate it and deactivate others
      setTappedIndex(index);
      setHoveredIndex(index);
    }
  };

  const handleMouseEnter = () => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div
      className="relative flex items-center justify-center w-20 h-20 transition-all duration-300 z-50"
      style={{
        transform: `translateY(${curveOffset}px) translateX(${translateX}px)`,
        zIndex: isActive ? 100 : 50, // Ensure active logo is on top
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleTap}
      role="button"
      tabIndex={0}
      aria-label={`View ${exchangeName} logo`}
    >
      <div className={`relative flex items-center justify-center bg-background w-[3.5rem] h-[3.5rem] rounded-full ${isActive ? 'border-2 border-white/10' : ''}`}>
        {isActive && (
          <svg
            width="39"
            height="39"
            viewBox="0 0 39 39"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 -translate-1.5 ml-1 mt-1"
          >
            <path
              d="M1 33.7955V38H5.20455M1 5.20455V1H5.20455M33.7955 1H38V5.20455M33.7955 38H38V33.7955"
              stroke="white"
              strokeWidth="1.23582"
            />
          </svg>
        )}

        <img
          src={src}
          alt={alt}
          className={`object-contain w-[2.9rem] h-[2.9rem] rounded-full transition-all duration-300 relative z-50 ${
            isActive
              ? 'scale-110 filter-none border-2 border-black'
              : 'scale-100 blur-xs'
          }`}
        />
      </div>
      {isActive && (
        <span className="absolute -bottom-10 text-lg text-[#7132F5] text-nowrap">
          {exchangeName}
        </span>
      )}
    </div>
  );
};

export default ExchangeLogo;