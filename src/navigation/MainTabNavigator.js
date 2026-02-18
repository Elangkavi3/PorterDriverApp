import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import ActiveTripScreen from '../screens/ActiveTripScreen';
import VehicleInspectionScreen from '../screens/VehicleInspectionScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen';
import NotFitForDutyScreen from '../screens/NotFitForDutyScreen';
import VehicleUnsafeScreen from '../screens/VehicleUnsafeScreen';
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
import ProfileScreen from '../screens/ProfileScreen';
import PerformanceScreen from '../screens/PerformanceScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import BankDetailsScreen from '../screens/BankDetailsScreen';
import RoutePreferencesScreen from '../screens/RoutePreferencesScreen';
import HomeIcon from '../assets/icons/HomeIcon.svg';
import CartIcon from '../assets/icons/CartIcon.svg';
import DashboardIcon from '../assets/icons/DashboardIcon.svg';
import MenuIcon from '../assets/icons/MenuIcon.svg';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const JobsStack = createNativeStackNavigator();
const SupportStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: HomeIcon,
  Jobs: CartIcon,
  Support: MenuIcon,
  Profile: DashboardIcon,
};

function TabBarIcon({ routeName, color, size }) {
  const iconSize = size && size > 0 ? size : 22;
  const Icon = TAB_ICONS[routeName];
  if (!Icon) {
    return null;
  }
  return <Icon width={iconSize} height={iconSize} color={color} />;
}

function HomeTabBarIcon(props) {
  return <TabBarIcon routeName="Home" {...props} />;
}

function JobsTabBarIcon(props) {
  return <TabBarIcon routeName="Jobs" {...props} />;
}

function SupportTabBarIcon(props) {
  return <TabBarIcon routeName="Support" {...props} />;
}

function ProfileTabBarIcon(props) {
  return <TabBarIcon routeName="Profile" {...props} />;
}

function HomeStackNavigator({ route }) {
  const requestedRoute = route?.params?.initialRouteName;
  const initialRouteName = requestedRoute === 'ActiveTrip' ? 'ActiveTrip' : 'HomeMain';

  return (
    <HomeStack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="JobDetail" component={JobDetailScreen} />
      <HomeStack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <HomeStack.Screen name="VehicleInspection" component={VehicleInspectionScreen} />
      <HomeStack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
      <HomeStack.Screen name="NotFitForDuty" component={NotFitForDutyScreen} />
      <HomeStack.Screen name="VehicleUnsafe" component={VehicleUnsafeScreen} />
      <HomeStack.Screen name="DailyPreDutyHealth" component={DailyPreDutyHealthScreen} />
      <HomeStack.Screen name="PickupOTP" component={PickupOTPScreen} />
      <HomeStack.Screen name="DeliveryOTP" component={DeliveryOTPScreen} />
      <HomeStack.Screen name="TripCompleted" component={TripCompletedScreen} />
      <HomeStack.Screen name="DocumentVault" component={DocumentVaultScreen} />
      <HomeStack.Screen name="SupportCenter" component={SupportCenterScreen} />
      <HomeStack.Screen name="RaiseTicket" component={RaiseTicketScreen} />
      <HomeStack.Screen name="SOSFullScreen" component={SOSFullScreen} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
    </HomeStack.Navigator>
  );
}

function JobsStackNavigator() {
  return (
    <JobsStack.Navigator screenOptions={{ headerShown: false }}>
      <JobsStack.Screen name="JobsMain" component={JobsScreen} />
      <JobsStack.Screen name="JobDetailScreen" component={JobDetailScreen} />
      <JobsStack.Screen name="CompletedJobScreen" component={CompletedJobScreen} />
      <JobsStack.Screen name="CancelledJobScreen" component={CancelledJobScreen} />
      <JobsStack.Screen name="VehicleInspection" component={VehicleInspectionScreen} />
      <JobsStack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <JobsStack.Screen name="SOSFullScreen" component={SOSFullScreen} />
    </JobsStack.Navigator>
  );
}

function SupportStackNavigator() {
  return (
    <SupportStack.Navigator screenOptions={{ headerShown: false }}>
      <SupportStack.Screen name="SupportMain" component={SupportCenterScreen} />
      <SupportStack.Screen name="RaiseTicket" component={RaiseTicketScreen} />
      <SupportStack.Screen name="SOSFullScreen" component={SOSFullScreen} />
    </SupportStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="PerformanceScreen" component={PerformanceScreen} />
      <ProfileStack.Screen name="DocumentsScreen" component={DocumentsScreen} />
      <ProfileStack.Screen name="DocumentUploadScreen" component={DocumentUploadScreen} />
      <ProfileStack.Screen name="BankDetailsScreen" component={BankDetailsScreen} />
      <ProfileStack.Screen name="RoutePreferencesScreen" component={RoutePreferencesScreen} />
      <ProfileStack.Screen name="VehicleDetailsScreen" component={VehicleDetailsScreen} />
      <ProfileStack.Screen name="SettingsScreen" component={SettingsScreen} />
      <ProfileStack.Screen name="SupportCenter" component={SupportCenterScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabNavigator({ route }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();
  const homeInitialRoute = route?.params?.homeInitialRoute === 'ActiveTrip' ? 'ActiveTrip' : 'HomeMain';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: spacing[6] + spacing[3],
            paddingVertical: spacing[1],
          },
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: [styles.tabLabel, typography.caption],
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        initialParams={{ initialRouteName: homeInitialRoute }}
        options={{ tabBarLabel: t('tabs.home'), tabBarIcon: HomeTabBarIcon }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsStackNavigator}
        options={{ tabBarLabel: t('tabs.jobs'), tabBarIcon: JobsTabBarIcon }}
      />
      <Tab.Screen
        name="Support"
        component={SupportStackNavigator}
        options={{ tabBarLabel: t('tabs.support'), tabBarIcon: SupportTabBarIcon }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: t('tabs.profile'), tabBarIcon: ProfileTabBarIcon }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
  },
  tabLabel: {
    fontWeight: '700',
  },
});

export default MainTabNavigator;
