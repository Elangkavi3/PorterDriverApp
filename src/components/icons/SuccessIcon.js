import React, { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

function SuccessIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
    >
      <Circle cx={12} cy={12} r={8.5} stroke="currentColor" strokeWidth={1.8} />
      <Path
        d="M8.2 12.2L10.8 14.8L15.8 9.8"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default memo(SuccessIcon);
