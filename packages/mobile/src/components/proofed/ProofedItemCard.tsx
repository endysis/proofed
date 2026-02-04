import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Badge, Icon } from '../common';
import { colors, spacing, fontFamily, fontSize } from '../../theme';
import type { ProofedItem } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

interface ProofedItemCardProps {
  proofedItem: ProofedItem;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProofedItemCard({ proofedItem }: ProofedItemCardProps) {
  const navigation = useNavigation<NavigationProp>();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('ProofedItemDetail', {
          proofedItemId: proofedItem.proofedItemId,
        })
      }
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {proofedItem.name}
              </Text>
              <Badge variant="success">Proofed</Badge>
            </View>
            <Text style={styles.itemCount}>
              {proofedItem.itemConfigs.length} item
              {proofedItem.itemConfigs.length !== 1 ? 's' : ''}
            </Text>
            {proofedItem.notes && (
              <Text style={styles.notes} numberOfLines={2}>
                {proofedItem.notes}
              </Text>
            )}
          </View>
          <Icon
            name="chevron_right"
            color={colors.dustyMauve}
            size="md"
            style={styles.arrow}
          />
        </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  name: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
    flexShrink: 1,
  },
  itemCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: spacing[0.5],
  },
  notes: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing[2],
  },
  arrow: {
    marginLeft: spacing[3],
    flexShrink: 0,
  },
});
