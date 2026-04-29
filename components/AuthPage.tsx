import logo from '@/assets/images/aconcci-logo-transparent.png';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

interface AuthPageProps {
  mode: 'login' | 'signup';
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSignup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSwitchMode: (mode: 'login' | 'signup') => void;
}

const PasswordRequirement = ({
  met,
  children,
  mutedColor,
  textColor,
}: {
  met: boolean;
  children: React.ReactNode;
  mutedColor: string;
  textColor: string;
}) => (
  <View style={styles.requirementItem}>
    <Ionicons
      name={met ? 'checkmark-circle' : 'ellipse-outline'}
      size={14}
      color={met ? '#10B981' : mutedColor}
    />
    <Text style={[styles.requirementText, { color: met ? textColor : mutedColor }]}>{children}</Text>
  </View>
);

export const AuthPage: React.FC<AuthPageProps> = ({ mode, onLogin, onSignup, onSwitchMode }) => {
  const router = useRouter();
  const colors = useThemeColors();
  const { loggedOut } = useLocalSearchParams();
  const isLogin = mode === 'login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);

  useEffect(() => {
    if (loggedOut === 'true') {
      setShowLogoutMessage(true);
      const timer = setTimeout(() => {
        setShowLogoutMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loggedOut]);

  // Animation shared values
  const shakeOffset = useSharedValue(0);
  const loginScale = useSharedValue(1);
  const signupScale = useSharedValue(1);
  const googleScale = useSharedValue(1);

  const passwordStrength = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
  };
  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  const getStrengthColor = () => {
    if (strengthScore <= 2) return '#EF4444';
    if (strengthScore <= 3) return '#F59E0B';
    return '#10B981';
  };

  const getStrengthText = () => {
    if (strengthScore <= 2) return 'Weak';
    if (strengthScore <= 3) return 'Medium';
    return 'Strong';
  };

  const handleSwitchMode = (newMode: 'login' | 'signup') => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    onSwitchMode(newMode);
  };

  const triggerShake = () => {
    shakeOffset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const handleSubmit = async () => {
    if (!email || !password) {
      triggerShake();
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      triggerShake();
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const result = isLogin
        ? await onLogin(email, password)
        : await onSignup(email, password);

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setLoading(false);
        setServerError(result.error || 'Authentication failed');
        triggerShake();
      }
    } catch (error) {
      setLoading(false);
      setServerError('A network error occurred');
      triggerShake();
    }
  };

  const handleGoogleSignIn = () => {
    triggerShake(); // Visual feedback that it's "coming soon"
    Alert.alert('Coming Soon', 'Google sign-in will be available in a future update.');
  };

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const getButtonScaleStyle = (sharedValue: SharedValue<number>) => {
    return useAnimatedStyle(() => ({
      transform: [{ scale: sharedValue.value }],
    }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.card,
            cardAnimatedStyle,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Logo and Title */}
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.title, { color: colors.text }]}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {isLogin ? 'Sign in to access your notes' : 'Start capturing your thoughts'}
            </Text>
          </View>

          {/* Logout Message */}
          {showLogoutMessage && (
            <View
              style={[
                styles.logoutMessage,
                { backgroundColor: colors.accent, borderColor: colors.border },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
              <Text style={[styles.logoutMessageText, { color: colors.text }]}>You have been logged out</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {/* Forgot Password — login only */}
              {isLogin && (
                <TouchableOpacity
                  onPress={() => router.push('/forgot-password')}
                  style={styles.forgotPassword}
                  disabled={loading}
                >
                  <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Password Strength — signup only */}
              {!isLogin && password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthHeader}>
                    <Text style={[styles.strengthLabel, { color: colors.mutedForeground }]}>Password strength</Text>
                    <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                      {getStrengthText()}
                    </Text>
                  </View>
                  <View style={[styles.strengthBarBackground, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        {
                          width: `${(strengthScore / 5) * 100}%`,
                          backgroundColor: getStrengthColor(),
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.requirementsList}>
                    <PasswordRequirement met={passwordStrength.length} mutedColor={colors.mutedForeground} textColor={colors.text}>
                      At least 8 characters
                    </PasswordRequirement>
                    <PasswordRequirement met={passwordStrength.hasUpper && passwordStrength.hasLower} mutedColor={colors.mutedForeground} textColor={colors.text}>
                      Upper & lowercase letters
                    </PasswordRequirement>
                    <PasswordRequirement met={passwordStrength.hasNumber} mutedColor={colors.mutedForeground} textColor={colors.text}>
                      Contains a number
                    </PasswordRequirement>
                    <PasswordRequirement met={passwordStrength.hasSpecial} mutedColor={colors.mutedForeground} textColor={colors.text}>
                      Contains a special character
                    </PasswordRequirement>
                  </View>
                </View>
              )}
            </View>

            {/* Confirm Password — signup only */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    disabled={loading}
                  >
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Inline Error */}
            {serverError ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            ) : null}

            {/* Primary Submit Button */}
            <AnimatedPressable
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                loading && styles.disabledButton,
                getButtonScaleStyle(isLogin ? loginScale : signupScale)
              ]}
              onPress={handleSubmit}
              disabled={loading}
              onPressIn={() => {
                (isLogin ? loginScale : signupScale).value = withSpring(0.95);
              }}
              onPressOut={() => {
                (isLogin ? loginScale : signupScale).value = withSpring(1);
              }}
            >
              <View style={styles.buttonContent}>
                {loading ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator color="#fff" />
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                )}
              </View>
            </AnimatedPressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Sign In */}
          <AnimatedPressable
            style={[
              styles.googleButton,
              { borderColor: colors.border, backgroundColor: colors.inputBackground },
              getButtonScaleStyle(googleScale),
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            onPressIn={() => { googleScale.value = withSpring(0.95); }}
            onPressOut={() => { googleScale.value = withSpring(1); }}
          >
            <Ionicons name="logo-google" size={18} color="#4285F4" style={styles.googleIcon} />
            <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Google</Text>
          </AnimatedPressable>

          {/* Trust Badge — login only */}
          {isLogin && (
            <View style={[styles.trustBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <View style={styles.trustTextContainer}>
                <Text style={[styles.trustTitle, { color: colors.text }]}>Your Data, Your Device</Text>
                <Text style={[styles.trustDescription, { color: colors.mutedForeground }]}>
                  All notes are stored locally on your device. Create an account to sync across sessions.
                </Text>
              </View>
            </View>
          )}

          {/* Bottom Toggle */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity
              onPress={() => handleSwitchMode(isLogin ? 'signup' : 'login')}
              disabled={loading}
            >
              <Text style={styles.footerLink}>{isLogin ? 'Create one' : 'Sign in'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    height: 48,
    width: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  logoutMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    gap: 6,
  },
  logoutMessageText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: '#3EACC6',
    fontWeight: '500',
  },
  strengthContainer: {
    marginTop: 12,
    gap: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  strengthBarBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  requirementsList: {
    gap: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  metRequirementText: {
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#3EACC6',
    height: 52,
    borderRadius: 12,
    marginTop: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
  },
  buttonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingWrapper: {
    position: 'absolute',
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  googleButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  googleIcon: {
    // Styling for Google icon if needed
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  trustBadge: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  trustTextContainer: {
    flex: 1,
    gap: 4,
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  trustDescription: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#3EACC6',
    fontWeight: '600',
  },
});
