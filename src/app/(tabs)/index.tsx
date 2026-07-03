import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '@/services/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    applications: 0,
    skills: 0,
    learningPlans: 0,
    avgConfidence: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const fetchStats = async () => {
    try {
      const [appsRes, skillsRes, plansRes] = await Promise.all([
        api.get<any>('/job-applications/'),
        api.get<any>('/user-skills/'),
        api.get<any>('/learning-plans/'),
      ]);

      const appsList = appsRes.data || [];
      const skillsList = skillsRes.data || [];
      const plansList = plansRes.data || [];

      const avgConf = skillsList.length > 0
        ? Math.round(skillsList.reduce((sum: number, s: any) => sum + s.confidence, 0) / skillsList.length)
        : 0;

      setStats({
        applications: appsList.length,
        skills: skillsList.length,
        learningPlans: plansList.length,
        avgConfidence: avgConf,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleQuickAction = (route: string) => {
    // Navigate using expo router tabs
    router.push(route as any);
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
      }>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Welcome Back!
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Continue your journey towards career success
          </ThemedText>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={[
                  styles.statCard,
                  { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' },
                ]}
                onPress={() => handleQuickAction('/jobs')}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <SymbolView name={{ ios: 'briefcase.fill', android: 'work', web: 'work' } as any} size={24} tintColor="#3b82f6" />
                </View>
                <ThemedText style={styles.statVal}>{stats.applications}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                  Job Applications
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statCard,
                  { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' },
                ]}
                onPress={() => handleQuickAction('/skills')}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <SymbolView name={{ ios: 'book.fill', android: 'book', web: 'book' } as any} size={24} tintColor="#10b981" />
                </View>
                <ThemedText style={styles.statVal}>{stats.skills}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                  My Skills
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statCard,
                  { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' },
                ]}
                onPress={() => handleQuickAction('/learning')}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <SymbolView name={{ ios: 'graduationcap.fill', android: 'school', web: 'school' } as any} size={24} tintColor="#8b5cf6" />
                </View>
                <ThemedText style={styles.statVal}>{stats.learningPlans}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                  Learning Plans
                </ThemedText>
              </TouchableOpacity>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' },
                ]}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                  <SymbolView name={{ ios: 'chart.bar.fill', android: 'analytics', web: 'analytics' } as any} size={24} tintColor="#f97316" />
                </View>
                <ThemedText style={styles.statVal}>{stats.avgConfidence}%</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                  Avg Confidence
                </ThemedText>
              </View>
            </View>

            <View style={[styles.quickActionsCard, { backgroundColor: colors.backgroundElement }]}>
              <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  onPress={() => handleQuickAction('/jobs/form')}>
                  <SymbolView name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add-circle' } as any} size={32} tintColor="#3b82f6" />
                  <ThemedText style={styles.actionText}>Add Job</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.actionDesc}>
                    New application
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  onPress={() => handleQuickAction('/skills')}>
                  <SymbolView name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add-circle' } as any} size={32} tintColor="#10b981" />
                  <ThemedText style={styles.actionText}>Add Skill</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.actionDesc}>
                    Update portfolio
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  onPress={() => handleQuickAction('/learning')}>
                  <SymbolView name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add-circle' } as any} size={32} tintColor="#8b5cf6" />
                  <ThemedText style={styles.actionText}>Create Plan</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.actionDesc}>
                    Learn something
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  header: {
    marginVertical: Spacing.four,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.one,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    gap: Spacing.four,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  statVal: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  quickActionsCard: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: Spacing.three,
    alignItems: 'center',
    textAlign: 'center',
    gap: Spacing.one,
  },
  actionText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: Spacing.one,
  },
  actionDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
});
