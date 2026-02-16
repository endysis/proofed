import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { getSupplierById } from '../../constants/suppliers';
import { colors } from '../../theme';

interface SupplierFaviconProps {
  supplierId?: string;
  size?: number;
}

export default function SupplierFavicon({ supplierId, size = 24 }: SupplierFaviconProps) {
  if (!supplierId) return null;

  const supplier = getSupplierById(supplierId);
  if (!supplier) return null;

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${supplier.domain}&sz=128`;
  const containerSize = size + 8;

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
      ]}
    >
      <Image
        source={{ uri: faviconUrl }}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
});
