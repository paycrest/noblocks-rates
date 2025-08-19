"use client";

import React from "react";
import Link from "next/link";
import Image from 'next/image';
import { usePathname } from "next/navigation";

const Header: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="w-full h-[6rem] flex flex-row items-center justify-between gap-7 py-5 px-7 md:px-20">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logo/logo.svg"
          alt="logo"
          width={120}
          height={120}
          className="w-[12rem] h-[1.32rem] object-contain cursor-pointer"
        />
        <Image src='https://res.cloudinary.com/dfkuxnesz/image/upload/v1755158461/rates-logo_eezrj7.svg' alt="hero" className="w-[4.91647rem] h-[4.91647rem]" width={120} height={120} />
      </Link>

      <Link
        href="/developers"
        className={` ${
          pathname?.includes("developers") ? "text-white" : "text-white-dull"
        } text-[1.33328rem] font-medium text-base hover:text-white active:text-white transition duration-200 ease-in-out`}
      >
        For Developers
      </Link>
    </header>
  );
};

export default Header;
