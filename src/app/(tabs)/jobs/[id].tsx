import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
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
  skills: string[];
  skills_detail?: Array<{ _id: string; name: string }>;
  preferred_skills: string[];
  preferred_skills_detail?: Array<{ _id: string; name: string }>;
  description: string;
  required_experience?: number;
  contact_mail?: string;
  job_posted_date?: string;
  job_closed_date?: string;
  application_through: string;
  application_url?: string;
  created_at: string;
  email_automation?: {
    enabled: boolean;
    send_date: string;
  };
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams();
  const [app, setApp] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const fetchDetail = async () => {
    try {
      const response = await api.get<any>(`/job-applications/${id}/`);
      setApp(response.data || null);
    } catch (error) {
      console.error('Failed to fetch job details', error);
      Alert.alert('Error', 'Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [id])
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Application',
      'Are you sure you want to delete this job application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/job-applications/${id}/`);
              Alert.alert('Success', 'Application deleted successfully');
              router.back();
            } catch (error) {
              console.error('Failed to delete application', error);
              Alert.alert('Error', 'Failed to delete application');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('interview') || s.includes('sched')) return '#f59e0b';
    if (s.includes('offer') || s.includes('accept')) return '#10b981';
    if (s.includes('reject') || s.includes('decline')) return '#ef4444';
    return '#3b82f6';
  };

  const openUrl = (url: string | undefined) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => console.error("Couldn't open URL", err));
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!app) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemedText>Job application not found</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <View style={styles.headerRow}>
            <View style={styles.titleArea}>
              <ThemedText style={styles.position}>{app.position}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.company}>
                {app.company_name}
              </ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(app.status)}15` }]}>
              <ThemedText style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                {app.status_detail?.name || app.status}
              </ThemedText>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location' } as any} size={16} tintColor="#6b7280" />
              <ThemedText themeColor="textSecondary" style={styles.metaLabel}>
                {app.location}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar' } as any} size={16} tintColor="#6b7280" />
              <ThemedText themeColor="textSecondary" style={styles.metaLabel}>
                Applied {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : 'N/A'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Info Grid */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <ThemedText style={styles.sectionTitle}>Details</ThemedText>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <ThemedText themeColor="textSecondary" style={styles.infoLabel}>Experience Required</ThemedText>
            <ThemedText style={styles.infoValue}>{app.required_experience !== undefined ? `${app.required_experience} years` : 'N/A'}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText themeColor="textSecondary" style={styles.infoLabel}>Applied Through</ThemedText>
            <ThemedText style={styles.infoValue}>{app.application_through}</ThemedText>
          </View>
          
          {app.contact_mail ? (
            <View style={styles.infoRow}>
              <ThemedText themeColor="textSecondary" style={styles.infoLabel}>Contact Email</ThemedText>
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${app.contact_mail}`)}>
                <ThemedText style={[styles.infoValue, { color: '#3b82f6', textDecorationLine: 'underline' }]}>
                  {app.contact_mail}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : null}

          {app.application_url ? (
            <View style={styles.infoRow}>
              <ThemedText themeColor="textSecondary" style={styles.infoLabel}>Job Link</ThemedText>
              <TouchableOpacity onPress={() => openUrl(app.application_url)}>
                <ThemedText numberOfLines={1} style={[styles.infoValue, { color: '#3b82f6', textDecorationLine: 'underline', maxWidth: 180 }]}>
                  {app.application_url}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Skills */}
        {((app.skills_detail && app.skills_detail.length > 0) || 
          (app.preferred_skills_detail && app.preferred_skills_detail.length > 0)) && (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
            {app.skills_detail && app.skills_detail.length > 0 && (
              <View style={styles.skillsSection}>
                <ThemedText style={styles.sectionTitle}>Skills Required</ThemedText>
                <View style={styles.tagGrid}>
                  {app.skills_detail.map((sk) => (
                    <View key={sk._id} style={[styles.tag, { backgroundColor: '#3b82f615' }]}>
                      <ThemedText style={{ color: '#3b82f6', fontSize: 13, fontWeight: '500' }}>
                        {sk.name}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {app.preferred_skills_detail && app.preferred_skills_detail.length > 0 && (
              <View style={[styles.skillsSection, { marginTop: Spacing.three }]}>
                <ThemedText style={styles.sectionTitle}>Preferred Skills</ThemedText>
                <View style={styles.tagGrid}>
                  {app.preferred_skills_detail.map((sk) => (
                    <View key={sk._id} style={[styles.tag, { backgroundColor: '#8b5cf615' }]}>
                      <ThemedText style={{ color: '#8b5cf6', fontSize: 13, fontWeight: '500' }}>
                        {sk.name}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <ThemedText style={styles.sectionTitle}>Description</ThemedText>
          <View style={styles.divider} />
          <ThemedText style={styles.descriptionText}>
            {app.description || 'No description provided.'}
          </ThemedText>
        </View>

        {/* Actions Button Group */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
            onPress={() => router.push({ pathname: '/jobs/form', params: { editId: app._id } })}>
            <SymbolView name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' } as any} size={16} tintColor="#ffffff" />
            <ThemedText style={styles.btnText}>Edit</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
            onPress={handleDelete}>
            <SymbolView name={{ ios: 'trash.fill', android: 'delete', web: 'delete' } as any} size={16} tintColor="#ffffff" />
            <ThemedText style={styles.btnText}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
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
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  position: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  company: {
    fontSize: 15,
    marginTop: Spacing.one / 2,
  },
  statusBadge: {
    paddingVertical: Spacing.one / 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.1)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  metaLabel: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    marginVertical: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  skillsSection: {
    gap: Spacing.two,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tag: {
    paddingVertical: Spacing.one / 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
