import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Badge, Icon } from '../common';
import { colors, spacing, fontFamily, fontSize } from '../../theme';
import type { Item } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

interface ItemCardProps {
  item: Item;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ItemCard({ item }: ItemCardProps) {
  const navigation = useNavigation<NavigationProp>();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.itemId })}
    >
      <Card style={styles.card}>
        <View style={styles.content}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {item.notes && (
              <Text style={styles.notes} numberOfLines={1}>
                {item.notes}
              </Text>
            )}
          </View>
          <View style={styles.right}>
            <Badge variant="primary">{item.type}</Badge>
          </View>
        </View>
        <View style={styles.arrow}>
          <Icon name="chevron_right" color={colors.dustyMauve} size="sm" />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[4],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
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
  notes: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: spacing[0.5],
  },
  right: {
    marginLeft: spacing[3],
    flexShrink: 0,
  },
  arrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
});
