
import React from 'react';

const Slide1Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="256" height="256" rx="60" fill="url(#paint0_linear_1_2)" />
    <g filter="url(#filter0_d_1_2)">
      <rect x="40" y="60" width="176" height="136" rx="20" fill="white" fillOpacity="0.8" shapeRendering="crispEdges" />
    </g>
    <path d="M64 128L96 96L128 128L160 80L192 112" stroke="#4F46E5" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="160" cy="80" r="8" fill="#EC4899" />
    <circle cx="96" cy="96" r="8" fill="#EC4899" />
    <defs>
      <filter id="filter0_d_1_2" x="20" y="44" width="216" height="176" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="10" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.309804 0 0 0 0 0.27451 0 0 0 0 0.898039 0 0 0 0.2 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_2" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_2" result="shape" />
      </filter>
      <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A5B4FC" />
        <stop offset="1" stopColor="#F9A8D4" />
      </linearGradient>
    </defs>
  </svg>
);

export default Slide1Icon;
