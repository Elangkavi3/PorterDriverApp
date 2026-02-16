import React, { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

function MapPinIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
    >
      <Path
        d="M12 20.5C15.2 16.7 17.5 13.7 17.5 10.7C17.5 7.6 15 5.2 12 5.2C9 5.2 6.5 7.6 6.5 10.7C6.5 13.7 8.8 16.7 12 20.5Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={12}
        cy={10.8}
        r={1.8}
        stroke="currentColor"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export default memo(MapPinIcon);
