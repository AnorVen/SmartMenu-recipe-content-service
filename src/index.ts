import Fastify from "fastify";
import { z } from "zod";
import { prisma } from "./db.js";

const serviceName = process.env.SERVICE_NAME ?? "recipe-content-service";
const port = Number(process.env.PORT ?? 3005);

const app = Fastify({ logger: true });

const recipeQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(20),
  maxCookingTimeMinutes: z.coerce.number().int().positive().optional(),
  appliance: z.string().min(1).optional(),
  diet: z.string().min(1).optional(),
  ingredient: z.string().min(1).optional()
});

const recipeParamsSchema = z.object({
  id: z.string().min(1)
});

const leftoversSearchSchema = z.object({
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

const substitutionsSchema = z.object({
  rawText: z.string().optional(),
  ingredientName: z.string().min(1).optional(),
  substituteName: z.string().min(1).optional()
});

type SeedRecipe = {
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

const seedRecipes: SeedRecipe[] = [
  {
    title: "Овсянка с молоком",
    description: "Быстрый завтрак без лишних покупок.",
    difficulty: "easy",
    cookingTimeMinutes: 10,
    portions: 1,
    appliances: ["stove", "microwave"],
    dietTags: ["everyday", "vegetarian"],
    allergens: ["milk", "gluten"],
    ingredients: [
      { name: "овсянка", category: "pantry", quantity: 80, unit: "г" },
      { name: "молоко", category: "dairy", quantity: 250, unit: "мл" },
      { name: "банан", category: "produce", quantity: 1, unit: "шт", isOptional: true }
    ],
    steps: ["Довести молоко до теплого состояния.", "Добавить овсянку и варить 5-7 минут.", "При желании добавить банан."]
  },
  {
    title: "Гречка с курицей",
    description: "Плотный обед с понятным набором ингредиентов.",
    difficulty: "easy",
    cookingTimeMinutes: 30,
    portions: 2,
    appliances: ["stove"],
    dietTags: ["everyday", "high-protein"],
    allergens: [],
    ingredients: [
      { name: "гречка", category: "pantry", quantity: 150, unit: "г" },
      { name: "курица", category: "meat", quantity: 300, unit: "г" },
      { name: "лук", category: "produce", quantity: 1, unit: "шт" },
      { name: "морковь", category: "produce", quantity: 1, unit: "шт", isOptional: true }
    ],
    steps: ["Отварить гречку.", "Обжарить лук и курицу.", "Добавить морковь и соединить с гречкой."]
  },
  {
    title: "Рис с овощами",
    description: "Гибкий гарнир или самостоятельное блюдо.",
    difficulty: "easy",
    cookingTimeMinutes: 25,
    portions: 2,
    appliances: ["stove"],
    dietTags: ["vegetarian", "everyday"],
    allergens: [],
    ingredients: [
      { name: "рис", category: "pantry", quantity: 150, unit: "г" },
      { name: "морковь", category: "produce", quantity: 1, unit: "шт" },
      { name: "лук", category: "produce", quantity: 1, unit: "шт" },
      { name: "шпинат", category: "greens", quantity: 1, unit: "пучок", isOptional: true }
    ],
    steps: ["Отварить рис.", "Обжарить лук и морковь.", "Добавить шпинат и смешать с рисом."]
  },
  {
    title: "Омлет с зеленью",
    description: "Спасает зелень и молоко, когда они подходят к концу.",
    difficulty: "easy",
    cookingTimeMinutes: 12,
    portions: 1,
    appliances: ["stove", "microwave"],
    dietTags: ["vegetarian", "everyday", "quick"],
    allergens: ["egg", "milk"],
    ingredients: [
      { name: "яйца", category: "dairy", quantity: 2, unit: "шт" },
      { name: "молоко", category: "dairy", quantity: 50, unit: "мл", isOptional: true },
      { name: "шпинат", category: "greens", quantity: 0.5, unit: "пучок", isOptional: true },
      { name: "петрушка", category: "greens", quantity: 0.5, unit: "пучок", isOptional: true }
    ],
    steps: ["Взбить яйца с молоком.", "Добавить зелень.", "Приготовить на сковороде или в микроволновке."]
  },
  {
    title: "Куриный суп",
    description: "Универсальное блюдо на два дня.",
    difficulty: "medium",
    cookingTimeMinutes: 45,
    portions: 4,
    appliances: ["stove"],
    dietTags: ["everyday"],
    allergens: [],
    ingredients: [
      { name: "курица", category: "meat", quantity: 350, unit: "г" },
      { name: "картофель", category: "produce", quantity: 3, unit: "шт" },
      { name: "морковь", category: "produce", quantity: 1, unit: "шт" },
      { name: "лук", category: "produce", quantity: 1, unit: "шт" }
    ],
    steps: ["Сварить бульон из курицы.", "Добавить овощи.", "Варить до мягкости овощей."]
  },
  {
    title: "Паста с овощами",
    description: "Быстрый ужин без духовки.",
    difficulty: "easy",
    cookingTimeMinutes: 20,
    portions: 2,
    appliances: ["stove"],
    dietTags: ["vegetarian", "everyday"],
    allergens: ["gluten"],
    ingredients: [
      { name: "паста", category: "pantry", quantity: 180, unit: "г" },
      { name: "помидоры", category: "produce", quantity: 2, unit: "шт" },
      { name: "лук", category: "produce", quantity: 1, unit: "шт" },
      { name: "шпинат", category: "greens", quantity: 0.5, unit: "пучок", isOptional: true }
    ],
    steps: ["Отварить пасту.", "Обжарить лук с помидорами.", "Добавить зелень и смешать с пастой."]
  },
  {
    title: "Быстрые сэндвичи с курицей",
    description: "Использует остатки готовой курицы и зелени.",
    difficulty: "easy",
    cookingTimeMinutes: 10,
    portions: 2,
    appliances: ["microwave"],
    dietTags: ["quick", "everyday"],
    allergens: ["gluten", "milk"],
    ingredients: [
      { name: "хлеб", category: "pantry", quantity: 4, unit: "ломтик" },
      { name: "курица", category: "meat", quantity: 150, unit: "г" },
      { name: "сыр", category: "dairy", quantity: 60, unit: "г", isOptional: true },
      { name: "шпинат", category: "greens", quantity: 0.5, unit: "пучок", isOptional: true }
    ],
    steps: ["Разложить курицу и сыр на хлеб.", "Добавить зелень.", "Подогреть в микроволновке по желанию."]
  },
  {
    title: "Салат с курицей",
    description: "Легкий вариант, если уже есть приготовленная курица.",
    difficulty: "easy",
    cookingTimeMinutes: 15,
    portions: 2,
    appliances: [],
    dietTags: ["everyday", "high-protein"],
    allergens: [],
    ingredients: [
      { name: "курица", category: "meat", quantity: 180, unit: "г" },
      { name: "огурцы", category: "produce", quantity: 2, unit: "шт" },
      { name: "помидоры", category: "produce", quantity: 2, unit: "шт" },
      { name: "салат", category: "greens", quantity: 1, unit: "пучок", isOptional: true }
    ],
    steps: ["Нарезать овощи.", "Добавить курицу.", "Смешать и подать сразу."]
  },
  {
    title: "Йогурт с фруктами",
    description: "Самый быстрый перекус или завтрак.",
    difficulty: "easy",
    cookingTimeMinutes: 5,
    portions: 1,
    appliances: [],
    dietTags: ["vegetarian", "quick"],
    allergens: ["milk"],
    ingredients: [
      { name: "йогурт", category: "dairy", quantity: 180, unit: "г" },
      { name: "яблоко", category: "produce", quantity: 1, unit: "шт", isOptional: true },
      { name: "банан", category: "produce", quantity: 1, unit: "шт", isOptional: true }
    ],
    steps: ["Нарезать фрукты.", "Смешать с йогуртом."]
  },
  {
    title: "Тушеные овощи на сковороде",
    description: "Базовое блюдо для использования овощных остатков.",
    difficulty: "easy",
    cookingTimeMinutes: 20,
    portions: 2,
    appliances: ["stove"],
    dietTags: ["vegetarian", "everyday"],
    allergens: [],
    ingredients: [
      { name: "кабачок", category: "produce", quantity: 1, unit: "шт", isOptional: true },
      { name: "морковь", category: "produce", quantity: 1, unit: "шт" },
      { name: "лук", category: "produce", quantity: 1, unit: "шт" },
      { name: "помидоры", category: "produce", quantity: 2, unit: "шт", isOptional: true }
    ],
    steps: ["Нарезать овощи.", "Обжарить лук и морковь.", "Добавить остальные овощи и тушить 10-12 минут."]
  }
];

const seedSubstitutions = [
  { ingredientName: "курица", substituteName: "тофу", ratio: 1, notes: "Подходит для вегетарианской версии." },
  { ingredientName: "молоко", substituteName: "овсяное молоко", ratio: 1, notes: "Подходит для каш и омлетов без коровьего молока." },
  { ingredientName: "гречка", substituteName: "рис", ratio: 1, notes: "Подходит для гарнира и bowl-рецептов." },
  { ingredientName: "шпинат", substituteName: "петрушка", ratio: 1, notes: "Подходит для омлетов и пасты." },
  { ingredientName: "сыр", substituteName: "творог", ratio: 1, notes: "Подходит для сэндвичей и завтраков." },
  { ingredientName: "йогурт", substituteName: "кефир", ratio: 1, notes: "Подходит для завтраков и перекусов." },
  { ingredientName: "яйца", substituteName: "тофу", ratio: 1, notes: "Подходит для части быстрых завтраков." },
  { ingredientName: "паста", substituteName: "рис", ratio: 1, notes: "Если нет пасты, можно заменить на рис с овощной базой." }
];

app.setErrorHandler(async (error, request, reply) => {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      status: "error",
      service: serviceName,
      code: "VALIDATION_ERROR",
      issues: error.issues
    });
  }

  request.log.error(error);

  return reply.status(500).send({
    status: "error",
    service: serviceName,
    code: "INTERNAL_ERROR"
  });
});

app.get("/health", async () => ({
  status: "ok",
  service: serviceName
}));

app.get("/health/db", async () => {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: "ok",
    service: serviceName,
    dependency: "postgres"
  };
});

app.get("/recipes", async (request) => {
  const query = recipeQuerySchema.parse(request.query);
  await ensureSeedData();
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: true,
      steps: {
        orderBy: {
          orderIndex: "asc"
        }
      }
    },
    orderBy: [
      {
        cookingTimeMinutes: "asc"
      },
      {
        title: "asc"
      }
    ]
  });

  const filteredRecipes = recipes
    .filter((recipe) => matchesRecipeFilters(recipe, {
      appliance: query.appliance,
      diet: query.diet,
      ingredient: query.ingredient,
      maxCookingTimeMinutes: query.maxCookingTimeMinutes
    }))
    .slice(0, query.limit);

  return {
    status: "ok",
    service: serviceName,
    count: filteredRecipes.length,
    recipes: filteredRecipes.map(serializeRecipeSummary)
  };
});

app.get("/recipes/:id", async (request, reply) => {
  const params = recipeParamsSchema.parse(request.params);
  await ensureSeedData();
  const recipe = await prisma.recipe.findUnique({
    where: {
      id: params.id
    },
    include: {
      ingredients: true,
      steps: {
        orderBy: {
          orderIndex: "asc"
        }
      }
    }
  });

  if (!recipe) {
    return reply.status(404).send({
      status: "not_found",
      service: serviceName,
      recipe: null
    });
  }

  return {
    status: "ok",
    service: serviceName,
    recipe: serializeRecipe(recipe)
  };
});

app.post("/recipes/search-by-leftovers", async (request) => {
  const body = leftoversSearchSchema.parse(request.body);
  await ensureSeedData();

  const availableIngredients = extractIngredientNames(body);
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: true,
      steps: {
        orderBy: {
          orderIndex: "asc"
        }
      }
    }
  });

  const matches = recipes
    .filter((recipe) => matchesAvailableAppliances(recipe, body.appliances))
    .filter((recipe) => !body.diet || recipeHasDiet(recipe, body.diet))
    .filter((recipe) => !body.maxCookingTimeMinutes || recipe.cookingTimeMinutes <= body.maxCookingTimeMinutes)
    .map((recipe) => scoreRecipeByLeftovers(recipe, availableIngredients))
    .filter((result) => result.leftoversMatched.length > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.missingIngredients.length !== right.missingIngredients.length) {
        return left.missingIngredients.length - right.missingIngredients.length;
      }

      return left.recipe.cookingTimeMinutes - right.recipe.cookingTimeMinutes;
    })
    .slice(0, 5)
    .map((result) => ({
      ...serializeRecipeSummary(result.recipe),
      score: result.score,
      leftoversMatched: result.leftoversMatched,
      missingIngredients: result.missingIngredients
    }));

  return {
    status: "ok",
    service: serviceName,
    action: "find-recipes-by-leftovers",
    count: matches.length,
    availableIngredients,
    recipes: matches
  };
});

app.post("/substitutions", async (request) => {
  const body = substitutionsSchema.parse(request.body);
  await ensureSeedData();
  const parsed = parseSubstitutionRequest(body);

  const substitutions = await prisma.ingredientSubstitution.findMany({
    where: {
      ingredientName: {
        contains: parsed.ingredientName,
        mode: "insensitive"
      }
    },
    orderBy: [
      {
        ingredientName: "asc"
      },
      {
        substituteName: "asc"
      }
    ]
  });

  const requestedSubstitute = parsed.substituteName ?? null;
  const preferredMatch = requestedSubstitute
    ? substitutions.find((item) => item.substituteName.toLowerCase().includes(requestedSubstitute.toLowerCase()))
    : null;

  return {
    status: "ok",
    service: serviceName,
    action: "find-ingredient-substitutions",
    ingredientName: parsed.ingredientName,
    requestedSubstitute,
    preferredMatch: preferredMatch
      ? {
          ingredientName: preferredMatch.ingredientName,
          substituteName: preferredMatch.substituteName,
          ratio: preferredMatch.ratio?.toString() ?? null,
          notes: preferredMatch.notes
        }
      : null,
    substitutions: substitutions.map((item) => ({
      ingredientName: item.ingredientName,
      substituteName: item.substituteName,
      ratio: item.ratio?.toString() ?? null,
      notes: item.notes
    }))
  };
});

async function ensureSeedData(): Promise<void> {
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

function matchesRecipeFilters(
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

function matchesAvailableAppliances(
  recipe: {
    appliances: unknown;
  },
  appliances?: string[]
): boolean {
  if (!appliances || appliances.length === 0) {
    return true;
  }

  const available = new Set(appliances.map((item) => item.toLowerCase()));
  const required = normalizeStringArray(recipe.appliances);

  return required.every((item) => available.has(item.toLowerCase()));
}

function recipeHasDiet(
  recipe: {
    dietTags: unknown;
  },
  diet: string
): boolean {
  const normalizedDiet = diet.toLowerCase();
  return normalizeStringArray(recipe.dietTags).some((tag) => tag.toLowerCase().includes(normalizedDiet));
}

function extractIngredientNames(body: z.infer<typeof leftoversSearchSchema>): string[] {
  const fromItems = body.items?.map((item) => normalizeName(item.name)) ?? [];
  const fromRawText = body.rawText ? parseIngredientList(body.rawText) : [];

  return [...new Set([...fromItems, ...fromRawText])];
}

function parseIngredientList(rawText: string): string[] {
  return rawText
    .replace(/^(предложи рецепт|предложить рецепт|из|из остатков|из остатков продуктов)\s+/i, "")
    .split(/[,;]|\s+и\s+/)
    .map((item) => normalizeName(item))
    .filter(Boolean)
    .map(stripQuantityTail);
}

function scoreRecipeByLeftovers(
  recipe: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string | null;
    cookingTimeMinutes: number;
    portions: number;
    appliances: unknown;
    dietTags: unknown;
    allergens: unknown;
    source: string;
    chatId: bigint | null;
    createdAt: Date;
    updatedAt: Date;
    ingredients: Array<{ name: string; quantity: unknown; unit: string; isOptional: boolean }>;
    steps: Array<{ orderIndex: number; instruction: string }>;
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

function parseSubstitutionRequest(body: z.infer<typeof substitutionsSchema>) {
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

function serializeRecipeSummary(recipe: {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  cookingTimeMinutes: number;
  portions: number;
  appliances: unknown;
  dietTags: unknown;
  allergens: unknown;
  source: string;
  ingredients: Array<{ name: string; quantity: unknown; unit: string; isOptional: boolean }>;
}) {
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
    ingredients: recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: String(ingredient.quantity),
      unit: ingredient.unit,
      isOptional: ingredient.isOptional
    }))
  };
}

function serializeRecipe(recipe: {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  cookingTimeMinutes: number;
  portions: number;
  appliances: unknown;
  dietTags: unknown;
  allergens: unknown;
  source: string;
  chatId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
  ingredients: Array<{ name: string; category: string | null; quantity: unknown; unit: string; isOptional: boolean }>;
  steps: Array<{ orderIndex: number; instruction: string }>;
}) {
  return {
    ...serializeRecipeSummary(recipe),
    chatId: recipe.chatId?.toString() ?? null,
    steps: recipe.steps.map((step) => ({
      orderIndex: step.orderIndex,
      instruction: step.instruction
    })),
    ingredients: recipe.ingredients.map((ingredient) => ({
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

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function canonicalizeIngredientName(value: string): string {
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

function stripQuantityTail(value: string): string {
  return value
    .replace(/\b\d+([.,]\d+)?\s*(г|гр|кг|мл|л|шт|пучок|ломтик)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

await ensureSeedData();
await app.listen({ host: "0.0.0.0", port });
