import React, { memo } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

function TruckIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
    >
      <Rect
        x={3}
        y={8}
        width={11}
        height={7}
        rx={1.8}
        stroke="currentColor"
        strokeWidth={1.8}
      />
      <Path
        d="M14 10H17.4L20 12.8V15H14V10Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Circle cx={8} cy={16.8} r={1.7} stroke="currentColor" strokeWidth={1.8} />
      <Circle cx={17} cy={16.8} r={1.7} stroke="currentColor" strokeWidth={1.8} />
    </Svg>
  );
}

export default memo(TruckIcon);
