import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  useColorScheme,
  Switch,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/services/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

interface AvailableSkill {
  _id: string;
  name: string;
}

interface JobStatusOption {
  _id: string;
  name: string;
  category: string;
  color: string;
}

export default function JobFormScreen() {
  const { editId } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Available options
  const [availableSkills, setAvailableSkills] = useState<AvailableSkill[]>([]);
  const [statuses, setStatuses] = useState<JobStatusOption[]>([]);

  // Form State
  const [position, setPosition] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('');
  const [requiredExperience, setRequiredExperience] = useState('0');
  const [contactMail, setContactMail] = useState('');
  const [applicationThrough, setApplicationThrough] = useState('email');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [description, setDescription] = useState('');
  
  // Multi-select state
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedPrefSkills, setSelectedPrefSkills] = useState<string[]>([]);

  // Email Automation State
  const [enableEmailAutomation, setEnableEmailAutomation] = useState(false);
  const [emailSendDate, setEmailSendDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal control
  const [skillsModalVisible, setSkillsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'skills' | 'preferred'>('skills');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [searchSkillQuery, setSearchSkillQuery] = useState('');

  useEffect(() => {
    fetchFormOptions();
    if (editId) {
      fetchJobDetails();
    }
  }, [editId]);

  const fetchFormOptions = async () => {
    setLoading(true);
    try {
      const [skillsRes, statusRes] = await Promise.all([
        api.get<any>('/job-skills'),
        api.get<any>('/job-statuses/'),
      ]);
      setAvailableSkills(skillsRes.data || []);
      const statusesList = statusRes.data || [];
      setStatuses(statusesList);
      if (statusesList.length > 0 && !editId) {
        setStatus(statusesList[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch form options', error);
      Alert.alert('Error', 'Failed to fetch available skills or statuses');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async () => {
    try {
      const response = await api.get<any>(`/job-applications/${editId}/`);
      const app = response.data;
      if (app) {
        setPosition(app.position);
        setCompanyName(app.company_name);
        setLocation(app.location);
        setAppliedDate(app.applied_date ? app.applied_date.split('T')[0] : '');
        setStatus(app.status);
        setRequiredExperience(String(app.required_experience || 0));
        setContactMail(app.contact_mail || '');
        setApplicationThrough(app.application_through || 'email');
        setApplicationUrl(app.application_url || '');
        setDescription(app.description || '');
        setSelectedSkills(app.skills || []);
        setSelectedPrefSkills(app.preferred_skills || []);
        if (app.email_automation) {
          setEnableEmailAutomation(app.email_automation.enabled);
          setEmailSendDate(app.email_automation.send_date ? app.email_automation.send_date.split('T')[0] : '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch job details for editing', error);
      Alert.alert('Error', 'Failed to load application details');
    }
  };

  const handleSave = async () => {
    if (!position || !companyName || !location || !status) {
      Alert.alert('Validation Error', 'Please fill in all required fields (*)');
      return;
    }

    setSubmitting(true);
    const payload = {
      position,
      company_name: companyName,
      location,
      applied_date: appliedDate,
      status,
      skills: selectedSkills,
      preferred_skills: selectedPrefSkills,
      description,
      required_experience: parseInt(requiredExperience, 10) || 0,
      contact_mail: contactMail,
      application_through: applicationThrough,
      application_url: applicationUrl,
    };

    try {
      if (editId) {
        await api.put(`/job-applications/${editId}/`, payload);
        Alert.alert('Success', 'Application updated successfully');
      } else {
        const response = await api.post<any>('/job-applications/', payload);
        
        if (enableEmailAutomation && emailSendDate) {
          const newAppId = response.data?._id;
          if (newAppId) {
            await api.post('/job-applications/automation/', {
              job_application: newAppId,
              application_send_date: emailSendDate,
            });
          }
        }
        Alert.alert('Success', 'Application created successfully');
      }
      router.back();
    } catch (error: any) {
      console.error('Failed to save application', error);
      const msg = error?.response?.data?.message || 'Failed to save application';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSkillSelection = (skillId: string, mode: 'skills' | 'preferred') => {
    if (mode === 'skills') {
      setSelectedSkills((prev) =>
        prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
      );
    } else {
      setSelectedPrefSkills((prev) =>
        prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
      );
    }
  };

  const filteredModalSkills = availableSkills.filter((sk) =>
    sk.name.toLowerCase().includes(searchSkillQuery.toLowerCase())
  );

  const getStatusName = (statusId: string) => {
    const s = statuses.find((st) => st._id === statusId);
    return s ? s.name : 'Select Status';
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ThemedText style={styles.formTitle}>
          {editId ? 'Edit Job Application' : 'Create Job Application'}
        </ThemedText>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Job Position *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
            placeholder="e.g. Frontend Engineer"
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={position}
            onChangeText={setPosition}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Company Name *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
            placeholder="e.g. Google"
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={companyName}
            onChangeText={setCompanyName}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Location *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
            placeholder="e.g. Mountain View, CA (Remote)"
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Applied Date *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={appliedDate}
              onChangeText={setAppliedDate}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Experience (Years)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
              placeholder="e.g. 2"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              keyboardType="numeric"
              value={requiredExperience}
              onChangeText={setRequiredExperience}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Application Status *</ThemedText>
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
            onPress={() => setStatusModalVisible(true)}>
            <ThemedText>{getStatusName(status)}</ThemedText>
            <SymbolView name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow-drop-down' } as any} size={16} tintColor={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Required Skills</ThemedText>
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
            onPress={() => {
              setModalMode('skills');
              setSkillsModalVisible(true);
            }}>
            <ThemedText>
              {selectedSkills.length > 0
                ? `${selectedSkills.length} skills selected`
                : 'Select skills'}
            </ThemedText>
            <SymbolView name={{ ios: 'plus.circle', android: 'add', web: 'add' } as any} size={16} tintColor={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Preferred Skills</ThemedText>
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
            onPress={() => {
              setModalMode('preferred');
              setSkillsModalVisible(true);
            }}>
            <ThemedText>
              {selectedPrefSkills.length > 0
                ? `${selectedPrefSkills.length} preferred skills selected`
                : 'Select preferred skills'}
            </ThemedText>
            <SymbolView name={{ ios: 'plus.circle', android: 'add', web: 'add' } as any} size={16} tintColor={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Apply Through</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
              placeholder="e.g. LinkedIn"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={applicationThrough}
              onChangeText={setApplicationThrough}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Application URL</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
            placeholder="http://..."
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            keyboardType="url"
            autoCapitalize="none"
            value={applicationUrl}
            onChangeText={setApplicationUrl}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Contact Email</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
            placeholder="hr@company.com"
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            keyboardType="email-address"
            autoCapitalize="none"
            value={contactMail}
            onChangeText={setContactMail}
          />
        </View>

        {!editId && (
          <View style={[styles.automationContainer, { backgroundColor: colors.backgroundElement }]}>
            <View style={styles.automationRow}>
              <ThemedText style={{ fontWeight: 'bold' }}>Schedule Email Automation</ThemedText>
              <Switch value={enableEmailAutomation} onValueChange={setEnableEmailAutomation} />
            </View>
            {enableEmailAutomation && (
              <View style={[styles.inputGroup, { marginTop: Spacing.two }]}>
                <ThemedText style={styles.label}>Send Date (YYYY-MM-DD)</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  value={emailSendDate}
                  onChangeText={setEmailSendDate}
                />
              </View>
            )}
          </View>
        )}

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Description</ThemedText>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' },
            ]}
            placeholder="Enter job description..."
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: '#3b82f6' }]}
          onPress={handleSave}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.submitText}>
              {editId ? 'Save Changes' : 'Create Application'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Multi-select Modal for Skills */}
      <Modal visible={skillsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Select {modalMode === 'skills' ? 'Skills' : 'Preferred Skills'}
              </ThemedText>
              <TouchableOpacity onPress={() => setSkillsModalVisible(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.searchBar,
                {
                  margin: Spacing.three,
                  backgroundColor: colors.backgroundElement,
                  color: colors.text,
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                },
              ]}
              placeholder="Search skills..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={searchSkillQuery}
              onChangeText={setSearchSkillQuery}
            />

            <FlatList
              data={filteredModalSkills}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected =
                  modalMode === 'skills'
                    ? selectedSkills.includes(item._id)
                    : selectedPrefSkills.includes(item._id);

                return (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: isDark ? '#2d3748' : '#edf2f7' }]}
                    onPress={() => toggleSkillSelection(item._id, modalMode)}>
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

      {/* Dropdown Modal for Statuses */}
      <Modal visible={statusModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '40%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Status</ThemedText>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={statuses}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: isDark ? '#2d3748' : '#edf2f7' }]}
                  onPress={() => {
                    setStatus(item._id);
                    setStatusModalVisible(false);
                  }}>
                  <ThemedText>{item.name}</ThemedText>
                  {status === item._id && (
                    <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check' } as any} size={20} tintColor="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: 60,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  automationContainer: {
    borderRadius: 10,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  automationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitButton: {
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: 'bold',
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
