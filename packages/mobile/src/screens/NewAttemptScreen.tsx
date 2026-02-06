import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon, Loading } from '../components/common';
import { useCreateAttempt } from '../hooks/useAttempts';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { AttemptStatus } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type FlowType = 'guided' | 'direct' | null;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NewAttemptScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const createAttempt = useCreateAttempt();

  const [flowType, setFlowType] = useState<FlowType>(null);
  const [name, setName] = useState('');
  const [dateValue, setDateValue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [tempDate, setTempDate] = useState(new Date());
  const tempDateRef = useRef(new Date());

  const handleSubmit = () => {
    const status: AttemptStatus = flowType === 'direct' ? 'done' : 'planning';
    const dateString = dateValue.toISOString().split('T')[0];

    createAttempt.mutate(
      {
        name,
        date: dateString,
        itemUsages: [],
        notes: notes || undefined,
        status,
      },
      {
        onSuccess: (attempt) =>
          navigation.navigate('AttemptDetail', { attemptId: attempt.attemptId }),
      }
    );
  };

  const isValid = name.trim() && !createAttempt.isPending;

  // Flow selection screen
  if (!flowType) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Icon name="close" color={colors.primary} size="lg" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Bake</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.flowSelection}>
          <Text style={styles.flowTitle}>How would you like to proceed?</Text>

          <TouchableOpacity
            style={styles.flowOption}
            onPress={() => setFlowType('guided')}
          >
            <View style={styles.flowIconContainer}>
              <Icon name="checklist" size="xl" color={colors.primary} />
            </View>
            <View style={styles.flowContent}>
              <Text style={styles.flowOptionTitle}>Guided Bake</Text>
              <Text style={styles.flowOptionDescription}>
                Step through the process with ingredient checklists
              </Text>
            </View>
            <Icon name="chevron_right" size="md" color={colors.dustyMauve} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.flowOption}
            onPress={() => setFlowType('direct')}
          >
            <View style={styles.flowIconContainer}>
              <Icon name="history" size="xl" color={colors.primary} />
            </View>
            <View style={styles.flowContent}>
              <Text style={styles.flowOptionTitle}>Log Past Bake</Text>
              <Text style={styles.flowOptionDescription}>
                Record a bake you've already completed
              </Text>
            </View>
            <Icon name="chevron_right" size="md" color={colors.dustyMauve} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setFlowType(null)}>
          <Icon name="arrow_back_ios" color={colors.primary} size="lg" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {flowType === 'guided' ? 'Start Bake' : 'Log Past Bake'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Attempt Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Vanilla Cake Test #1"
              placeholderTextColor={colors.dustyMauve}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                tempDateRef.current = dateValue;
                setTempDate(dateValue);
                setShowDatePicker(true);
              }}
            >
              <Icon name="calendar_today" size="sm" color={colors.dustyMauve} />
              <Text style={styles.dateText}>
                {dateValue.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>

            {/* Android Date Picker */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDateValue(selectedDate);
                  }
                }}
              />
            )}
          </View>
        </View>

      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
        >
          <Icon name="add" color={isValid ? colors.white : colors.dustyMauve} size="md" />
          <Text style={[styles.submitButtonText, !isValid && styles.submitButtonTextDisabled]}>
            Create Attempt
          </Text>
        </TouchableOpacity>
      </View>

      {/* iOS Date Picker */}
      {Platform.OS === 'ios' && showDatePicker && (
        <>
          <TouchableOpacity
            style={styles.datePickerBackdrop}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={[styles.datePickerSheet, { paddingBottom: insets.bottom }]}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setDateValue(tempDateRef.current);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.datePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate;
                const newDate = new Date(currentDate);
                tempDateRef.current = newDate;
                setTempDate(newDate);
              }}
              style={styles.datePicker}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  flowSelection: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[8],
  },
  flowTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  flowOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  flowIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  flowContent: {
    flex: 1,
  },
  flowOptionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing[1],
  },
  flowOptionDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing[2],
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  section: {
    marginTop: spacing[4],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  field: {
    marginBottom: spacing[3],
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 56,
    paddingHorizontal: spacing[4],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 56,
    paddingHorizontal: spacing[4],
  },
  dateText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  datePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  datePickerCancel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.dustyMauve,
  },
  datePickerDone: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  datePicker: {
    height: 200,
  },
  datePickerInline: {
    height: 350,
  },
  inlinePicker: {
    marginTop: spacing[2],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  doneButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  textArea: {
    height: 100,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
    backgroundColor: colors.bgLight,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(157, 129, 137, 0.3)',
  },
  submitButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  submitButtonTextDisabled: {
    color: colors.dustyMauve,
  },
});
