'use client'

import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex w-full flex-col-reverse items-center justify-between gap-3 px-4 py-4 text-left sm:px-6 md:flex-row md:px-8">
      <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
        <Image className="hidden md:block" src={assets.logo} alt="logo" />
        <div className="hidden md:block h-7 w-px bg-gray-500/60"></div>
        <p className="py-4 text-center text-xs md:text-sm text-gray-500">
          Copyright {currentYear} © danceCode.dev All Right Reserved.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <a href="#">
          <Image src={assets.facebook_icon} alt="facebook_icon" />
        </a>
        <a href="#">
          <Image src={assets.twitter_icon} alt="twitter_icon" />
        </a>
        <a href="#">
          <Image src={assets.instagram_icon} alt="instagram_icon" />
        </a>
      </div>
    </div>
  );
};

export default Footer;
