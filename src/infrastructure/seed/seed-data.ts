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

export const seedRecipes: SeedRecipe[] = [
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

export const seedSubstitutions = [
  { ingredientName: "курица", substituteName: "тофу", ratio: 1, notes: "Подходит для вегетарианской версии." },
  { ingredientName: "молоко", substituteName: "овсяное молоко", ratio: 1, notes: "Подходит для каш и омлетов без коровьего молока." },
  { ingredientName: "гречка", substituteName: "рис", ratio: 1, notes: "Подходит для гарнира и bowl-рецептов." },
  { ingredientName: "шпинат", substituteName: "петрушка", ratio: 1, notes: "Подходит для омлетов и пасты." },
  { ingredientName: "сыр", substituteName: "творог", ratio: 1, notes: "Подходит для сэндвичей и завтраков." },
  { ingredientName: "йогурт", substituteName: "кефир", ratio: 1, notes: "Подходит для завтраков и перекусов." },
  { ingredientName: "яйца", substituteName: "тофу", ratio: 1, notes: "Подходит для части быстрых завтраков." },
  { ingredientName: "паста", substituteName: "рис", ratio: 1, notes: "Если нет пасты, можно заменить на рис с овощной базой." }
];
