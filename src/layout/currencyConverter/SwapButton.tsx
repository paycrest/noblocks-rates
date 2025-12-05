"use client";

import Image from "next/image";
import { useState } from "react";

interface SwapButtonProps {
  onClick: () => void;
}

export const SwapButton: React.FC<SwapButtonProps> = ({ onClick }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick();
    // reset animation state after animation completes
    setTimeout(() => {
      setIsClicked(false);
    }, 400);
  };

  return (
    <div className="flex justify-center -my-1">
      <button
        onClick={handleClick}
        className={`relative bg-white/10 p-2 !rounded-lg hover:bg-[#3C3C3E] transition-colors w-10 h-10 md:w-9 md:h-9 cursor-pointer overflow-visible ${
          isClicked ? "animate-swap-click" : ""
        }`}
      >
        {/* splash effect overlay - 3 layered animations for depth */}
        {isClicked && (
          <>
            <span className="absolute inset-0 animate-splash-1 pointer-events-none"></span>
            <span className="absolute inset-0 animate-splash-2 pointer-events-none"></span>
            <span className="absolute inset-0 animate-splash-3 pointer-events-none"></span>
          </>
        )}
        {/* icon with scaling animation - rotated 90 degrees on smaller screens */}
        <div className={`relative z-10 rotate-90 md:rotate-0 transition-transform duration-200 ${isClicked ? "animate-swap-scale" : ""}`}>
          <Image 
            src='https://res.cloudinary.com/dfkuxnesz/image/upload/v1752208869/arrow-data-transfer-horizontal-round_khq5q0.svg' 
            alt="swap" 
            width={20} 
            height={20}
          />
        </div>
      </button>
    </div>
  );
};