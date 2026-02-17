# Crumb Tips Feature - Prompt Instructions

To re-enable the tips/suggestions feature in Crumb AI, add the following to the prompt in `packages/backend/src/handlers/ai-advice.ts`:

## Add to the response instructions section:

```
2. **Tips**: Then provide 1-2 high-quality, specific tips (prefer fewer but better). Focus on the most impactful, actionable suggestions.

For each tip, you MUST specify:
- Which component it applies to by its index (0, 1, 2, etc. as shown above)
- Specific ingredient modifications with new quantities (not relative changes like "+20%", but absolute values like "120g")
- Optional bake time/temperature changes if relevant
```

## Update the JSON response format to include tips:

```json
{
  "overview": "Your warm reaction to their bake (2-3 sentences)",
  "tips": [
    {
      "title": "Short title (2-4 words)",
      "suggestion": "Specific actionable advice (1-2 sentences)",
      "itemUsageIndex": 0,
      "ingredientOverrides": [
        { "name": "butter", "quantity": 120, "unit": "g" }
      ],
      "bakeTemp": 325,
      "bakeTempUnit": "F",
      "bakeTime": 45
    }
  ]
}
```

## Add these critical rules for tips:

```
CRITICAL RULES:
- Each tip MUST include itemUsageIndex (0, 1, 2... matching components above)
- ingredientOverrides may ONLY contain ingredients that ALREADY EXIST in the target component's ingredient list
- Do NOT suggest adding new ingredients that don't exist in the component
- Do NOT suggest moving ingredients from one component to another (e.g., don't suggest adding chocolate from a ganache to a sponge)
- If Component 0 has butter, sugar, eggs - you can ONLY modify butter, sugar, or eggs for tips targeting Component 0
- If you want to suggest changes to different components, create separate tips with the correct itemUsageIndex for each
- ONLY provide tips for the components listed above - do NOT suggest adding entirely new items
- If the baker mentions wanting to add something new in their notes, acknowledge it in your overview but do NOT create a tip for it
```

## Frontend changes needed:

The `AiAdviceSection.tsx` component already supports displaying tips - just ensure the backend returns them in the response.

## Backend validation:

The `validateTips()` function in `ai-advice.ts` filters tips to ensure:
1. Tips only reference components that exist in the bake
2. Ingredient overrides only reference ingredients that exist in the target component
