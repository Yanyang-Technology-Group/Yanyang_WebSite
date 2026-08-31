import React from 'react';

export let IPv6Icon = ({
                           size = 24,
                           color = 'currentColor',
                           weight = 'regular',
                           className = ''
                       }) => {
    const strokeWidth = weight === 'thin' ? 1 : weight === 'light' ? 1.5 : weight === 'bold' ? 2.5 : 2;

    const width = typeof size === 'number' ? size * 1.5 : size;
    const height = size;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 300 200"
            className={className}
            fill="none"
        >
            <text
                x="150"
                y="108"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize="120"
                fontWeight={weight === 'bold' ? 900 : 700}
                fontFamily="Arial, Helvetica, sans-serif"
                letterSpacing="0"
            >
                IPv6
            </text>
        </svg>
    );
};

export let IPv4Icon = ({
                           size = 24,
                           color = 'currentColor',
                           weight = 'regular',
                           className = ''
                       }) => {
    const strokeWidth = weight === 'thin' ? 1 : weight === 'light' ? 1.5 : weight === 'bold' ? 2.5 : 2;

    const width = typeof size === 'number' ? size * 1.5 : size;
    const height = size;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 300 200"
            className={className}
            fill="none"
        >
            <text
                x="150"
                y="108"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize="120"
                fontWeight={weight === 'bold' ? 900 : 700}
                fontFamily="Arial, Helvetica, sans-serif"
                letterSpacing="0"
            >
                IPv4
            </text>
        </svg>
    );
};