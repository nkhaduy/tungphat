import localFont from "next/font/local";

const montserratVietnamese = localFont({
  src: "./fonts/montserrat-vietnamese.woff2",
  variable: "--font-montserrat-vietnamese",
  display: "swap",
  style: "normal",
  weight: "100 900",
  preload: true,
  adjustFontFallback: false
});

const montserratLatin = localFont({
  src: "./fonts/montserrat-latin.woff2",
  variable: "--font-montserrat-latin",
  display: "swap",
  style: "normal",
  weight: "100 900",
  preload: true,
  adjustFontFallback: false
});

export const montserratVariables = [
  montserratVietnamese.variable,
  montserratLatin.variable
].join(" ");
