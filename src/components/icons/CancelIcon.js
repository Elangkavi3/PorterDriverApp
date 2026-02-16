import React, { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

function CancelIcon({ size = 20, color = '#FFFFFF' }) {
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
        d="M9.2 9.2L14.8 14.8M14.8 9.2L9.2 14.8"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default memo(CancelIcon);
