import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { api } from '@/services/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

interface JobStatus {
  _id: string;
  name: string;
  category: 'start' | 'in_progress' | 'completed';
  color: string;
  user?: string;
}

const PRESETS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // orange
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
];

const CATEGORIES = [
  { id: 'start', label: 'Start' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
] as const;

export default function JobStatusScreen() {
  const [statuses, setStatuses] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<JobStatus | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'start' | 'in_progress' | 'completed'>('in_progress');
  const [selectedColor, setSelectedColor] = useState(PRESETS[0]);
  const [submitting, setSubmitting] = useState(false);

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const fetchStatuses = useCallback(async () => {
    try {
      const response = await api.get<any>('/job-statuses/');
      setStatuses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch job statuses:', error);
      Alert.alert('Error', 'Failed to fetch job statuses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatuses();
  }, [fetchStatuses]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatuses();
  };

  const openAddModal = () => {
    setEditingStatus(null);
    setName('');
    setCategory('in_progress');
    setSelectedColor(PRESETS[0]);
    setModalOpen(true);
  };

  const openEditModal = (status: JobStatus) => {
    setEditingStatus(status);
    setName(status.name);
    setCategory(status.category);
    setSelectedColor(status.color);
    setModalOpen(true);
  };

  const validateCategory = (cat: 'start' | 'in_progress' | 'completed'): boolean => {
    if (cat === 'in_progress') return true;

    // Check if another status already exists in this category
    const duplicate = statuses.find(
      (s) => s.category === cat && (!editingStatus || s._id !== editingStatus._id)
    );

    if (duplicate) {
      Alert.alert(
        'Validation Error',
        `Only one status can be in the "${cat === 'start' ? 'Start' : 'Completed'}" category. "${duplicate.name}" is already set as the ${cat} status.`
      );
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a status name');
      return;
    }

    if (!validateCategory(category)) {
      return;
    }

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      category,
      color: selectedColor,
    };

    try {
      if (editingStatus) {
        await api.put(`/job-statuses/${editingStatus._id}/`, payload);
        Alert.alert('Success', 'Status updated successfully');
      } else {
        await api.post('/job-statuses/', payload);
        Alert.alert('Success', 'Status created successfully');
      }
      setModalOpen(false);
      fetchStatuses();
    } catch (error: any) {
      console.error('Failed to save status:', error);
      const msg = error?.response?.data?.message || 'Failed to save status';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (status: JobStatus) => {
    Alert.alert(
      'Delete Status',
      `Are you sure you want to delete the status "${status.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/job-statuses/${status._id}/`);
              Alert.alert('Success', 'Status deleted successfully');
              fetchStatuses();
            } catch (error: any) {
              console.error('Failed to delete status:', error);
              const msg = error?.response?.data?.message || 'Failed to delete status';
              Alert.alert('Error', msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (cat: string) => {
    if (cat === 'start') return '#3b82f6';
    if (cat === 'completed') return '#10b981';
    return '#8b5cf6';
  };

  const renderItem = ({ item }: { item: JobStatus }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
        <View style={styles.cardInfo}>
          {/* Status Color indicator and Name */}
          <View style={styles.statusTitleRow}>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <ThemedText style={styles.statusName}>{item.name}</ThemedText>
          </View>

          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(item.category)}20` }]}>
            <ThemedText style={[styles.categoryBadgeText, { color: getCategoryColor(item.category) }]}>
              {item.category.replace('_', ' ')}
            </ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
            <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' } as any} size={18} tintColor="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' } as any} size={18} tintColor="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <SymbolView name={{ ios: 'tag', android: 'sell', web: 'sell' } as any} size={48} tintColor={isDark ? '#4b5563' : '#9ca3af'} />
        <ThemedText style={styles.emptyText} themeColor="textSecondary">No job statuses configured</ThemedText>
      </View>
    );
  };

  if (loading && statuses.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={statuses}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />
        }
        ListEmptyComponent={renderEmpty}
      />

      {/* Floating Add Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' } as any} size={24} tintColor="#ffffff" />
      </TouchableOpacity>

      {/* Add / Edit Status Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingStatus ? 'Edit Job Status' : 'Add Job Status'}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Status Name *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  placeholder="e.g. Applied, Tech Interview"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Category Picker */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Category *</ThemedText>
                <View style={styles.categoryTabs}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const catColor = getCategoryColor(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryTab,
                          { borderColor: isDark ? '#374151' : '#e5e7eb' },
                          isSelected && { backgroundColor: `${catColor}20`, borderColor: catColor },
                        ]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <ThemedText
                          style={[
                            styles.categoryTabText,
                            isSelected && { color: catColor, fontWeight: 'bold' },
                          ]}
                        >
                          {cat.label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Color Preset Picker */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Color Dot *</ThemedText>
                <View style={styles.colorPalette}>
                  {PRESETS.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          isSelected && styles.colorOptionSelected,
                        ]}
                        onPress={() => setSelectedColor(color)}
                      >
                        {isSelected && (
                          <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' } as any} size={14} tintColor="#ffffff" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#3b82f6' }]}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <ThemedText style={styles.submitBtnText}>
                    {editingStatus ? 'Update Status' : 'Save Status'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 100,
    gap: Spacing.three,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 150,
  },
  emptyText: {
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(156, 163, 175, 0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalForm: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  inputGroup: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  categoryTab: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabText: {
    fontSize: 13,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  submitBtn: {
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
