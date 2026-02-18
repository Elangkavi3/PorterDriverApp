/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
    addEventListener: jest.fn(() => jest.fn()),
  },
}));

jest.useFakeTimers();

test('renders correctly', () => {
  let app;

  ReactTestRenderer.act(() => {
    app = ReactTestRenderer.create(<App />);
  });

  ReactTestRenderer.act(() => {
    jest.runAllTimers();
  });

  ReactTestRenderer.act(() => {
    app.unmount();
  });
});
