import React from "react";
import Image from "next/image";
import clsx from "clsx"

interface HeroSectionProps {
  className?: string
}
const HeroSection: React.FC<HeroSectionProps> = ({ className }) => {
  return (
    <div className={clsx(className, "flex my-2 justify-center text-center flex-col items-center")}>
      <div>
        <Image src='/paycrest.svg' alt="hero" className="w-[4.91647rem] h-[4.91647rem]" width={120} height={120} />
      </div>

      <div className="text-hero-text text-3xl mt-[4.1665rem] leading-12">
        <h1 className="text-[1.6666rem]">
          Your only <span className=" text-white font-crimson text-[1.99992rem]">Stablecoin</span>
        </h1>
        <h1 className="text-[1.6666rem]" style={{ marginTop: '-10px' }}>
          rate converter to{" "}
          <span className="text-white font-crimson text-[1.99992rem]">any</span>{" "}
          <span className="text-white font-crimson text-[1.99992rem]">fiat</span>
        </h1>
      </div>
    </div>
  );
};

export default HeroSection;
