# React Native Migration Progress

## Overview
Converting `packages/frontend` (React + Tailwind) to `packages/mobile` (React Native iOS)

**Started:** 2026-02-04
**Status:** In Progress

---

## Files to Migrate (44 total)

### Pages (8 files)
- [x] HomePage.tsx → HomeScreen.tsx (COMPLETE)
- [x] PantryPage.tsx → PantryScreen.tsx (COMPLETE)
- [ ] ItemDetailPage.tsx → ItemDetailScreen.tsx (placeholder)
- [x] AttemptsPage.tsx → BakesScreen.tsx (COMPLETE)
- [ ] AttemptDetailPage.tsx → AttemptDetailScreen.tsx (placeholder)
- [ ] NewAttemptPage.tsx → NewAttemptScreen.tsx (placeholder)
- [x] ProofedItemsPage.tsx → ProofedScreen.tsx (COMPLETE)
- [ ] ProofedItemDetailPage.tsx → ProofedItemDetailScreen.tsx (placeholder)

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
- [ ] items/ItemCard.tsx
- [x] items/ItemForm.tsx
- [ ] recipes/RecipeCard.tsx
- [ ] recipes/RecipeForm.tsx
- [ ] recipes/PasteIngredientsModal.tsx
- [ ] variants/VariantCard.tsx
- [ ] variants/VariantForm.tsx
- [ ] attempts/AttemptCard.tsx
- [ ] photos/PhotoUpload.tsx
- [ ] proofed/ProofedItemCard.tsx

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

---

## Current Task
Building out remaining screens with full styling

## Next Up
- ProofedScreen
- ItemDetailScreen (complex - recipes, variants, scale selector)
- AttemptDetailScreen (complex - photos, item usages, editing)
- NewAttemptScreen (complex - forms, photo upload)

## Notes
- Keeping `packages/frontend` intact
- New app will be at `packages/mobile`
- Sharing types from `@proofed/shared`
