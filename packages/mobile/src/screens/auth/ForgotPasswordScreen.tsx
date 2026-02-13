import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '../../components/common';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { forgotPassword, confirmForgotPassword } = useAuth();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await forgotPassword(email.trim().toLowerCase());
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmForgotPassword(email.trim().toLowerCase(), code.trim(), newPassword);
      navigation.navigate('SignIn');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing[12], paddingBottom: insets.bottom + spacing[6] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Proofed</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Reset Password</Text>

          {step === 'email' ? (
            <>
              <Text style={styles.description}>
                Enter your email address and we'll send you a code to reset your password.
              </Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Input
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.input}
              />

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleRequestReset}
                style={styles.button}
              >
                Send Reset Code
              </Button>
            </>
          ) : (
            <>
              <Text style={styles.description}>
                Enter the code sent to {email} and your new password.
              </Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Input
                label="Verification Code"
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                containerStyle={styles.input}
              />

              <Input
                label="New Password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                containerStyle={styles.input}
              />

              <Input
                label="Confirm New Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                containerStyle={styles.input}
              />

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleResetPassword}
                style={styles.button}
              >
                Reset Password
              </Button>
            </>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  logo: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['4xl'],
    color: colors.primary,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.text,
    marginBottom: spacing[2],
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing[6],
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.error,
    backgroundColor: '#fef2f2',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  input: {
    marginBottom: spacing[4],
  },
  button: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  backButton: {
    alignItems: 'center',
  },
  backText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
});
