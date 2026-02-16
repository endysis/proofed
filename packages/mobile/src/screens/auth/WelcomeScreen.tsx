import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/common';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

// Key for storing pending preference selection (will be synced after sign-in)
export const PENDING_TEMP_UNIT_KEY = 'proofed_pending_temp_unit';

type WelcomeNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
type WelcomeRouteProp = RouteProp<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WelcomeNavigationProp>();
  const route = useRoute<WelcomeRouteProp>();

  const email = route.params?.email;
  const [selectedUnit, setSelectedUnit] = useState<'F' | 'C'>('F');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);

    try {
      // Store the preference locally - will be synced after sign-in
      await AsyncStorage.setItem(PENDING_TEMP_UNIT_KEY, selectedUnit);
      navigation.navigate('SignIn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing[12], paddingBottom: insets.bottom + spacing[6] },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>Proofed</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcome}>Welcome!</Text>
        <Text style={styles.description}>
          Before you start logging your bakes, let's set your temperature preference.
        </Text>

        <Text style={styles.question}>
          What temperature unit do you prefer for baking?
        </Text>

        <View style={styles.options}>
          <TouchableOpacity
            style={[
              styles.option,
              selectedUnit === 'F' && styles.optionSelected,
            ]}
            onPress={() => setSelectedUnit('F')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionLabel,
                selectedUnit === 'F' && styles.optionLabelSelected,
              ]}
            >
              Fahrenheit
            </Text>
            <Text
              style={[
                styles.optionUnit,
                selectedUnit === 'F' && styles.optionUnitSelected,
              ]}
            >
              350°F
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              selectedUnit === 'C' && styles.optionSelected,
            ]}
            onPress={() => setSelectedUnit('C')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionLabel,
                selectedUnit === 'C' && styles.optionLabelSelected,
              ]}
            >
              Celsius
            </Text>
            <Text
              style={[
                styles.optionUnit,
                selectedUnit === 'C' && styles.optionUnitSelected,
              ]}
            >
              180°C
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          You can change this later in Settings.
        </Text>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onPress={handleContinue}
          style={styles.button}
        >
          Get Started
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
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
  content: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
  },
  welcome: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  question: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  options: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: colors.white,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 52, 78, 0.05)',
  },
  optionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionUnit: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.dustyMauve,
  },
  optionUnitSelected: {
    color: colors.primary,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  button: {},
});
