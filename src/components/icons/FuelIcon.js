import React, { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

function FuelIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
    >
      <Rect
        x={5}
        y={6}
        width={8}
        height={12}
        rx={1.8}
        stroke="currentColor"
        strokeWidth={1.8}
      />
      <Path
        d="M13 9H15.4L17.5 11.2V16.2C17.5 17.2 16.7 18 15.7 18C14.7 18 13.9 17.2 13.9 16.2V13.8"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7.2 9.6H10.8" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export default memo(FuelIcon);
