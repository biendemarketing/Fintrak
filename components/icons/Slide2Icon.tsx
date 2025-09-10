
import React from 'react';

const Slide2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="256" height="256" rx="60" fill="url(#paint0_linear_8_2)" />
    <g filter="url(#filter0_d_8_2)">
      <rect x="65" y="55" width="126" height="80" rx="12" fill="#4F46E5" transform="rotate(15 65 55)" />
      <rect x="70" y="110" width="126" height="80" rx="12" fill="#EC4899" />
    </g>
    <path d="M90 142H120" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <path d="M90 154H140" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <circle cx="176" cy="166" r="6" fill="white" />
    <defs>
      <filter id="filter0_d_8_2" x="50.6218" y="44.2476" width="168.163" height="175.752" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="10" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.309804 0 0 0 0 0.27451 0 0 0 0 0.898039 0 0 0 0.2 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_2" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_2" result="shape" />
      </filter>
      <linearGradient id="paint0_linear_8_2" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A5B4FC" />
        <stop offset="1" stopColor="#F9A8D4" />
      </linearGradient>
    </defs>
  </svg>
);

export default Slide2Icon;
