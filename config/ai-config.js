// AI Configuration for Food Recognition
const config = {
  // Primary AI Provider - OpenAI GPT-4 Vision (highest accuracy)
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-vision-preview',
    maxTokens: 1000,
    temperature: 0.1, // Low temperature for consistent results
  },

  // Backup AI Provider - Google Vision
  googleVision: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  },

  // Nutritional Database APIs
  nutritionAPIs: {
    // Primary - Nutritionix (850k+ foods)
    nutritionix: {
      appId: process.env.NUTRITIONIX_APP_ID,
      appKey: process.env.NUTRITIONIX_APP_KEY,
      baseUrl: 'https://trackapi.nutritionix.com/v2',
    },
    
    // Backup - Edamam
    edamam: {
      appId: process.env.EDAMAM_APP_ID,
      appKey: process.env.EDAMAM_APP_KEY,
      baseUrl: 'https://api.edamam.com/api/food-database/v2',
    },

    // Free fallback - USDA FoodData Central
    usda: {
      apiKey: process.env.USDA_API_KEY,
      baseUrl: 'https://api.nal.usda.gov/fdc/v1',
    },
  },

  // Food Recognition Settings
  recognition: {
    confidence_threshold: 0.7,
    max_items_per_image: 10,
    supported_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 10 * 1024 * 1024, // 10MB
  },

  // Cal AI-like features
  features: {
    volume_estimation: true,
    barcode_scanning: true,
    text_description: true,
    health_integration: true,
    macro_tracking: true,
    meal_suggestions: true,
  },

  // Accuracy improvement settings
  ml_enhancement: {
    user_corrections: true, // Learn from user feedback
    portion_calibration: true, // Improve portion size estimates
    brand_recognition: true, // Recognize specific brands
    cooking_method_detection: true, // Raw vs cooked detection
  },

  // Prompts for different AI models
  prompts: {
    gpt4_vision: `You are a professional nutritionist AI. Analyze this food image and provide:
1. Identify all food items visible
2. Estimate portion sizes (grams/cups/pieces)
3. Calculate calories per item
4. Provide macros (protein, carbs, fat, fiber)
5. Rate confidence (1-10)
6. Suggest improvements for accuracy

Format as JSON:
{
  "items": [
    {
      "name": "food_name",
      "portion": "estimated_amount",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "confidence": number
    }
  ],
  "total": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  },
  "accuracy_notes": "suggestions for better photo"
}`,

    barcode_analysis: `Analyze this barcode/product and provide complete nutritional information including serving size, calories, and all macronutrients.`,
    
    text_description: `Parse this food description and estimate nutritional values: `,
  },
};

module.exports = config; 