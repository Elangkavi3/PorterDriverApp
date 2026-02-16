import React, { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

function SOSIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
    >
      <Path
        d="M12 3L5 6V11.2C5 15.9 8 20.3 12 21C16 20.3 19 15.9 19 11.2V6L12 3Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8V12.6"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M12 16.1H12.01"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default memo(SOSIcon);
