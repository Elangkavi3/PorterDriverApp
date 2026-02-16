import React, { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

function ClockIcon({ size = 20, color = '#FFFFFF' }) {
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
        d="M12 7.8V12.1L15 14.1"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default memo(ClockIcon);
