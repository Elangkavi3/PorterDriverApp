import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import ActiveTripScreen from '../screens/ActiveTripScreen';
import VehicleInspectionScreen from '../screens/VehicleInspectionScreen';
import DailyPreDutyHealthScreen from '../screens/DailyPreDutyHealthScreen';
import PickupOTPScreen from '../screens/PickupOTPScreen';
import DeliveryOTPScreen from '../screens/DeliveryOTPScreen';
import TripCompletedScreen from '../screens/TripCompletedScreen';
import DocumentVaultScreen from '../screens/DocumentVaultScreen';
import SupportCenterScreen from '../screens/SupportCenterScreen';
import RaiseTicketScreen from '../screens/RaiseTicketScreen';
import SOSFullScreen from '../screens/SOSFullScreen';
import SettingsScreen from '../screens/SettingsScreen';
import JobsScreen from '../screens/JobsScreen';
import CompletedJobScreen from '../screens/CompletedJobScreen';
import CancelledJobScreen from '../screens/CancelledJobScreen';
import WalletScreen from '../screens/WalletScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PerformanceScreen from '../screens/PerformanceScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import BankDetailsScreen from '../screens/BankDetailsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const JobsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const WalletStack = createNativeStackNavigator();

function TabDotIcon({ focused }) {
  return (
    <View
      style={[
        styles.tabIcon,
        focused ? styles.tabIconActive : styles.tabIconInactive,
      ]}
    />
  );
}

function renderTabIcon({ focused }) {
  return <TabDotIcon focused={focused} />;
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="JobDetail" component={JobDetailScreen} />
      <HomeStack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <HomeStack.Screen name="VehicleInspection" component={VehicleInspectionScreen} />
      <HomeStack.Screen name="DailyPreDutyHealth" component={DailyPreDutyHealthScreen} />
      <HomeStack.Screen name="PickupOTP" component={PickupOTPScreen} />
      <HomeStack.Screen name="DeliveryOTP" component={DeliveryOTPScreen} />
      <HomeStack.Screen name="TripCompleted" component={TripCompletedScreen} />
      <HomeStack.Screen name="DocumentVault" component={DocumentVaultScreen} />
      <HomeStack.Screen name="SupportCenter" component={SupportCenterScreen} />
      <HomeStack.Screen name="RaiseTicket" component={RaiseTicketScreen} />
      <HomeStack.Screen name="SOSFullScreen" component={SOSFullScreen} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
      <HomeStack.Screen name="Withdrawal" component={WithdrawScreen} />
    </HomeStack.Navigator>
  );
}

function WalletStackNavigator() {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: false }}>
      <WalletStack.Screen name="WalletScreen" component={WalletScreen} />
      <WalletStack.Screen name="WithdrawScreen" component={WithdrawScreen} />
      <WalletStack.Screen
        name="TransactionDetailScreen"
        component={TransactionDetailScreen}
      />
    </WalletStack.Navigator>
  );
}

function JobsStackNavigator() {
  return (
    <JobsStack.Navigator screenOptions={{ headerShown: false }}>
      <JobsStack.Screen name="JobsScreen" component={JobsScreen} />
      <JobsStack.Screen name="JobDetailScreen" component={JobDetailScreen} />
      <JobsStack.Screen name="CompletedJobScreen" component={CompletedJobScreen} />
      <JobsStack.Screen name="CancelledJobScreen" component={CancelledJobScreen} />
      <JobsStack.Screen name="ActiveTripScreen" component={ActiveTripScreen} />
      <JobsStack.Screen name="SOSFullScreen" component={SOSFullScreen} />
    </JobsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="PerformanceScreen" component={PerformanceScreen} />
      <ProfileStack.Screen name="DocumentsScreen" component={DocumentsScreen} />
      <ProfileStack.Screen name="DocumentUploadScreen" component={DocumentUploadScreen} />
      <ProfileStack.Screen name="BankDetailsScreen" component={BankDetailsScreen} />
      <ProfileStack.Screen name="SettingsScreen" component={SettingsScreen} />
      <ProfileStack.Screen name="SupportCenter" component={SupportCenterScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: renderTabIcon,
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsStackNavigator}
        options={{
          tabBarIcon: renderTabIcon,
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletStackNavigator}
        options={{
          tabBarIcon: renderTabIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: renderTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tabIconActive: {
    backgroundColor: '#2563EB',
  },
  tabIconInactive: {
    backgroundColor: '#6B7280',
  },
});

export default MainTabNavigator;
