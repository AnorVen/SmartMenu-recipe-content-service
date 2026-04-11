import { prisma } from "../infrastructure/persistence/prisma.js";
import type { LeftoversSearchInput, SubstitutionsInput } from "../presentation/http/schemas.js";
import { seedRecipes, seedSubstitutions } from "../infrastructure/seed/seed-data.js";

export async function ensureSeedData(): Promise<void> {
  const [recipesCount, substitutionsCount] = await Promise.all([
    prisma.recipe.count(),
    prisma.ingredientSubstitution.count()
  ]);

  if (recipesCount === 0) {
    for (const recipe of seedRecipes) {
      await prisma.recipe.create({
        data: {
          title: recipe.title,
          description: recipe.description,
          difficulty: recipe.difficulty,
          cookingTimeMinutes: recipe.cookingTimeMinutes,
          portions: recipe.portions,
          appliances: recipe.appliances,
          dietTags: recipe.dietTags,
          allergens: recipe.allergens ?? [],
          source: "seed",
          ingredients: {
            create: recipe.ingredients.map((ingredient) => ({
              name: ingredient.name,
              category: ingredient.category,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              isOptional: ingredient.isOptional ?? false
            }))
          },
          steps: {
            create: recipe.steps.map((instruction, index) => ({
              orderIndex: index + 1,
              instruction
            }))
          }
        }
      });
    }
  }

  if (substitutionsCount === 0) {
    await prisma.ingredientSubstitution.createMany({
      data: seedSubstitutions
    });
  }
}

export function matchesRecipeFilters(
  recipe: {
    cookingTimeMinutes: number;
    appliances: unknown;
    dietTags: unknown;
    ingredients: Array<{ name: string }>;
  },
  filters: {
    appliance?: string;
    diet?: string;
    ingredient?: string;
    maxCookingTimeMinutes?: number;
  }
): boolean {
  if (filters.maxCookingTimeMinutes && recipe.cookingTimeMinutes > filters.maxCookingTimeMinutes) {
    return false;
  }

  if (filters.appliance && !matchesAvailableAppliances(recipe, [filters.appliance])) {
    return false;
  }

  if (filters.diet && !recipeHasDiet(recipe, filters.diet)) {
    return false;
  }

  if (filters.ingredient) {
    const ingredient = filters.ingredient.toLowerCase();
    const hasIngredient = recipe.ingredients.some((item) => normalizeName(item.name).includes(ingredient));
    if (!hasIngredient) {
      return false;
    }
  }

  return true;
}

export function matchesAvailableAppliances(recipe: { appliances: unknown }, appliances?: string[]): boolean {
  if (!appliances || appliances.length === 0) {
    return true;
  }

  const available = new Set(appliances.map((item) => item.toLowerCase()));
  const required = normalizeStringArray(recipe.appliances);

  return required.every((item) => available.has(item.toLowerCase()));
}

export function recipeHasDiet(recipe: { dietTags: unknown }, diet: string): boolean {
  const normalizedDiet = diet.toLowerCase();
  return normalizeStringArray(recipe.dietTags).some((tag) => tag.toLowerCase().includes(normalizedDiet));
}

export function extractIngredientNames(body: LeftoversSearchInput): string[] {
  const fromItems = body.items?.map((item) => normalizeName(item.name)) ?? [];
  const fromRawText = body.rawText ? parseIngredientList(body.rawText) : [];

  return [...new Set([...fromItems, ...fromRawText])];
}

export function parseIngredientList(rawText: string): string[] {
  return rawText
    .replace(/^(предложи рецепт|предложить рецепт|из|из остатков|из остатков продуктов)\s+/i, "")
    .split(/[,;]|\s+и\s+/)
    .map((item) => normalizeName(item))
    .filter(Boolean)
    .map(stripQuantityTail);
}

export function scoreRecipeByLeftovers(
  recipe: {
    ingredients: Array<{ name: string; isOptional: boolean }>;
  },
  availableIngredients: string[]
) {
  const leftoversMatched: string[] = [];
  const missingIngredients: string[] = [];

  for (const ingredient of recipe.ingredients) {
    const normalizedIngredient = normalizeName(ingredient.name);
    const matched = availableIngredients.some((available) => {
      return normalizedIngredient.includes(available) || available.includes(normalizedIngredient);
    });

    if (matched) {
      leftoversMatched.push(ingredient.name);
    } else if (!ingredient.isOptional) {
      missingIngredients.push(ingredient.name);
    }
  }

  return {
    recipe,
    leftoversMatched,
    missingIngredients,
    score: leftoversMatched.length * 10 - missingIngredients.length * 2
  };
}

export function parseSubstitutionRequest(body: SubstitutionsInput) {
  if (body.ingredientName) {
    return {
      ingredientName: canonicalizeIngredientName(body.ingredientName),
      substituteName: body.substituteName ? canonicalizeIngredientName(body.substituteName) : null
    };
  }

  const rawText = body.rawText?.toLowerCase() ?? "";
  const match = rawText.match(/замен[а-я]*\s+(?:в\s+\S+\s+)?(.+?)\s+на\s+(.+)/i);

  if (match) {
    return {
      ingredientName: canonicalizeIngredientName(match[1]),
      substituteName: canonicalizeIngredientName(match[2])
    };
  }

  return {
    ingredientName: canonicalizeIngredientName(rawText.replace(/^замен[а-я]*\s*/i, "")),
    substituteName: null
  };
}

export function serializeRecipeSummary(recipe: any) {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    difficulty: recipe.difficulty,
    cookingTimeMinutes: recipe.cookingTimeMinutes,
    portions: recipe.portions,
    appliances: normalizeStringArray(recipe.appliances),
    dietTags: normalizeStringArray(recipe.dietTags),
    allergens: normalizeStringArray(recipe.allergens),
    source: recipe.source,
    ingredients: recipe.ingredients.map((ingredient: any) => ({
      name: ingredient.name,
      quantity: String(ingredient.quantity),
      unit: ingredient.unit,
      isOptional: ingredient.isOptional
    }))
  };
}

export function serializeRecipe(recipe: any) {
  return {
    ...serializeRecipeSummary(recipe),
    chatId: recipe.chatId?.toString() ?? null,
    steps: recipe.steps.map((step: any) => ({
      orderIndex: step.orderIndex,
      instruction: step.instruction
    })),
    ingredients: recipe.ingredients.map((ingredient: any) => ({
      name: ingredient.name,
      category: ingredient.category,
      quantity: String(ingredient.quantity),
      unit: ingredient.unit,
      isOptional: ingredient.isOptional
    })),
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString()
  };
}

export function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export function canonicalizeIngredientName(value: string): string {
  const normalizedValue = stripQuantityTail(normalizeName(value));
  const aliases: Record<string, string> = {
    курицу: "курица",
    курицей: "курица",
    гречку: "гречка",
    пасту: "паста",
    овсянку: "овсянка",
    картошку: "картофель",
    яйца: "яйца",
    яйцо: "яйца",
    помидор: "помидоры",
    помидоры: "помидоры",
    огурец: "огурцы",
    огурцы: "огурцы",
    бананы: "банан",
    яблоки: "яблоко"
  };

  return aliases[normalizedValue] ?? normalizedValue;
}

export function stripQuantityTail(value: string): string {
  return value
    .replace(/\b\d+([.,]\d+)?\s*(г|гр|кг|мл|л|шт|пучок|ломтик)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
