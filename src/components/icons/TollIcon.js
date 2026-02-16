import React, { memo } from 'react';
import Svg, { Line, Path } from 'react-native-svg';

function TollIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
    >
      <Path
        d="M4 18V12L8 8H16L20 12V18"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={7.5} y1={18} x2={7.5} y2={12.2} stroke="currentColor" strokeWidth={1.8} />
      <Line x1={12} y1={18} x2={12} y2={12.2} stroke="currentColor" strokeWidth={1.8} />
      <Line x1={16.5} y1={18} x2={16.5} y2={12.2} stroke="currentColor" strokeWidth={1.8} />
    </Svg>
  );
}

export default memo(TollIcon);
