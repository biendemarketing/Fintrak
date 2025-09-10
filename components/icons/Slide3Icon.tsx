
import React from 'react';

const Slide3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="256" height="256" rx="60" fill="url(#paint0_linear_9_2)" />
    <g filter="url(#filter0_d_9_2)">
      <circle cx="128" cy="128" r="60" fill="#4F46E5" />
      <path d="M128 68V128H173" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="128" cy="128" r="10" fill="#EC4899" />
    </g>
    <path d="M50 206L80 166L110 186L140 146L170 166L206 126" stroke="white" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <filter id="filter0_d_9_2" x="48" y="52" width="160" height="160" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="10" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.309804 0 0 0 0 0.27451 0 0 0 0 0.898039 0 0 0 0.2 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9_2" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9_2" result="shape" />
      </filter>
      <linearGradient id="paint0_linear_9_2" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A5B4FC" />
        <stop offset="1" stopColor="#F9A8D4" />
      </linearGradient>
    </defs>
  </svg>
);

export default Slide3Icon;
