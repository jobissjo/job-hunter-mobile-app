import React, { useState, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '@/services/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

interface UserSkill {
  _id: string;
  skill: string;
  skill_detail: {
    _id: string;
    name: string;
  };
  level: string;
  confidence: number;
}

interface AvailableSkill {
  _id: string;
  name: string;
}

export default function SkillsScreen() {
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<AvailableSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form State in Modal
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [level, setLevel] = useState('beginner');
  const [confidence, setConfidence] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  // Selector Modals
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [levelPickerOpen, setLevelPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const fetchUserSkills = async () => {
    try {
      const response = await api.get<any>('/user-skills/');
      setUserSkills(response.data || []);
    } catch (error) {
      console.error('Failed to fetch user skills', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const response = await api.get<any>('/job-skills');
      setAvailableSkills(response.data || []);
    } catch (error) {
      console.error('Failed to fetch available skills', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserSkills();
      fetchAvailableSkills();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserSkills();
  };

  const handleSubmit = async () => {
    if (!selectedSkill) {
      Alert.alert('Validation Error', 'Please select a skill');
      return;
    }

    setSubmitting(true);
    const payload = {
      skill: selectedSkill,
      level,
      confidence,
    };

    try {
      if (editingSkill) {
        await api.put(`/user-skills/${editingSkill._id}/`, payload);
        Alert.alert('Success', 'Skill updated successfully!');
      } else {
        await api.post('/user-skills/', payload);
        Alert.alert('Success', 'Skill added successfully!');
      }
      setDialogOpen(false);
      resetForm();
      fetchUserSkills();
    } catch (error: any) {
      console.error('Failed to save skill', error);
      const msg = error?.response?.data?.message || 'Failed to save skill';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (skill: UserSkill) => {
    setEditingSkill(skill);
    setSelectedSkill(skill.skill);
    setLevel(skill.level);
    setConfidence(skill.confidence);
    setDialogOpen(true);
  };

  const handleDelete = (skillId: string) => {
    Alert.alert(
      'Delete Skill',
      'Are you sure you want to remove this skill from your portfolio?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/user-skills/${skillId}/`);
              Alert.alert('Success', 'Skill deleted successfully!');
              fetchUserSkills();
            } catch (error) {
              console.error('Failed to delete skill', error);
              Alert.alert('Error', 'Failed to delete skill');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingSkill(null);
    setSelectedSkill('');
    setLevel('beginner');
    setConfidence(50);
  };

  const getLevelColor = (lvl: string) => {
    const l = lvl.toLowerCase();
    if (l === 'beginner') return '#3b82f6';
    if (l === 'intermediate') return '#f59e0b';
    if (l === 'advanced') return '#10b981';
    if (l === 'expert') return '#8b5cf6';
    return '#6b7280';
  };

  const getSkillName = (id: string) => {
    const s = availableSkills.find((sk) => sk._id === id);
    return s ? s.name : 'Select a skill';
  };

  const filteredAvailableSkills = availableSkills.filter(
    (sk) =>
      sk.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !userSkills.some((us) => us.skill === sk._id && us._id !== editingSkill?._id)
  );

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={userSkills}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
          }
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View
              style={[
                styles.skillCard,
                { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' },
              ]}>
              <View style={styles.cardHeader}>
                <View style={styles.titleWrapper}>
                  <ThemedText style={styles.skillName}>{item.skill_detail?.name || 'Unknown Skill'}</ThemedText>
                  <View style={[styles.levelBadge, { backgroundColor: `${getLevelColor(item.level)}15` }]}>
                    <ThemedText style={[styles.levelText, { color: getLevelColor(item.level) }]}>
                      {item.level}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                    <SymbolView name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' } as any} size={16} tintColor="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
                    <SymbolView name={{ ios: 'trash.fill', android: 'delete', web: 'delete' } as any} size={16} tintColor="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <ThemedText type="small" themeColor="textSecondary">Confidence</ThemedText>
                  <ThemedText type="small" style={{ fontWeight: 'bold' }}>{item.confidence}%</ThemedText>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1f2937' : '#e5e7eb' }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${item.confidence}%`, backgroundColor: getLevelColor(item.level) },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <SymbolView
                name={{ ios: 'book.closed', android: 'school', web: 'school' } as any}
                size={48}
                tintColor={isDark ? '#4b5563' : '#9ca3af'}
              />
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                No skills added yet. Add skills to track your portfolio.
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#3b82f6' }]}
        onPress={() => {
          resetForm();
          setDialogOpen(true);
        }}>
        <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' } as any} size={24} tintColor="#ffffff" />
      </TouchableOpacity>

      {/* Add / Edit Skill Modal */}
      <Modal visible={dialogOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingSkill ? 'Edit Skill' : 'Add New Skill'}
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setDialogOpen(false);
                  resetForm();
                }}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Skill *</ThemedText>
                <TouchableOpacity
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      opacity: editingSkill ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => !editingSkill && setSkillPickerOpen(true)}
                  disabled={!!editingSkill}>
                  <ThemedText>{getSkillName(selectedSkill)}</ThemedText>
                  <SymbolView name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow-drop-down' } as any} size={16} tintColor={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Skill Level *</ThemedText>
                <TouchableOpacity
                  style={[
                    styles.dropdown,
                    { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' },
                  ]}
                  onPress={() => setLevelPickerOpen(true)}>
                  <ThemedText style={{ textTransform: 'capitalize' }}>{level}</ThemedText>
                  <SymbolView name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow-drop-down' } as any} size={16} tintColor={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.progressLabels}>
                  <ThemedText style={styles.label}>Confidence Level (%)</ThemedText>
                  <ThemedText style={{ fontWeight: 'bold' }}>{confidence}%</ThemedText>
                </View>
                {/* Confidence Stepper / Adjuster */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.backgroundElement }]}
                    onPress={() => setConfidence((c) => Math.max(0, c - 5))}>
                    <ThemedText style={styles.stepperText}>-</ThemedText>
                  </TouchableOpacity>
                  <View style={styles.sliderMockBg}>
                    <View style={[styles.sliderMockFill, { width: `${confidence}%`, backgroundColor: '#3b82f6' }]} />
                  </View>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.backgroundElement }]}
                    onPress={() => setConfidence((c) => Math.min(100, c + 5))}>
                    <ThemedText style={styles.stepperText}>+</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#3b82f6' }]}
                onPress={handleSubmit}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <ThemedText style={styles.submitBtnText}>
                    {editingSkill ? 'Save Details' : 'Add to Portfolio'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Available Skills List Modal */}
      <Modal visible={skillPickerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Choose Skill</ThemedText>
              <TouchableOpacity onPress={() => setSkillPickerOpen(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.searchBar,
                {
                  margin: Spacing.three,
                  backgroundColor: colors.backgroundElement,
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  color: colors.text,
                },
              ]}
              placeholder="Search skills..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredAvailableSkills}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: isDark ? '#2d3748' : '#edf2f7' }]}
                  onPress={() => {
                    setSelectedSkill(item._id);
                    setSkillPickerOpen(false);
                    setSearchQuery('');
                  }}>
                  <ThemedText>{item.name}</ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Levels list Modal */}
      <Modal visible={levelPickerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '35%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Skill Level</ThemedText>
              <TouchableOpacity onPress={() => setLevelPickerOpen(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={['beginner', 'intermediate', 'advanced', 'expert']}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: isDark ? '#2d3748' : '#edf2f7' }]}
                  onPress={() => {
                    setLevel(item);
                    setLevelPickerOpen(false);
                  }}>
                  <ThemedText style={{ textTransform: 'capitalize' }}>{item}</ThemedText>
                  {level === item && (
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
  listContainer: {
    padding: Spacing.four,
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
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  skillCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelBadge: {
    paddingVertical: Spacing.one / 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 163, 175, 0.08)',
  },
  progressSection: {
    gap: Spacing.one,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
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
    maxHeight: '75%',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
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
  searchBar: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
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
