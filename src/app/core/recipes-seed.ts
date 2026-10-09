/**
 * Detailed recipes with orderable ingredients. Mirrors SeedData.recipes in the web app (js/data/seed.js).
 * Used until the admin saves recipes of their own to Firestore (cms/main.recipes).
 */
import { RecipePost } from './cms.service';

export const SEED_RECIPES: RecipePost[] = [
  {
    "id": "blog1",
    "title": "Sinigang sa Sugpo",
    "category": "Recipes",
    "date": "2026-06-15",
    "image": "🍲",
    "excerpt": "A classic Filipino sour soup with fresh sugpo shrimp from the palengke.",
    "content": "A comforting sour soup that is ready in under an hour. Sugpo gives the broth a sweet, rich flavor, and kangkong adds a fresh crunch.",
    "servings": 4,
    "prepTime": "15 min",
    "cookTime": "35 min",
    "difficulty": "Easy",
    "ingredients": [
      {
        "name": "Large Shrimp (Sugpo)",
        "amount": "500 g",
        "productId": "p015",
        "variantId": "v015a",
        "qty": 1
      },
      {
        "name": "Kangkong",
        "amount": "2 bunches",
        "productId": "p005",
        "variantId": "v005a",
        "qty": 2
      },
      {
        "name": "Tomatoes (Native)",
        "amount": "3 pcs",
        "productId": "p006",
        "variantId": "v006b",
        "qty": 1
      },
      {
        "name": "Red Onion",
        "amount": "1 large",
        "productId": "p012",
        "variantId": "v012a",
        "qty": 1
      },
      {
        "name": "Patis (Fish Sauce)",
        "amount": "2 tbsp",
        "productId": "p028",
        "variantId": "v028a",
        "qty": 1
      },
      {
        "name": "Sinigang sa sampalok mix",
        "amount": "1 pack"
      },
      {
        "name": "Labanos (radish)",
        "amount": "1 medium"
      },
      {
        "name": "Siling haba",
        "amount": "2 pcs"
      }
    ],
    "steps": [
      "Boil 6 cups of water in a pot. Add the onion and tomatoes and simmer for 10 minutes until soft.",
      "Add the radish and cook for 5 minutes.",
      "Stir in the sinigang mix, then add the sugpo and siling haba.",
      "Cook the shrimp for 5 to 7 minutes until pink. Do not overcook.",
      "Season with patis. Add the kangkong and turn off the heat after 1 minute.",
      "Serve hot with steamed rice."
    ],
    "tips": [
      "Keep the sugpo heads on. The fat adds a lot of flavor to the broth.",
      "Add the kangkong last so it stays green and crisp."
    ]
  },
  {
    "id": "recipe-daing",
    "title": "Daing na Bangus",
    "category": "Recipes",
    "date": "2026-06-12",
    "image": "🐟",
    "excerpt": "Garlicky, vinegar-marinated bangus fried until crisp. A perfect breakfast with sinangag.",
    "content": "Butterflied bangus marinated overnight in vinegar, garlic, and pepper, then fried until golden.",
    "servings": 4,
    "prepTime": "15 min + overnight marinade",
    "cookTime": "15 min",
    "difficulty": "Easy",
    "ingredients": [
      {
        "name": "Fresh Bangus (Milkfish)",
        "amount": "2 pcs",
        "productId": "p013",
        "variantId": "v013b",
        "qty": 2
      },
      {
        "name": "Garlic (Bawang)",
        "amount": "1 whole head, crushed",
        "productId": "p011",
        "variantId": "v011a",
        "qty": 1
      },
      {
        "name": "Calamansi",
        "amount": "6 pcs",
        "productId": "p003",
        "variantId": "v003b",
        "qty": 1
      },
      {
        "name": "Cooking Oil (1L)",
        "amount": "1 cup for frying",
        "productId": "p027",
        "variantId": "v027a",
        "qty": 1
      },
      {
        "name": "Cane vinegar",
        "amount": "1 cup"
      },
      {
        "name": "Salt and whole peppercorns",
        "amount": "to taste"
      }
    ],
    "steps": [
      "Ask for the bangus to be butterflied and deboned, or do it at home. Rinse and pat dry.",
      "Mix vinegar, crushed garlic, calamansi juice, salt, and pepper in a dish.",
      "Soak the bangus in the marinade, cover, and refrigerate overnight.",
      "Drain the fish and pat dry so the oil does not splatter.",
      "Fry in medium-hot oil for 4 to 5 minutes per side until golden and crisp.",
      "Serve with garlic fried rice, fresh tomatoes, and spiced vinegar."
    ],
    "tips": [
      "Dry the fish well before frying for a crispier skin.",
      "Fry skin-side down first so the fillet does not curl."
    ]
  },
  {
    "id": "recipe-tinola",
    "title": "Tinolang Manok",
    "category": "Recipes",
    "date": "2026-06-08",
    "image": "🍗",
    "excerpt": "Light, gingery chicken soup that is warm and easy on the stomach.",
    "content": "Chicken simmered with plenty of ginger, onion, and garlic in a clear broth.",
    "servings": 4,
    "prepTime": "10 min",
    "cookTime": "40 min",
    "difficulty": "Easy",
    "ingredients": [
      {
        "name": "Chicken Leg Quarter",
        "amount": "1 kg",
        "productId": "p018",
        "variantId": "v017b",
        "qty": 1
      },
      {
        "name": "Fresh Ginger (Luya)",
        "amount": "1 thumb-size piece, sliced",
        "productId": "p010",
        "variantId": "v010a",
        "qty": 1
      },
      {
        "name": "Garlic (Bawang)",
        "amount": "4 cloves",
        "productId": "p011",
        "variantId": "v011a",
        "qty": 1
      },
      {
        "name": "Red Onion",
        "amount": "1 medium",
        "productId": "p012",
        "variantId": "v012a",
        "qty": 1
      },
      {
        "name": "Patis (Fish Sauce)",
        "amount": "2 tbsp",
        "productId": "p028",
        "variantId": "v028a",
        "qty": 1
      },
      {
        "name": "Green papaya or sayote",
        "amount": "1 medium"
      },
      {
        "name": "Sili or malunggay leaves",
        "amount": "1 cup"
      }
    ],
    "steps": [
      "Saute garlic, onion, and ginger in a little oil until fragrant.",
      "Add the chicken and cook for 5 minutes until lightly browned. Season with patis.",
      "Pour in 6 cups of water. Bring to a boil, then simmer for 25 minutes.",
      "Add the papaya or sayote and cook for 8 to 10 minutes until tender.",
      "Stir in the leaves, cook for 1 minute, and serve hot."
    ],
    "tips": [
      "Skim the foam from the top for a clearer broth.",
      "Rice washings (hugas bigas) make the soup slightly creamier."
    ]
  },
  {
    "id": "recipe-pinakbet",
    "title": "Pinakbet",
    "category": "Recipes",
    "date": "2026-06-03",
    "image": "🥘",
    "excerpt": "Ilocano vegetable stew with pork, ampalaya, talong, and sitaw.",
    "content": "A hearty mix of palengke vegetables cooked with pork and bagoong. Salty, savory, and slightly bitter.",
    "servings": 4,
    "prepTime": "20 min",
    "cookTime": "25 min",
    "difficulty": "Medium",
    "ingredients": [
      {
        "name": "Pork Kasim (Shoulder)",
        "amount": "250 g, cubed",
        "productId": "p017",
        "variantId": "v017a",
        "qty": 1
      },
      {
        "name": "Ampalaya (Bitter Gourd)",
        "amount": "1 medium",
        "productId": "p008",
        "variantId": "v008a",
        "qty": 1
      },
      {
        "name": "Eggplant (Talong)",
        "amount": "2 pcs",
        "productId": "p007",
        "variantId": "v007a",
        "qty": 1
      },
      {
        "name": "Sitaw (String Beans)",
        "amount": "1 bundle",
        "productId": "p009",
        "variantId": "v009a",
        "qty": 1
      },
      {
        "name": "Tomatoes (Native)",
        "amount": "2 pcs",
        "productId": "p006",
        "variantId": "v006b",
        "qty": 1
      },
      {
        "name": "Garlic (Bawang)",
        "amount": "3 cloves",
        "productId": "p011",
        "variantId": "v011a",
        "qty": 1
      },
      {
        "name": "Red Onion",
        "amount": "1 medium",
        "productId": "p012",
        "variantId": "v012a",
        "qty": 1
      },
      {
        "name": "Bagoong isda",
        "amount": "3 tbsp"
      },
      {
        "name": "Kalabasa (squash)",
        "amount": "1 cup, cubed"
      }
    ],
    "steps": [
      "Saute garlic, onion, and tomatoes in a pot. Add the pork and cook until browned.",
      "Add the bagoong and 1 cup of water. Simmer for 15 minutes until the pork is tender.",
      "Add the kalabasa first, then the sitaw and talong, and cook for 5 minutes.",
      "Add the ampalaya last and cook for 3 minutes.",
      "Do not stir too much. Shake the pot gently so the vegetables stay whole."
    ],
    "tips": [
      "Soak sliced ampalaya in salted water for 10 minutes to reduce the bitterness."
    ]
  },
  {
    "id": "recipe-tortang-talong",
    "title": "Tortang Talong",
    "category": "Recipes",
    "date": "2026-05-28",
    "image": "🍆",
    "excerpt": "Grilled eggplant dipped in egg and pan-fried, with a savory ground pork filling.",
    "content": "Smoky grilled talong coated in beaten egg and fried until golden. It is quick, cheap, and loved by everyone.",
    "servings": 3,
    "prepTime": "10 min",
    "cookTime": "20 min",
    "difficulty": "Easy",
    "ingredients": [
      {
        "name": "Eggplant (Talong)",
        "amount": "4 medium",
        "productId": "p007",
        "variantId": "v007a",
        "qty": 1
      },
      {
        "name": "Fresh Eggs (Medium)",
        "amount": "3 eggs (sold per tray of 30)",
        "productId": "p023",
        "variantId": "v023a",
        "qty": 1
      },
      {
        "name": "Ground Pork (Giniling)",
        "amount": "200 g",
        "productId": "p020",
        "variantId": "v020a",
        "qty": 1
      },
      {
        "name": "Red Onion",
        "amount": "1 small",
        "productId": "p012",
        "variantId": "v012a",
        "qty": 1
      },
      {
        "name": "Cooking Oil (1L)",
        "amount": "3 tbsp",
        "productId": "p027",
        "variantId": "v027a",
        "qty": 1
      },
      {
        "name": "Salt and pepper",
        "amount": "to taste"
      }
    ],
    "steps": [
      "Grill or roast the whole talong until the skin is charred and the flesh is soft.",
      "Peel off the skin, leaving the stem on. Flatten the flesh gently with a fork.",
      "Saute onion and ground pork until cooked. Season with salt and pepper.",
      "Beat the eggs with a pinch of salt. Dip each talong, then top with the pork if you like.",
      "Pan-fry in oil for 2 to 3 minutes per side until golden. Serve with banana ketchup."
    ],
    "tips": [
      "Poke the talong with a fork before grilling so it cooks evenly."
    ]
  },
  {
    "id": "blog2",
    "title": "How to Pick the Perfect Mango",
    "category": "Kitchen Guides",
    "date": "2026-06-01",
    "image": "🥭",
    "excerpt": "Tips from our palengke vendors on choosing sweet, ripe mangoes every time.",
    "content": "Carabao mangoes are best when they are fully ripe. Use your nose and your fingers, not just your eyes.",
    "steps": [
      "Smell the stem end. A strong fruity aroma means the mango is sweet and ripe.",
      "Check the color. Golden-yellow is ideal, with a few green patches being fine.",
      "Press gently. A ripe mango has a slight give, like a ripe avocado.",
      "Feel the weight. A heavy mango for its size is juicier.",
      "Ripen firm mangoes in a paper bag at room temperature for 1 to 2 days."
    ],
    "tips": [
      "Store ripe mangoes in the fridge for up to 5 days.",
      "Skip mangoes with dark sunken spots or a sour smell."
    ]
  },
  {
    "id": "blog3",
    "title": "Weekly Meal Prep with Palengke Finds",
    "category": "Kitchen Guides",
    "date": "2026-05-20",
    "image": "📋",
    "excerpt": "Plan your week with fresh produce that stays crisp and flavorful.",
    "content": "A little planning lets you eat fresh all week and waste less food.",
    "steps": [
      "Buy hardy vegetables like talong, sitaw, and ampalaya early in the week.",
      "Save leafy greens like kangkong for a mid-week delivery.",
      "Cook your rice and one or two viands in bulk on Sunday.",
      "Marinate meat and fish in portions and freeze what you will not use in 2 days.",
      "Wash and cut vegetables, then store them in airtight containers lined with paper towels."
    ],
    "tips": [
      "Order twice a week: once for sturdy items, once for leafy greens and seafood."
    ]
  }
];
