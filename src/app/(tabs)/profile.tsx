import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  useColorScheme,
  Linking,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  profile?: {
    bio: string;
    resume: string;
    profile_picture?: string;
  };
  social_links?: {
    linkedin: string;
    github: string;
    twitter: string;
  };
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [resume, setResume] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');

  // Password Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const fetchProfile = async () => {
    try {
      const response = await api.get<any>('/users/me/');
      const data = response.data;
      setProfile(data);
      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhoneNumber(data.phone_number || '');
        setBio(data.profile?.bio || '');
        setResume(data.profile?.resume || '');
        setLinkedin(data.social_links?.linkedin || '');
        setGithub(data.social_links?.github || '');
        setTwitter(data.social_links?.twitter || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleUpdateProfile = async () => {
    if (!firstName || !lastName || !phoneNumber) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setSubmitting(true);
    const payload = {
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      bio,
      resume,
      social_links: {
        linkedin,
        github,
        twitter,
      },
    };

    try {
      await api.put('/users/update-profile/', payload);
      Alert.alert('Success', 'Profile updated successfully!');
      setEditModalOpen(false);
      fetchProfile();
    } catch (error: any) {
      console.error('Failed to update profile', error);
      const msg = error?.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/users/change-password/', {
        current_password: oldPassword,
        new_password: newPassword,
      });
      Alert.alert('Success', 'Password changed successfully!');
      setPasswordModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Failed to change password', error);
      const msg = error?.response?.data?.message || 'Failed to change password';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const openSocialLink = (url: string | undefined) => {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(fullUrl).catch((err) => console.error("Couldn't open URL", err));
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
        {/* Profile Card Header */}
        <View style={[styles.profileCard, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <View style={[styles.avatar, { backgroundColor: isDark ? '#3b82f630' : '#3b82f615' }]}>
            <SymbolView name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'person' } as any} size={64} tintColor="#3b82f6" />
          </View>
          <ThemedText style={styles.name}>{profile?.first_name} {profile?.last_name}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.email}>{profile?.email}</ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
            <ThemedText style={styles.roleText}>{profile?.role}</ThemedText>
          </View>
        </View>

        {/* Bio Section */}
        <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <ThemedText style={styles.sectionTitle}>About Me</ThemedText>
          <View style={styles.divider} />
          <ThemedText style={styles.bioText}>
            {profile?.profile?.bio || 'No bio written yet. Click Edit Profile to add one!'}
          </ThemedText>
        </View>

        {/* Contact & Portfolio */}
        <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <ThemedText style={styles.sectionTitle}>Contact & Resume</ThemedText>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <ThemedText themeColor="textSecondary">Phone Number</ThemedText>
            <ThemedText style={styles.infoVal}>{profile?.phone_number || 'N/A'}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText themeColor="textSecondary">Resume</ThemedText>
            {profile?.profile?.resume ? (
              <TouchableOpacity onPress={() => openSocialLink(profile.profile?.resume)}>
                <ThemedText style={{ color: '#3b82f6', textDecorationLine: 'underline', fontWeight: 'bold' }}>
                  Open Resume
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText>No resume uploaded</ThemedText>
            )}
          </View>
        </View>

        {/* Social Links */}
        {(profile?.social_links?.linkedin || profile?.social_links?.github || profile?.social_links?.twitter) ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <ThemedText style={styles.sectionTitle}>Social Profiles</ThemedText>
            <View style={styles.divider} />
            
            {profile?.social_links?.linkedin ? (
              <TouchableOpacity onPress={() => openSocialLink(profile.social_links?.linkedin)} style={styles.socialRow}>
                <SymbolView name={{ ios: 'link', android: 'link', web: 'link' } as any} size={16} tintColor="#0077b5" />
                <ThemedText style={styles.socialLabel}>LinkedIn</ThemedText>
              </TouchableOpacity>
            ) : null}

            {profile?.social_links?.github ? (
              <TouchableOpacity onPress={() => openSocialLink(profile.social_links?.github)} style={styles.socialRow}>
                <SymbolView name={{ ios: 'link', android: 'link', web: 'link' } as any} size={16} tintColor={isDark ? '#ffffff' : '#333333'} />
                <ThemedText style={styles.socialLabel}>GitHub</ThemedText>
              </TouchableOpacity>
            ) : null}

            {profile?.social_links?.twitter ? (
              <TouchableOpacity onPress={() => openSocialLink(profile.social_links?.twitter)} style={styles.socialRow}>
                <SymbolView name={{ ios: 'link', android: 'link', web: 'link' } as any} size={16} tintColor="#1da1f2" />
                <ThemedText style={styles.socialLabel}>Twitter</ThemedText>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.buttonsGroup}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#3b82f6' }]}
            onPress={() => setEditModalOpen(true)}>
            <SymbolView name={{ ios: 'person.fill.badge.plus', android: 'manage_accounts', web: 'user' } as any} size={16} tintColor="#ffffff" />
            <ThemedText style={styles.btnText}>Edit Profile</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#8b5cf6' }]}
            onPress={() => setPasswordModalOpen(true)}>
            <SymbolView name={{ ios: 'key.fill', android: 'lock', web: 'lock' } as any} size={16} tintColor="#ffffff" />
            <ThemedText style={styles.btnText}>Change Password</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#ef4444' }]}
            onPress={handleLogout}>
            <SymbolView name={{ ios: 'rectangle.portrait.and.arrow.right.fill', android: 'logout', web: 'logout' } as any} size={16} tintColor="#ffffff" />
            <ThemedText style={styles.btnText}>Log Out</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={editModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Update Profile</ThemedText>
              <TouchableOpacity onPress={() => setEditModalOpen(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>First Name *</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>Last Name *</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Phone Number *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Resume URL</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  keyboardType="url"
                  autoCapitalize="none"
                  placeholder="https://..."
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  value={resume}
                  onChangeText={setResume}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>LinkedIn URL</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  keyboardType="url"
                  autoCapitalize="none"
                  value={linkedin}
                  onChangeText={setLinkedin}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>GitHub URL</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  keyboardType="url"
                  autoCapitalize="none"
                  value={github}
                  onChangeText={setGithub}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Bio</ThemedText>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  multiline
                  numberOfLines={3}
                  value={bio}
                  onChangeText={setBio}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#3b82f6' }]}
                onPress={handleUpdateProfile}
                disabled={submitting}>
                {submitting ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.submitBtnText}>Update Profile</ThemedText>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={passwordModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Change Password</ThemedText>
              <TouchableOpacity onPress={() => setPasswordModalOpen(false)}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any} size={24} tintColor={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Current Password *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  secureTextEntry
                  autoCapitalize="none"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>New Password *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  secureTextEntry
                  autoCapitalize="none"
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Confirm New Password *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  secureTextEntry
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#8b5cf6' }]}
                onPress={handleChangePassword}
                disabled={submitting}>
                {submitting ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.submitBtnText}>Update Password</ThemedText>}
              </TouchableOpacity>
            </ScrollView>
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
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
  },
  roleBadge: {
    paddingVertical: Spacing.one / 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    marginTop: Spacing.one,
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    marginVertical: Spacing.two,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
    alignItems: 'center',
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonsGroup: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  btn: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
});
