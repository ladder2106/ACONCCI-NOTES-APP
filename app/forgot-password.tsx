import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Theme (matches existing login screen values) ───────────────────────────
const COLORS = {
  primary: '#3EACC6',       // Matches AuthPage's primary (cyan blue)
  secondary: '#ED9097',     // coral pink
  background: '#F9FAFB',    // Matches AuthPage background
  card: '#FFFFFF',
  text: '#111827',          // Matches AuthPage text
  textMuted: '#6B7280',     // Matches AuthPage subtitle/muted text
  inputBg: '#FFFFFF',
  border: '#D1D5DB',        // Matches AuthPage input border
  error: '#EF4444',         // Matches AuthPage error color
};

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Phase 1 — UI only. Wire up backend here in Phase 2.
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Back Arrow ── */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          {/* ── Heading ── */}
          <View style={styles.headerSection}>
            <Text style={styles.heading}>Forgot Password?</Text>
            <Text style={styles.subtext}>
              Enter the email address linked to your account and we'll send you a reset link.
            </Text>
          </View>

          {/* ── Success State ── */}
          {submitted ? (
            <View style={styles.successCard}>
              <Ionicons name="mail-outline" size={36} color={COLORS.primary} style={styles.successIcon} />
              <Text style={styles.successTitle}>Check your inbox</Text>
              <Text style={styles.successText}>
                If <Text style={styles.successEmail}>{email.trim()}</Text> is linked to an account,
                you'll receive a reset link shortly.
              </Text>
              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form ── */
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                />
              </View>

              {/* Inline Error */}
              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Back button
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Header
  headerSection: {
    marginBottom: 36,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
  },

  // Form
  form: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    // Removes default outline on web (Expo Web)
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
  },

  // Submit button — matches your Sign In button style
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Success state
  successCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  successIcon: {
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  successEmail: {
    color: COLORS.text,
    fontWeight: '600',
  },
  backToLoginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  backToLoginText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
