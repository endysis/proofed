import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Loading } from '../components/common';
import { useAttempt } from '../hooks/useAttempts';
import { colors, fontFamily, fontSize, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AttemptRouterRouteProp = RouteProp<RootStackParamList, 'AttemptDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Smart router that redirects to the appropriate screen based on attempt status.
 * Uses navigation.replace() to ensure back button returns to the Bakes list.
 */
export default function AttemptRouter() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AttemptRouterRouteProp>();
  const { attemptId } = route.params;

  const { data: attempt, isLoading, isError } = useAttempt(attemptId);

  useEffect(() => {
    if (!attempt) return;

    // Treat undefined status as 'done' for backward compatibility
    const status = attempt.status || 'done';

    switch (status) {
      case 'planning':
        navigation.replace('PlanScreen', { attemptId });
        break;
      case 'baking':
        navigation.replace('BakeScreen', { attemptId });
        break;
      case 'done':
      default:
        navigation.replace('EvaluateScreen', { attemptId });
        break;
    }
  }, [attempt, attemptId, navigation]);

  if (isLoading) {
    return <Loading />;
  }

  if (isError || !attempt) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Attempt not found</Text>
      </View>
    );
  }

  // Show loading while redirecting
  return <Loading />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.error,
    padding: spacing[4],
  },
});
