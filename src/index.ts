import Fastify from "fastify";
import { prisma } from "./db.js";

const serviceName = process.env.SERVICE_NAME ?? "recipe-content-service";
const port = Number(process.env.PORT ?? 3005);

const app = Fastify({ logger: true });

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

app.get("/recipes", async () => ({
  status: "ok",
  service: serviceName,
  recipes: []
}));

app.post("/recipes/search-by-leftovers", async () => ({
  status: "accepted",
  service: serviceName,
  action: "find-recipes-by-leftovers"
}));

app.post("/substitutions", async () => ({
  status: "accepted",
  service: serviceName,
  action: "find-ingredient-substitutions"
}));

await app.listen({ host: "0.0.0.0", port });
