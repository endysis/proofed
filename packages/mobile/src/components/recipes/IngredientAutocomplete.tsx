import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';
import { useIngredientSuggestions, useSubmitIngredient, filterIngredients } from '../../hooks/useIngredients';
import { Icon } from '../common';

interface IngredientAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: object;
}

export default function IngredientAutocomplete({
  value,
  onChangeText,
  placeholder = 'Ingredient',
  style,
}: IngredientAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { data: ingredientsData } = useIngredientSuggestions();
  const submitMutation = useSubmitIngredient();

  const suggestions = ingredientsData?.ingredients
    ? filterIngredients(ingredientsData.ingredients, value)
    : [];

  const hasExactMatch = suggestions.some(
    (s) => s.name.toLowerCase() === value.toLowerCase().trim()
  );

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);
      setShowDropdown(text.trim().length > 0);
      setShowSubmitPrompt(false);
    },
    [onChangeText]
  );

  const handleSelectSuggestion = useCallback(
    (name: string) => {
      onChangeText(name);
      setShowDropdown(false);
      setShowSubmitPrompt(false);
      Keyboard.dismiss();
    },
    [onChangeText]
  );

  const handleSubmitNew = useCallback(() => {
    if (value.trim()) {
      submitMutation.mutate({ name: value.trim() });
      setShowSubmitPrompt(false);
      setShowDropdown(false);
    }
  }, [value, submitMutation]);

  const handleFocus = useCallback(() => {
    if (value.trim().length > 0) {
      setShowDropdown(true);
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    // Delay hiding to allow touch events on dropdown items
    setTimeout(() => {
      setShowDropdown(false);
      setShowSubmitPrompt(false);
    }, 150);
  }, []);

  const showSuggestOption =
    value.trim().length >= 2 && !hasExactMatch && suggestions.length < 8;

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={[styles.input, style]}
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.dustyMauve}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {showDropdown && (suggestions.length > 0 || showSuggestOption) && (
        <View style={styles.dropdown}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion.name}-${index}`}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(suggestion.name)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>{suggestion.name}</Text>
              <Text style={styles.categoryText}>{suggestion.category}</Text>
            </TouchableOpacity>
          ))}

          {showSuggestOption && (
            <>
              {suggestions.length > 0 && <View style={styles.divider} />}
              {!showSubmitPrompt ? (
                <TouchableOpacity
                  style={styles.addNewItem}
                  onPress={() => setShowSubmitPrompt(true)}
                  activeOpacity={0.7}
                >
                  <Icon name="add" size="sm" color={colors.primary} />
                  <Text style={styles.addNewText}>
                    Suggest "{value.trim()}"
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.submitPrompt}>
                  <Text style={styles.submitPromptText}>
                    Add "{value.trim()}" to suggestions?
                  </Text>
                  <View style={styles.submitButtons}>
                    <TouchableOpacity
                      style={styles.submitCancelButton}
                      onPress={() => setShowSubmitPrompt(false)}
                    >
                      <Text style={styles.submitCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.submitConfirmButton}
                      onPress={handleSubmitNew}
                      disabled={submitMutation.isPending}
                    >
                      <Text style={styles.submitConfirmText}>
                        {submitMutation.isPending ? 'Sending...' : 'Submit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
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
  input: {
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 44,
    paddingHorizontal: spacing[4],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 280,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  suggestionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    flex: 1,
  },
  categoryText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'capitalize',
    marginLeft: spacing[2],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: spacing[3],
  },
  addNewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  addNewText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    flex: 1,
  },
  submitPrompt: {
    padding: spacing[3],
    backgroundColor: 'rgba(229, 52, 78, 0.05)',
  },
  submitPromptText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  submitButtons: {
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'flex-end',
  },
  submitCancelButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  submitCancelText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  submitConfirmButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  submitConfirmText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.white,
  },
});
