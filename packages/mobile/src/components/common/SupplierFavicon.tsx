import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { getSupplierById } from '../../constants/suppliers';
import { colors } from '../../theme';
import Icon from './Icon';

interface SupplierFaviconProps {
  supplierId?: string;
  customUrl?: string;  // Custom domain URL for favicon
  size?: number;
}

export default function SupplierFavicon({ supplierId, customUrl, size = 24 }: SupplierFaviconProps) {
  const containerSize = size + 8;

  // If customUrl is provided, use it for favicon
  if (customUrl) {
    // Clean the URL to get just the domain
    const domain = customUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

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

  // If no supplierId, show a default icon for custom sources without URL
  if (!supplierId) {
    return (
      <View
        style={[
          styles.container,
          styles.defaultContainer,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
          },
        ]}
      >
        <Icon name="link" size="sm" color={colors.dustyMauve} />
      </View>
    );
  }

  const supplier = getSupplierById(supplierId);
  if (!supplier) return null;

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${supplier.domain}&sz=128`;

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
  defaultContainer: {
    backgroundColor: colors.bgLight,
  },
});
