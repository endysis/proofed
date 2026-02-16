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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '../../components/common';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';

type ConfirmSignUpNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ConfirmSignUp'>;
type ConfirmSignUpRouteProp = RouteProp<AuthStackParamList, 'ConfirmSignUp'>;

export default function ConfirmSignUpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ConfirmSignUpNavigationProp>();
  const route = useRoute<ConfirmSignUpRouteProp>();
  const { confirmSignUp, resendConfirmationCode } = useAuth();

  const email = route.params.email;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmSignUp(email, code.trim());
      navigation.navigate('Welcome', { email });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await resendConfirmationCode(email);
      setResendSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
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
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.description}>
            We've sent a verification code to {email}. Enter it below to verify your account.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {resendSuccess ? (
            <Text style={styles.success}>Verification code resent successfully!</Text>
          ) : null}

          <Input
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            containerStyle={styles.input}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleConfirm}
            style={styles.button}
          >
            Verify Email
          </Button>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResendCode} disabled={resending}>
              <Text style={[styles.link, resending && styles.linkDisabled]}>
                {resending ? 'Sending...' : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>

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
  success: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.success,
    backgroundColor: '#f0fdf4',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  input: {
    marginBottom: spacing[6],
  },
  button: {
    marginBottom: spacing[4],
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  resendText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  link: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  linkDisabled: {
    opacity: 0.5,
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
