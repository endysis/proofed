import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Icon } from '../common';
import { colors, spacing, fontFamily, fontSize } from '../../theme';
import type { Attempt } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

interface AttemptCardProps {
  attempt: Attempt;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AttemptCard({ attempt }: AttemptCardProps) {
  const navigation = useNavigation<NavigationProp>();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('AttemptDetail', { attemptId: attempt.attemptId })}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {attempt.name}
            </Text>
            <Text style={styles.date}>{attempt.date}</Text>
          </View>
          <View style={styles.icons}>
            {attempt.photoKeys && attempt.photoKeys.length > 0 && (
              <Icon name="photo" color={colors.dustyMauve} size="sm" />
            )}
            <Icon name="chevron_right" color={colors.dustyMauve} size="md" />
          </View>
        </View>
        {attempt.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {attempt.notes}
          </Text>
        )}
        <Text style={styles.itemCount}>
          {attempt.itemUsages.length} item{attempt.itemUsages.length !== 1 ? 's' : ''}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
  },
  date: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: spacing[0.5],
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginLeft: spacing[3],
  },
  notes: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing[2],
  },
  itemCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: spacing[2],
  },
});
