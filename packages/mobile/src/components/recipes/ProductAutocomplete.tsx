import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';
import { useProductSearch, ProductSearchResult, parseQuantity } from '../../hooks/useProductSearch';
import { Icon } from '../common';

interface ProductAutocompleteProps {
  onSelect: (product: {
    brand: string;
    productName: string;
    purchaseQuantity: string;
    purchaseUnit: string;
  }) => void;
  placeholder?: string;
}

export default function ProductAutocomplete({
  onSelect,
  placeholder = 'Search for a product...',
}: ProductAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: products, isLoading, isError } = useProductSearch(query);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    setShowDropdown(text.trim().length >= 2);
  }, []);

  const handleSelectProduct = useCallback(
    (product: ProductSearchResult) => {
      const { value, unit } = parseQuantity(product.quantity);
      onSelect({
        brand: product.brand,
        productName: product.productName,
        purchaseQuantity: value,
        purchaseUnit: unit,
      });
      setQuery('');
      setShowDropdown(false);
      Keyboard.dismiss();
    },
    [onSelect]
  );

  const handleUseCustom = useCallback(() => {
    // Use the typed text as a custom product name
    onSelect({
      brand: '',
      productName: query.trim(),
      purchaseQuantity: '',
      purchaseUnit: '',
    });
    setQuery('');
    setShowDropdown(false);
    Keyboard.dismiss();
  }, [query, onSelect]);

  const handleFocus = useCallback(() => {
    if (query.trim().length >= 2) {
      setShowDropdown(true);
    }
  }, [query]);

  const handleBlur = useCallback(() => {
    // Delay hiding to allow touch events on dropdown items
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  }, []);

  const hasResults = products && products.length > 0;
  const showCustomOption = query.trim().length >= 2;
  const hasDropdownContent = hasResults || showCustomOption || isLoading;
  const shouldShowDropdown = showDropdown && query.trim().length >= 2 && hasDropdownContent;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Icon name="search" size="sm" color={colors.dustyMauve} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.dustyMauve}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Icon name="close" size="sm" color={colors.dustyMauve} />
          </TouchableOpacity>
        )}
      </View>

      {shouldShowDropdown && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {/* Always show custom option first while loading - don't block users */}
            {showCustomOption && isLoading && (
              <>
                <TouchableOpacity
                  style={styles.customItem}
                  onPress={handleUseCustom}
                  activeOpacity={0.7}
                >
                  <Icon name="edit" size="sm" color={colors.primary} />
                  <Text style={styles.customText}>Use custom: "{query.trim()}"</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            )}

            {isError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to search. Use custom entry below.</Text>
              </View>
            )}

            {hasResults &&
              products.map((product, index) => (
                <TouchableOpacity
                  key={`${product.brand}-${product.productName}-${index}`}
                  style={styles.productItem}
                  onPress={() => handleSelectProduct(product)}
                  activeOpacity={0.7}
                >
                  {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Icon name="inventory_2" size="sm" color={colors.dustyMauve} />
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    {product.brand && (
                      <Text style={styles.productBrand} numberOfLines={1}>
                        {product.brand}
                      </Text>
                    )}
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.productName || 'Unknown Product'}
                    </Text>
                    {product.quantity && (
                      <Text style={styles.productQuantity}>{product.quantity}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

            {/* Show custom option at bottom after results load */}
            {showCustomOption && !isLoading && (
              <>
                {hasResults && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.customItem}
                  onPress={handleUseCustom}
                  activeOpacity={0.7}
                >
                  <Icon name="edit" size="sm" color={colors.primary} />
                  <Text style={styles.customText}>Use custom: "{query.trim()}"</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 48,
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 320,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    gap: spacing[2],
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  errorContainer: {
    padding: spacing[4],
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    textAlign: 'center',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgLight,
  },
  productImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productBrand: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  productName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  productQuantity: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: spacing[3],
  },
  customItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[2],
  },
  customText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    flex: 1,
  },
});
