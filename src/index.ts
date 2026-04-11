import Fastify from "fastify";
import { z } from "zod";
import { prisma } from "./infrastructure/persistence/prisma.js";
import {
  ensureSeedData,
  extractIngredientNames,
  matchesAvailableAppliances,
  matchesRecipeFilters,
  parseSubstitutionRequest,
  recipeHasDiet,
  scoreRecipeByLeftovers,
  serializeRecipe,
  serializeRecipeSummary
} from "./application/recipe-service.js";
import { leftoversSearchSchema, recipeParamsSchema, recipeQuerySchema, substitutionsSchema } from "./presentation/http/schemas.js";

const serviceName = process.env.SERVICE_NAME ?? "recipe-content-service";
const port = Number(process.env.PORT ?? 3005);

const app = Fastify({ logger: true });

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
    orderBy: [{ cookingTimeMinutes: "asc" }, { title: "asc" }]
  });

  const filteredRecipes = recipes
    .filter((recipe: any) =>
      matchesRecipeFilters(recipe, {
        appliance: query.appliance,
        diet: query.diet,
        ingredient: query.ingredient,
        maxCookingTimeMinutes: query.maxCookingTimeMinutes
      })
    )
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
    .filter((recipe: any) => matchesAvailableAppliances(recipe, body.appliances))
    .filter((recipe: any) => !body.diet || recipeHasDiet(recipe, body.diet))
    .filter((recipe: any) => !body.maxCookingTimeMinutes || recipe.cookingTimeMinutes <= body.maxCookingTimeMinutes)
    .map((recipe: any) => scoreRecipeByLeftovers(recipe, availableIngredients))
    .filter((result: any) => result.leftoversMatched.length > 0)
    .sort((left: any, right: any) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.missingIngredients.length !== right.missingIngredients.length) {
        return left.missingIngredients.length - right.missingIngredients.length;
      }

      return left.recipe.cookingTimeMinutes - right.recipe.cookingTimeMinutes;
    })
    .slice(0, 5)
    .map((result: any) => ({
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
    orderBy: [{ ingredientName: "asc" }, { substituteName: "asc" }]
  });

  const requestedSubstitute = parsed.substituteName ?? null;
  const preferredMatch = requestedSubstitute
    ? substitutions.find((item: any) => item.substituteName.toLowerCase().includes(requestedSubstitute.toLowerCase()))
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
    substitutions: substitutions.map((item: any) => ({
      ingredientName: item.ingredientName,
      substituteName: item.substituteName,
      ratio: item.ratio?.toString() ?? null,
      notes: item.notes
    }))
  };
});

await ensureSeedData();
await app.listen({ host: "0.0.0.0", port });
