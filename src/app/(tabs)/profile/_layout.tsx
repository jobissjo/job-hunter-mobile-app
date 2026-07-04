import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function ProfileLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const isDark = scheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: true,
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'My Profile',
        }}
      />
      <Stack.Screen
        name="activity-log"
        options={{
          title: 'Activity Log',
        }}
      />
      <Stack.Screen
        name="job-status"
        options={{
          title: 'Job Statuses',
        }}
      />
    </Stack>
  );
}
