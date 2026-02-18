import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useAppTheme } from '../theme/ThemeProvider';

const STEPS = ['Assigned', 'Pickup', 'Transit', 'Delivered'];

const STATE_TO_STEP = {
  ASSIGNED: 0,
  ACTIVE: 0,
  EN_ROUTE_PICKUP: 1,
  ARRIVED_PICKUP: 1,
  PICKUP_CONFIRMED: 1,
  IN_TRANSIT: 2,
  ARRIVED_DROP: 2,
  DELIVERY_CONFIRMED: 3,
  COMPLETED: 3,
  CANCELLED: 0,
};

function TripProgressBar({ currentState = 'ASSIGNED' }) {
  const { colors, typography, spacing } = useAppTheme();
  const [width, setWidth] = useState(0);

  const currentStep = useMemo(
    () =>
      Object.prototype.hasOwnProperty.call(STATE_TO_STEP, currentState)
        ? STATE_TO_STEP[currentState]
        : 0,
    [currentState],
  );

  const isCompletedTrip = currentState === 'COMPLETED';
  const svgHeight = 28;

  const coordinates = useMemo(() => {
    if (!width) {
      return [];
    }
    const leftPad = 12;
    const rightPad = 12;
    const safeWidth = Math.max(width - leftPad - rightPad, 0);
    const gap = STEPS.length > 1 ? safeWidth / (STEPS.length - 1) : 0;
    return STEPS.map((_, index) => leftPad + gap * index);
  }, [width]);

  const handleLayout = ({ nativeEvent }) => {
    setWidth(nativeEvent.layout.width);
  };

  const getNodeColor = index => {
    if (isCompletedTrip || index < currentStep) {
      return colors.success;
    }
    if (index === currentStep) {
      return colors.primary;
    }
    return colors.border;
  };

  const getLineColor = index => {
    if (isCompletedTrip || index < currentStep - 1) {
      return colors.success;
    }
    if (index === currentStep - 1) {
      return colors.primary;
    }
    return colors.border;
  };

  return (
    <View style={styles.wrapper}>
      <View onLayout={handleLayout} style={styles.svgContainer}>
        {width > 0 ? (
          <Svg width={width} height={svgHeight}>
            {coordinates.map((x, index) => {
              const isLast = index === coordinates.length - 1;
              const nextX = coordinates[index + 1];
              return (
                <React.Fragment key={`segment-${STEPS[index]}`}>
                  {!isLast ? (
                    <Line
                      x1={x}
                      y1={14}
                      x2={nextX}
                      y2={14}
                      stroke={getLineColor(index)}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  ) : null}
                  <Circle
                    cx={x}
                    cy={14}
                    r={7}
                    fill={getNodeColor(index)}
                    stroke={getNodeColor(index)}
                    strokeWidth={1.5}
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        ) : null}
      </View>

      <View style={[styles.labelsRow, { marginTop: spacing[1] }]}>
        {STEPS.map((label, index) => {
          const color =
            isCompletedTrip || index < currentStep
              ? colors.success
              : index === currentStep
                ? colors.primary
                : colors.textSecondary;
          return (
            <Text key={label} style={[styles.label, typography.caption, { color }]}> 
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  svgContainer: {
    minHeight: 28,
    width: '100%',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
});

export default TripProgressBar;
