import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !phoneNumber || !username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await register({
        firstName,
        lastName,
        email,
        phoneNumber,
        username,
        password,
      });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }]}>
                <SymbolView
                  name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person-add' } as any}
                  size={36}
                  tintColor={isDark ? '#a78bfa' : '#8b5cf6'}
                />
              </View>
              <ThemedText type="title" style={styles.title}>
                Create Account
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Sign up to start tracking your job applications and mastering skills
              </ThemedText>
            </View>

            <View style={styles.form}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>First Name</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.backgroundElement,
                        color: colors.text,
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                      },
                    ]}
                    placeholder="John"
                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>Last Name</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.backgroundElement,
                        color: colors.text,
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                      },
                    ]}
                    placeholder="Doe"
                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email Address</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundElement,
                      color: colors.text,
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                    },
                  ]}
                  placeholder="john.doe@example.com"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Phone Number</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundElement,
                      color: colors.text,
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                    },
                  ]}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Username</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundElement,
                      color: colors.text,
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                    },
                  ]}
                  placeholder="johndoe"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundElement,
                      color: colors.text,
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </View>
              )}

              {success && (
                <View style={styles.successContainer}>
                  <ThemedText style={styles.successText}>{success}</ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#8b5cf6' }]}
                onPress={handleRegister}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <ThemedText themeColor="textSecondary">
                  Already have an account?{' '}
                </ThemedText>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <ThemedText style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                    Login
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoContainer: {
    padding: Spacing.four,
    borderRadius: 50,
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  form: {
    width: '100%',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: Spacing.two,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: Spacing.two,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  successText: {
    color: '#10b981',
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
});
