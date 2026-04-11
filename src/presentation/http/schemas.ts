import { z } from "zod";

export const recipeQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(20),
  maxCookingTimeMinutes: z.coerce.number().int().positive().optional(),
  appliance: z.string().min(1).optional(),
  diet: z.string().min(1).optional(),
  ingredient: z.string().min(1).optional()
});

export const recipeParamsSchema = z.object({
  id: z.string().min(1)
});

export const leftoversSearchSchema = z.object({
  chatId: z.coerce.number().int().positive().optional(),
  rawText: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.coerce.number().positive().optional(),
        unit: z.string().min(1).optional()
      })
    )
    .optional(),
  diet: z.string().optional(),
  appliances: z.array(z.string().min(1)).optional(),
  maxCookingTimeMinutes: z.coerce.number().int().positive().optional()
});

export const substitutionsSchema = z.object({
  rawText: z.string().optional(),
  ingredientName: z.string().min(1).optional(),
  substituteName: z.string().min(1).optional()
});

export type LeftoversSearchInput = z.infer<typeof leftoversSearchSchema>;
export type SubstitutionsInput = z.infer<typeof substitutionsSchema>;

export type SeedRecipe = {
  title: string;
  description: string;
  difficulty: string;
  cookingTimeMinutes: number;
  portions: number;
  appliances: string[];
  dietTags: string[];
  allergens?: string[];
  ingredients: Array<{
    name: string;
    category?: string;
    quantity: number;
    unit: string;
    isOptional?: boolean;
  }>;
  steps: string[];
};
