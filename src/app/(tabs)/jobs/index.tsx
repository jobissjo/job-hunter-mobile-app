import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '@/services/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

interface JobApplication {
  _id: string;
  position: string;
  company_name: string;
  location: string;
  applied_date: string;
  status: string;
  status_detail?: {
    _id: string;
    name: string;
    category: string;
    color: string;
  };
  skills?: string[];
  skills_detail?: Array<{ _id: string; name: string }>;
  application_through: string;
  created_at: string;
}

export default function JobsScreen() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApps, setFilteredApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const fetchApplications = async () => {
    try {
      const response = await api.get<any>('/job-applications/');
      const list = response.data || [];
      setApplications(list);
      applyFilters(list, searchQuery, selectedStatus);
    } catch (error) {
      console.error('Failed to fetch job applications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const applyFilters = (list: JobApplication[], query: string, status: string | null) => {
    let filtered = [...list];
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.position.toLowerCase().includes(q) ||
          app.company_name.toLowerCase().includes(q) ||
          app.location.toLowerCase().includes(q)
      );
    }
    if (status) {
      filtered = filtered.filter((app) => app.status === status);
    }
    setFilteredApps(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(applications, text, selectedStatus);
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('interview') || s.includes('sched')) return '#f59e0b'; // orange/yellow
    if (s.includes('offer') || s.includes('accept')) return '#10b981'; // green
    if (s.includes('reject') || s.includes('decline')) return '#ef4444'; // red
    return '#3b82f6'; // blue (applied/default)
  };

  const renderItem = ({ item }: { item: JobApplication }) => {
    const dateStr = item.applied_date
      ? new Date(item.applied_date).toLocaleDateString()
      : 'N/A';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' },
        ]}
        onPress={() => router.push(`/jobs/${item._id}`)}>
        <View style={styles.cardHeader}>
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.positionText}>{item.position}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.companyText}>
              {item.company_name}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}15` },
            ]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status_detail?.name || item.status}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <SymbolView
              name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location' } as any}
              size={14}
              tintColor={isDark ? '#9ca3af' : '#6b7280'}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {item.location}
            </ThemedText>
          </View>
          <View style={styles.metaRow}>
            <SymbolView
              name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar' } as any}
              size={14}
              tintColor={isDark ? '#9ca3af' : '#6b7280'}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {dateStr}
            </ThemedText>
          </View>
        </View>

        {item.skills_detail && item.skills_detail.length > 0 && (
          <View style={styles.skillsContainer}>
            {item.skills_detail.slice(0, 3).map((sk) => (
              <View key={sk._id} style={[styles.skillBadge, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                <ThemedText type="code" style={styles.skillBadgeText}>
                  {sk.name}
                </ThemedText>
              </View>
            ))}
            {item.skills_detail.length > 3 && (
              <ThemedText type="small" themeColor="textSecondary">
                +{item.skills_detail.length - 3} more
              </ThemedText>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.backgroundElement,
              color: colors.text,
              borderColor: isDark ? '#374151' : '#e5e7eb',
            },
          ]}
          placeholder="Search position, company, location..."
          placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <SymbolView
                name={{ ios: 'doc.text.magnifyingglass', android: 'search_off', web: 'search' } as any}
                size={48}
                tintColor={isDark ? '#4b5563' : '#9ca3af'}
              />
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                No job applications found
              </ThemedText>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#3b82f6' }]}
        onPress={() => router.push('/jobs/form')}>
        <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' } as any} size={24} tintColor="#ffffff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  searchBar: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 100,
    gap: Spacing.three,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.six * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  emptyText: {
    fontSize: 15,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrapper: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  positionText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  companyText: {
    fontSize: 14,
    marginTop: Spacing.one / 2,
  },
  statusBadge: {
    paddingVertical: Spacing.one / 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  skillBadge: {
    paddingVertical: Spacing.one / 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 4,
  },
  skillBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});
