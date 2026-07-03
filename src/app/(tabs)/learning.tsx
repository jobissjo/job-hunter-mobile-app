import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
  Alert,
  useColorScheme,
  RefreshControl,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '@/services/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

// Types
interface LearningStatus {
  _id: string;
  name: string;
  category: string;
  color: string;
}

interface LearningPlan {
  _id: string;
  name: string;
  description: string;
  expected_started_date: string;
  expected_completed_date: string;
  actual_started_date?: string;
  actual_completed_date?: string;
  status: string;
  status_detail?: LearningStatus;
  completed_percentage: number;
  skills?: any[];
}

interface LearningResource {
  _id: string;
  name: string;
  resource_type: string;
  resource_url: string;
  learning_management: string; // Plan ID
  status: string;
  status_detail?: LearningStatus;
  completed_percentage: number;
  description: string;
  expected_started_date: string;
  expected_completed_date: string;
}

export default function LearningScreen() {
  const [activeTab, setActiveTab] = useState<'plans' | 'resources'>('plans');
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [statuses, setStatuses] = useState<LearningStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [planFilterModalVisible, setPlanFilterModalVisible] = useState(false);

  // Modals
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  // Form Editing State
  const [editingPlan, setEditingPlan] = useState<LearningPlan | null>(null);
  const [editingResource, setEditingResource] = useState<LearningResource | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'plan' | 'resource'>('plan');

  // Plan Form State
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planExpectedStart, setPlanExpectedStart] = useState(new Date().toISOString().split('T')[0]);
  const [planExpectedEnd, setPlanExpectedEnd] = useState('');
  const [planActualStart, setPlanActualStart] = useState('');
  const [planActualEnd, setPlanActualEnd] = useState('');
  const [planStatus, setPlanStatus] = useState('');
  const [planProgress, setPlanProgress] = useState(0);

  // Resource Form State
  const [resName, setResName] = useState('');
  const [resType, setResType] = useState('video');
  const [resUrl, setResUrl] = useState('');
  const [resPlanId, setResPlanId] = useState('');
  const [resStatus, setResStatus] = useState('');
  const [resProgress, setResProgress] = useState(0);
  const [resDesc, setResDesc] = useState('');
  const [resExpectedStart, setResExpectedStart] = useState(new Date().toISOString().split('T')[0]);
  const [resExpectedEnd, setResExpectedEnd] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const fetchData = async () => {
    try {
      const [plansRes, resourcesRes, statusRes] = await Promise.all([
        api.get<any>('/learning-plans/'),
        api.get<any>('/learning-resources/'),
        api.get<any>('/learning-statuses/'),
      ]);
      setPlans(plansRes.data || []);
      setResources(resourcesRes.data || []);
      const statusList = statusRes.data || [];
      setStatuses(statusList);
      if (statusList.length > 0) {
        if (!editingPlan) setPlanStatus(statusList[0]._id);
        if (!editingResource) setResStatus(statusList[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch learning data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Plan CRUD
  const handleSavePlan = async () => {
    if (!planName || !planExpectedStart || !planStatus) {
      Alert.alert('Error', 'Please fill in all required fields (*)');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: planName,
      description: planDesc,
      expected_started_date: planExpectedStart,
      expected_completed_date: planExpectedEnd || null,
      actual_started_date: planActualStart || null,
      actual_completed_date: planActualEnd || null,
      status: planStatus,
      completed_percentage: planProgress,
    };

    try {
      if (editingPlan) {
        await api.put(`/learning-plans/${editingPlan._id}/`, payload);
        Alert.alert('Success', 'Plan updated successfully');
      } else {
        await api.post('/learning-plans/', payload);
        Alert.alert('Success', 'Plan created successfully');
      }
      setPlanModalOpen(false);
      resetPlanForm();
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to save plan';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPlan = (plan: LearningPlan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDesc(plan.description || '');
    setPlanExpectedStart(plan.expected_started_date ? plan.expected_started_date.split('T')[0] : '');
    setPlanExpectedEnd(plan.expected_completed_date ? plan.expected_completed_date.split('T')[0] : '');
    setPlanActualStart(plan.actual_started_date ? plan.actual_started_date.split('T')[0] : '');
    setPlanActualEnd(plan.actual_completed_date ? plan.actual_completed_date.split('T')[0] : '');
    setPlanStatus(plan.status);
    setPlanProgress(plan.completed_percentage);
    setPlanModalOpen(true);
  };

  const handleDeletePlan = (planId: string) => {
    Alert.alert('Delete Plan', 'Are you sure you want to delete this learning plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/learning-plans/${planId}/`);
            Alert.alert('Success', 'Learning plan deleted');
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete plan');
          }
        },
      },
    ]);
  };

  const resetPlanForm = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanDesc('');
    setPlanExpectedStart(new Date().toISOString().split('T')[0]);
    setPlanExpectedEnd('');
    setPlanActualStart('');
    setPlanActualEnd('');
    if (statuses.length > 0) setPlanStatus(statuses[0]._id);
    setPlanProgress(0);
  };

  // Resource CRUD
  const handleSaveResource = async () => {
    if (!resName || !resPlanId || !resStatus || !resUrl) {
      Alert.alert('Error', 'Please fill in all required fields (*)');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: resName,
      resource_type: resType,
      resource_url: resUrl,
      learning_management: resPlanId,
      status: resStatus,
      completed_percentage: resProgress,
      description: resDesc,
      expected_started_date: resExpectedStart,
      expected_completed_date: resExpectedEnd || null,
    };

    try {
      if (editingResource) {
        await api.put(`/learning-resources/${editingResource._id}/`, payload);
        Alert.alert('Success', 'Resource updated successfully');
      } else {
        await api.post('/learning-resources/', payload);
        Alert.alert('Success', 'Resource created successfully');
      }
      setResourceModalOpen(false);
      resetResourceForm();
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to save resource';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditResource = (res: LearningResource) => {
    setEditingResource(res);
    setResName(res.name);
    setResType(res.resource_type);
    setResUrl(res.resource_url);
    setResPlanId(res.learning_management);
    setResStatus(res.status);
    setResProgress(res.completed_percentage);
    setResDesc(res.description || '');
    setResExpectedStart(res.expected_started_date ? res.expected_started_date.split('T')[0] : '');
    setResExpectedEnd(res.expected_completed_date ? res.expected_completed_date.split('T')[0] : '');
    setResourceModalOpen(true);
  };

  const handleDeleteResource = (resId: string) => {
    Alert.alert('Delete Resource', 'Are you sure you want to delete this learning resource?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/learning-resources/${resId}/`);
            Alert.alert('Success', 'Resource deleted');
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete resource');
          }
        },
      },
    ]);
  };

  const resetResourceForm = () => {
    setEditingResource(null);
    setResName('');
    setResType('video');
    setResUrl('');
    if (plans.length > 0) setResPlanId(plans[0]._id);
    if (statuses.length > 0) setResStatus(statuses[0]._id);
    setResProgress(0);
    setResDesc('');
    setResExpectedStart(new Date().toISOString().split('T')[0]);
    setResExpectedEnd('');
  };

  const getStatusName = (id: string) => {
    const s = statuses.find((st) => st._id === id);
    return s ? s.name : 'Select Status';
  };

  const getPlanName = (id: string) => {
    const p = plans.find((pl) => pl._id === id);
    return p ? p.name : 'Select Plan';
  };

  const getResourceTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'video') return { ios: 'video.fill', android: 'play_circle', web: 'play' } as any;
    if (t === 'article') return { ios: 'doc.text.fill', android: 'article', web: 'file-text' } as any;
    if (t === 'book') return { ios: 'book.fill', android: 'book', web: 'book' } as any;
    if (t === 'course') return { ios: 'graduationcap.fill', android: 'school', web: 'school' } as any;
    return { ios: 'link', android: 'link', web: 'link' } as any;
  };

  const getResourceTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'video') return '#ef4444'; // red
    if (t === 'article') return '#3b82f6'; // blue
    if (t === 'book') return '#10b981'; // green
    if (t === 'course') return '#8b5cf6'; // purple
    return '#f59e0b'; // yellow
  };

  const filteredResources = selectedPlanFilter === 'all'
    ? resources
    : resources.filter((res) => res.learning_management === selectedPlanFilter);

  return (
    <ThemedView style={styles.container}>
      {/* Top Segment Bar */}
      <View style={[styles.segmentBar, { backgroundColor: colors.backgroundElement }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'plans' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('plans')}>
          <ThemedText style={[styles.segmentText, activeTab === 'plans' && styles.segmentTextActive]}>
            Learning Plans
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'resources' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('resources')}>
          <ThemedText style={[styles.segmentText, activeTab === 'resources' && styles.segmentTextActive]}>
            Resources
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : activeTab === 'plans' ? (
        <FlatList
          data={plans}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
              <View style={styles.cardHeader}>
                <View style={styles.headerInfo}>
                  <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
                  {item.status_detail && (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                      <ThemedText style={styles.statusText}>{item.status_detail.name}</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEditPlan(item)} style={styles.actionBtn}>
                    <SymbolView name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' } as any} size={15} tintColor="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeletePlan(item._id)} style={styles.actionBtn}>
                    <SymbolView name={{ ios: 'trash.fill', android: 'delete', web: 'delete' } as any} size={15} tintColor="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.planDesc} numberOfLines={2}>
                {item.description || 'No description provided.'}
              </ThemedText>

              <View style={styles.progressContainer}>
                <View style={styles.progressLabels}>
                  <ThemedText type="small" themeColor="textSecondary">Progress</ThemedText>
                  <ThemedText type="small" style={{ fontWeight: 'bold' }}>{item.completed_percentage}%</ThemedText>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1f2937' : '#e5e7eb' }]}>
                  <View style={[styles.progressBarFill, { width: `${item.completed_percentage}%`, backgroundColor: '#8b5cf6' }]} />
                </View>
              </View>

              <View style={styles.datesContainer}>
                <ThemedText type="small" themeColor="textSecondary">
                  Expected: {item.expected_started_date ? new Date(item.expected_started_date).toLocaleDateString() : 'N/A'} - {item.expected_completed_date ? new Date(item.expected_completed_date).toLocaleDateString() : 'N/A'}
                </ThemedText>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <SymbolView name={{ ios: 'graduationcap', android: 'school', web: 'school' } as any} size={48} tintColor={isDark ? '#4b5563' : '#9ca3af'} />
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>No learning plans found</ThemedText>
            </View>
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Plan Filter dropdown bar */}
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={[styles.filterSelector, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
              onPress={() => setPlanFilterModalVisible(true)}>
              <ThemedText style={{ fontSize: 13 }}>
                Filter: {selectedPlanFilter === 'all' ? 'All Plans' : getPlanName(selectedPlanFilter)}
              </ThemedText>
              <SymbolView name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow-drop-down' } as any} size={14} tintColor={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredResources}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[styles.listContainer, { paddingTop: 0 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerInfo}>
                    <View style={[styles.typeIconWrapper, { backgroundColor: `${getResourceTypeColor(item.resource_type)}15` }]}>
                      <SymbolView
                        name={getResourceTypeIcon(item.resource_type)}
                        size={16}
                        tintColor={getResourceTypeColor(item.resource_type)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={{ textTransform: 'capitalize' }}>
                        {item.resource_type} • {getPlanName(item.learning_management)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEditResource(item)} style={styles.actionBtn}>
                      <SymbolView name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' } as any} size={15} tintColor="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteResource(item._id)} style={styles.actionBtn}>
                      <SymbolView name={{ ios: 'trash.fill', android: 'delete', web: 'delete' } as any} size={15} tintColor="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {item.resource_url ? (
                  <TouchableOpacity onPress={() => Linking.openURL(item.resource_url)} style={styles.urlRow}>
                    <SymbolView name={{ ios: 'link', android: 'link', web: 'link' } as any} size={12} tintColor="#3b82f6" />
                    <ThemedText style={{ color: '#3b82f6', fontSize: 13, textDecorationLine: 'underline' }} numberOfLines={1}>
                      {item.resource_url}
                    </ThemedText>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <ThemedText type="small" themeColor="textSecondary">Progress</ThemedText>
                    <ThemedText type="small" style={{ fontWeight: 'bold' }}>{item.completed_percentage}%</ThemedText>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1f2937' : '#e5e7eb' }]}>
                    <View style={[styles.progressBarFill, { width: `${item.completed_percentage}%`, backgroundColor: getResourceTypeColor(item.resource_type) }]} />
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <SymbolView name={{ ios: 'link', android: 'link', web: 'link' } as any} size={48} tintColor={isDark ? '#4b5563' : '#9ca3af'} />
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>No learning resources found</ThemedText>
              </View>
            }
          />
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#3b82f6' }]}
        onPress={() => {
          if (activeTab === 'plans') {
            resetPlanForm();
            setPlanModalOpen(true);
          } else {
            resetResourceForm();
            setResourceModalOpen(true);
          }
        }}>
        <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' } as any} size={24} tintColor="#ffffff" />
      </TouchableOpacity>

      {/* Learning Plan Form Modal */}
      <Modal visible={planModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{editingPlan ? 'Edit Plan' : 'Create Learning Plan'}</ThemedText>
              <TouchableOpacity onPress={() => setPlanModalOpen(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Plan Name *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  placeholder="e.g. Master React Native"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  value={planName}
                  onChangeText={setPlanName}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Plan Status *</ThemedText>
                <TouchableOpacity
                  style={[styles.dropdown, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  onPress={() => {
                    setPickerTarget('plan');
                    setStatusPickerOpen(true);
                  }}>
                  <ThemedText>{getStatusName(planStatus)}</ThemedText>
                  <SymbolView name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow-drop-down' } as any} size={16} tintColor={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>Expected Start *</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                    value={planExpectedStart}
                    onChangeText={setPlanExpectedStart}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>Expected Completed</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                    value={planExpectedEnd}
                    onChangeText={setPlanExpectedEnd}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.progressLabels}>
                  <ThemedText style={styles.label}>Progress ({planProgress}%)</ThemedText>
                </View>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.backgroundElement }]}
                    onPress={() => setPlanProgress((p) => Math.max(0, p - 5))}>
                    <ThemedText style={styles.stepperText}>-</ThemedText>
                  </TouchableOpacity>
                  <View style={styles.sliderMockBg}>
                    <View style={[styles.sliderMockFill, { width: `${planProgress}%`, backgroundColor: '#8b5cf6' }]} />
                  </View>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.backgroundElement }]}
                    onPress={() => setPlanProgress((p) => Math.min(100, p + 5))}>
                    <ThemedText style={styles.stepperText}>+</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Description</ThemedText>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  placeholder="Plan objectives..."
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  multiline
                  numberOfLines={3}
                  value={planDesc}
                  onChangeText={setPlanDesc}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#8b5cf6' }]}
                onPress={handleSavePlan}
                disabled={submitting}>
                {submitting ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.submitBtnText}>Save Plan</ThemedText>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Learning Resource Form Modal */}
      <Modal visible={resourceModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{editingResource ? 'Edit Resource' : 'Add Learning Resource'}</ThemedText>
              <TouchableOpacity onPress={() => setResourceModalOpen(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Resource Name *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  placeholder="e.g. React Native Docs Tutorial"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  value={resName}
                  onChangeText={setResName}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>Resource Type *</ThemedText>
                  <TouchableOpacity
                    style={[styles.dropdown, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                    onPress={() => setTypePickerOpen(true)}>
                    <ThemedText style={{ textTransform: 'capitalize' }}>{resType}</ThemedText>
                    <SymbolView name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow-drop-down' } as any} size={16} tintColor={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>Associated Plan *</ThemedText>
                  <TouchableOpacity
                    style={[styles.dropdown, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                    onPress={() => setPlanPickerOpen(true)}>
                    <ThemedText numberOfLines={1}>{getPlanName(resPlanId)}</ThemedText>
                    <SymbolView name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow-drop-down' } as any} size={16} tintColor={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Resource URL *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  placeholder="https://..."
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  keyboardType="url"
                  autoCapitalize="none"
                  value={resUrl}
                  onChangeText={setResUrl}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>Status *</ThemedText>
                  <TouchableOpacity
                    style={[styles.dropdown, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                    onPress={() => {
                      setPickerTarget('resource');
                      setStatusPickerOpen(true);
                    }}>
                    <ThemedText>{getStatusName(resStatus)}</ThemedText>
                    <SymbolView name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow-drop-down' } as any} size={16} tintColor={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>Expected Start *</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                    value={resExpectedStart}
                    onChangeText={setResExpectedStart}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.progressLabels}>
                  <ThemedText style={styles.label}>Progress ({resProgress}%)</ThemedText>
                </View>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.backgroundElement }]}
                    onPress={() => setResProgress((p) => Math.max(0, p - 5))}>
                    <ThemedText style={styles.stepperText}>-</ThemedText>
                  </TouchableOpacity>
                  <View style={styles.sliderMockBg}>
                    <View style={[styles.sliderMockFill, { width: `${resProgress}%`, backgroundColor: getResourceTypeColor(resType) }]} />
                  </View>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.backgroundElement }]}
                    onPress={() => setResProgress((p) => Math.min(100, p + 5))}>
                    <ThemedText style={styles.stepperText}>+</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#3b82f6' }]}
                onPress={handleSaveResource}
                disabled={submitting}>
                {submitting ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.submitBtnText}>Save Resource</ThemedText>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Plan Filters Modal */}
      <Modal visible={planFilterModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '50%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Filter by Learning Plan</ThemedText>
              <TouchableOpacity onPress={() => setPlanFilterModalVisible(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ _id: 'all', name: 'All Plans' }, ...plans]}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: isDark ? '#2d3748' : '#edf2f7' }]}
                  onPress={() => {
                    setSelectedPlanFilter(item._id);
                    setPlanFilterModalVisible(false);
                  }}>
                  <ThemedText>{item.name}</ThemedText>
                  {selectedPlanFilter === item._id && (
                    <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check' } as any} size={20} tintColor="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Status Picker Modal */}
      <Modal visible={statusPickerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '40%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Status</ThemedText>
              <TouchableOpacity onPress={() => setStatusPickerOpen(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={statuses}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = pickerTarget === 'plan' ? planStatus === item._id : resStatus === item._id;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: isDark ? '#2d3748' : '#edf2f7' }]}
                    onPress={() => {
                      if (pickerTarget === 'plan') {
                        setPlanStatus(item._id);
                      } else {
                        setResStatus(item._id);
                      }
                      setStatusPickerOpen(false);
                    }}>
                    <ThemedText>{item.name}</ThemedText>
                    {isSelected && (
                      <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check' } as any} size={20} tintColor="#3b82f6" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Associated Plans Selector Modal */}
      <Modal visible={planPickerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '50%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Plan</ThemedText>
              <TouchableOpacity onPress={() => setPlanPickerOpen(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={plans}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: isDark ? '#2d3748' : '#edf2f7' }]}
                  onPress={() => {
                    setResPlanId(item._id);
                    setPlanPickerOpen(false);
                  }}>
                  <ThemedText>{item.name}</ThemedText>
                  {resPlanId === item._id && (
                    <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check' } as any} size={20} tintColor="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Resource Type Selector Modal */}
      <Modal visible={typePickerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '35%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Type</ThemedText>
              <TouchableOpacity onPress={() => setTypePickerOpen(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={['video', 'article', 'book', 'course', 'other']}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: isDark ? '#2d3748' : '#edf2f7' }]}
                  onPress={() => {
                    setResType(item);
                    setTypePickerOpen(false);
                  }}>
                  <ThemedText style={{ textTransform: 'capitalize' }}>{item}</ThemedText>
                  {resType === item && (
                    <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check' } as any} size={20} tintColor="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
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
  segmentBar: {
    flexDirection: 'row',
    margin: Spacing.four,
    borderRadius: 8,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#3b82f6',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  filterBar: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  filterSelector: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 200,
  },
  listContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: 100,
  },
  emptyContainer: {
    paddingVertical: Spacing.six * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  emptyText: {
    fontSize: 14,
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
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    paddingRight: Spacing.two,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 163, 175, 0.08)',
  },
  planDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  datesContainer: {
    marginTop: Spacing.one,
  },
  typeIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
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
    gap: Spacing.three,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
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
  textArea: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sliderMockBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    overflow: 'hidden',
  },
  sliderMockFill: {
    height: '100%',
    borderRadius: 4,
  },
  submitBtn: {
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderBottomWidth: 1,
  },
});
