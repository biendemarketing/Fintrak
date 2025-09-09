
import React from 'react';
import type { CardBrand } from '../types';

interface CardBrandLogoProps {
    brand: CardBrand;
}

const CardBrandLogo: React.FC<CardBrandLogoProps> = ({ brand }) => {
    if (brand === 'Visa') {
        return <p className="text-3xl font-bold italic text-white" style={{fontFamily: 'serif'}}>VISA</p>;
    }
    if (brand === 'Mastercard') {
        return (
            <div className="flex items-center">
                <div className="w-7 h-7 rounded-full bg-red-500"></div>
                <div className="w-7 h-7 rounded-full bg-yellow-400 -ml-4"></div>
            </div>
        );
    }
     if (brand === 'American Express') {
        return <p className="text-sm font-semibold rounded bg-white/80 text-blue-800 px-2 py-1">AMEX</p>;
    }
    return <p className="text-sm font-semibold">{brand}</p>;
};

export default CardBrandLogo;
