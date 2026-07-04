import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { activityLogsAPI } from '@/services/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

interface ActivityLog {
  _id: string;
  type: string;
  message: string;
  created_at?: string;
}

const LIMIT = 20;

export default function ActivityLogScreen() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const fetchActivities = useCallback(async (currentOffset: number, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (currentOffset > 0) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await activityLogsAPI.getAll(LIMIT, currentOffset);
      const newActivities = response.data || [];
      const total = response.total_count || 0;

      if (isRefresh || currentOffset === 0) {
        setActivities(newActivities);
        setOffset(newActivities.length);
        setHasMore(newActivities.length < total);
      } else {
        setActivities((prev) => [...prev, ...newActivities]);
        const nextOffset = currentOffset + newActivities.length;
        setOffset(nextOffset);
        setHasMore(nextOffset < total);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActivities(0);
  }, [fetchActivities]);

  const handleRefresh = () => {
    fetchActivities(0, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchActivities(offset);
    }
  };

  const getActivityIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('learning plan') || t.includes('learning')) {
      return { name: { ios: 'book.fill', android: 'book', web: 'book' }, color: '#3b82f6' };
    }
    if (t.includes('skill')) {
      return { name: { ios: 'sparkles', android: 'star', web: 'star' }, color: '#10b981' };
    }
    if (t.includes('job application') || t.includes('job')) {
      return { name: { ios: 'briefcase.fill', android: 'work', web: 'work' }, color: '#8b5cf6' };
    }
    if (t.includes('learning resource') || t.includes('learning_resource')) {
      return { name: { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' }, color: '#f59e0b' };
    }
    return { name: { ios: 'clock.fill', android: 'history', web: 'history' }, color: '#6b7280' };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderItem = ({ item, index }: { item: ActivityLog; index: number }) => {
    const config = getActivityIcon(item.type);
    const isLast = index === activities.length - 1;

    return (
      <View style={styles.itemContainer}>
        {/* Timeline Line & Icon */}
        <View style={styles.timelineColumn}>
          <View style={[styles.iconCircle, { backgroundColor: `${config.color}15`, borderColor: config.color }]}>
            <SymbolView name={config.name as any} size={16} tintColor={config.color} />
          </View>
          {!isLast && <View style={[styles.timelineLine, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />}
        </View>

        {/* Content */}
        <View style={styles.contentColumn}>
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: `${config.color}20` }]}>
              <ThemedText style={[styles.badgeText, { color: config.color }]}>{item.type}</ThemedText>
            </View>
            {item.created_at && (
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(item.created_at)}
              </ThemedText>
            )}
          </View>
          <ThemedText style={styles.messageText}>{item.message}</ThemedText>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      );
    }
    if (!hasMore && activities.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <ThemedText themeColor="textSecondary" type="small">
            {"You've reached the end of the activity log"}
          </ThemedText>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <SymbolView name={{ ios: 'clock', android: 'history', web: 'history' } as any} size={48} tintColor={isDark ? '#4b5563' : '#9ca3af'} />
        <ThemedText style={styles.emptyText} themeColor="textSecondary">No activity logs found</ThemedText>
      </View>
    );
  };

  if (loading && activities.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: 40,
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 32,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: Spacing.one,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerEnd: {
    paddingVertical: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 15,
  },
});
