# React Native Migration Progress

## Overview
Converting `packages/frontend` (React + Tailwind) to `packages/mobile` (React Native iOS)

**Started:** 2026-02-04
**Status:** Complete ✓

---

## Files to Migrate (44 total)

### Pages (8 files)
- [x] HomePage.tsx → HomeScreen.tsx (COMPLETE)
- [x] PantryPage.tsx → PantryScreen.tsx (COMPLETE)
- [x] ItemDetailPage.tsx → ItemDetailScreen.tsx (COMPLETE)
- [x] AttemptsPage.tsx → BakesScreen.tsx (COMPLETE)
- [x] AttemptDetailPage.tsx → AttemptDetailScreen.tsx (COMPLETE)
- [x] NewAttemptPage.tsx → NewAttemptScreen.tsx (COMPLETE)
- [x] ProofedItemsPage.tsx → ProofedScreen.tsx (COMPLETE)
- [x] ProofedItemDetailPage.tsx → ProofedItemDetailScreen.tsx (COMPLETE)

### Common Components (10 files)
- [x] Card.tsx
- [x] Icon.tsx
- [x] Badge.tsx
- [x] Loading.tsx
- [x] Button.tsx
- [x] Modal.tsx
- [x] EmptyState.tsx
- [x] Select.tsx
- [x] TextArea.tsx
- [x] Input.tsx

### Feature Components (10 files)
- [x] items/ItemCard.tsx (COMPLETE)
- [x] items/ItemForm.tsx (COMPLETE)
- [x] recipes/RecipeCard.tsx (inline in ItemDetailScreen)
- [x] recipes/RecipeForm.tsx (COMPLETE)
- [x] recipes/PasteIngredientsModal.tsx (COMPLETE)
- [x] variants/VariantCard.tsx (inline in ItemDetailScreen)
- [x] variants/VariantForm.tsx (COMPLETE)
- [x] attempts/AttemptCard.tsx (COMPLETE)
- [x] photos/PhotoUpload.tsx (COMPLETE)
- [x] proofed/ProofedItemCard.tsx (COMPLETE)

### Hooks (6 files) - Mostly reusable
- [x] useItems.ts
- [x] useRecipes.ts
- [x] useVariants.ts
- [x] useAttempts.ts
- [x] usePhotos.ts (adapted for React Native)
- [x] useProofedItems.ts

### Utils & Constants (5 files) - Fully reusable
- [x] utils/formatDate.ts
- [x] utils/ingredientParser.ts
- [x] utils/scaleRecipe.ts
- [x] constants/containers.ts
- [x] constants/units.ts

### API (2 files) - Mostly reusable
- [x] api/client.ts (adapted for React Native)
- [x] api/config.ts (new - replaces Vite env vars)

### Navigation & App Setup
- [x] App.tsx (React Navigation setup with fonts, React Query)
- [x] Theme/colors config (colors, spacing, typography, borderRadius)

---

## Design System

### Colors
```
primary: #e5344e
pastel-pink: #f4acb7
dusty-mauve: #9d8189
bg-light: #f8f6f6
bg-dark: #211113
card-dark: #2d1a1d
text: #171112
```

### Typography
- Font: Space Grotesk

### Border Radius
- 2xl: 16px
- 3xl: 24px

---

## Session Log

### Session 1 (2026-02-04)
- [x] Analyzed frontend structure
- [x] Created migration tracking file
- [x] Initialize React Native project (Expo)
- [x] Set up navigation (React Navigation with tabs + stack)
- [x] Create theme/design tokens (colors, spacing, typography)
- [x] Port common components (Icon, Button, Card, Modal, Input, TextArea, Select, Badge, Loading, EmptyState)
- [x] Port API client and hooks
- [x] Copy utility files (formatDate, scaleRecipe, ingredientParser, containers, units)
- [x] Create HomeScreen with full styling
- [x] Create placeholder screens for remaining pages
- [x] Set up App.tsx with fonts, React Query, SafeAreaProvider

**Progress: ~50% complete**

All 4 main tab screens complete with full styling.
Remaining: Detail screens + complex forms.

### Session 2 (2026-02-04)
- [x] RecipeForm component with ingredients, bake settings, container config, custom scales
- [x] PasteIngredientsModal for bulk ingredient parsing
- [x] VariantForm component with ingredient overrides and bake setting overrides
- [x] ItemCard component
- [x] AttemptCard component
- [x] ProofedItemCard component
- [x] PhotoUpload component using expo-image-picker
- [x] ItemDetailScreen - full implementation with recipe/variant management, scale selector, modals
- [x] AttemptDetailScreen - attempt details, item usages, outcome logging, photo gallery, capture as proofed
- [x] NewAttemptScreen - form for creating attempts with item/recipe/variant pickers
- [x] ProofedItemDetailScreen - proven recipe display with expandable ingredients, edit/delete

**Progress: 100% complete**

All screens and components migrated to React Native.

---

## Notes
- Keeping `packages/frontend` intact
- New app at `packages/mobile`
- Sharing types from `@proofed/shared`
- RecipeCard and VariantCard are rendered inline in ItemDetailScreen rather than as separate components
