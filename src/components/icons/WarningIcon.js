import React, { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

function WarningIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
    >
      <Path
        d="M12 4.5L20 18.5H4L12 4.5Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M12 9.2V13.4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 16H12.01" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export default memo(WarningIcon);
