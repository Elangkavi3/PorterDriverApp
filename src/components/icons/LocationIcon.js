import React, { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

function LocationIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
    >
      <Path
        d="M12 21C15.5 17.8 18 14.8 18 11.5C18 8.2 15.3 5.5 12 5.5C8.7 5.5 6 8.2 6 11.5C6 14.8 8.5 17.8 12 21Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={12}
        cy={11.5}
        r={2.2}
        stroke="currentColor"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export default memo(LocationIcon);
