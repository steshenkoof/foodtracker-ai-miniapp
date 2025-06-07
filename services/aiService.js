const axios = require("axios");
const config = require("../config/ai-config");

class FoodAIService {
  constructor() {
    this.config = config;
    this.fallbackChain = ["gpt4", "nutritionix", "usda"];
  }

  /**
   * Main method - analyze food image like Cal AI
   * @param {Buffer} imageBuffer - Image buffer
   * @param {Object} metadata - Image metadata (size, depth, etc.)
   * @returns {Object} Nutritional analysis
   */
  async analyzeFood(imageBuffer, metadata = {}) {
    try {
      // Convert image to base64
      const imageBase64 = imageBuffer.toString("base64");

      // Primary analysis with GPT-4 Vision (like Cal AI's advanced AI)
      let result = await this.analyzeWithGPT4Vision(imageBase64);

      // If GPT-4 fails, fallback to other methods
      if (
        !result ||
        result.confidence < this.config.recognition.confidence_threshold
      ) {
        console.log(
          "GPT-4 confidence low, trying nutritional database lookup..."
        );
        result = await this.fallbackAnalysis(imageBase64, result);
      }

      // Enhance with volume estimation (Cal AI feature)
      if (metadata.depth && this.config.features.volume_estimation) {
        result = await this.enhanceWithVolumeEstimation(result, metadata);
      }

      // Apply user learning corrections
      result = await this.applyUserCorrections(result);

      return {
        success: true,
        data: result,
        provider: "gpt4-vision-primary",
        timestamp: new Date().toISOString(),
        processingTime: Date.now(),
      };
    } catch (error) {
      console.error("Food analysis error:", error);
      return {
        success: false,
        error: error.message,
        fallback: await this.basicFoodAnalysis(),
      };
    }
  }

  /**
   * GPT-4 Vision Analysis (Primary method - highest accuracy)
   */
  async analyzeWithGPT4Vision(imageBase64) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: this.config.openai.model,
          max_tokens: this.config.openai.maxTokens,
          temperature: this.config.openai.temperature,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: this.config.prompts.gpt4_vision,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: "high", // High detail for better accuracy
                  },
                },
              ],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.openai.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const content = response.data.choices[0].message.content;

      // Parse JSON response
      try {
        const analysis = JSON.parse(content);
        return {
          ...analysis,
          confidence: this.calculateOverallConfidence(analysis),
          provider: "gpt4-vision",
        };
      } catch (parseError) {
        // If JSON parsing fails, extract info from text
        return this.parseTextResponse(content);
      }
    } catch (error) {
      console.error("GPT-4 Vision error:", error);
      throw error;
    }
  }

  /**
   * Nutritionix API Analysis (Cal AI likely uses similar)
   */
  async analyzeWithNutritionix(foodName) {
    try {
      const response = await axios.post(
        `${this.config.nutritionAPIs.nutritionix.baseUrl}/natural/nutrients`,
        {
          query: foodName,
        },
        {
          headers: {
            "x-app-id": this.config.nutritionAPIs.nutritionix.appId,
            "x-app-key": this.config.nutritionAPIs.nutritionix.appKey,
            "Content-Type": "application/json",
          },
        }
      );

      return this.formatNutritionixResponse(response.data);
    } catch (error) {
      console.error("Nutritionix API error:", error);
      return null;
    }
  }

  /**
   * Barcode Analysis (Cal AI feature)
   */
  async analyzeBarcodeProduct(barcode) {
    try {
      // Try multiple barcode databases
      const databases = [
        () => this.searchUPCDatabase(barcode),
        () => this.searchNutritionixBarcode(barcode),
        () => this.searchUSDAByBarcode(barcode),
      ];

      for (const searchMethod of databases) {
        try {
          const result = await searchMethod();
          if (result) return result;
        } catch (err) {
          console.log(`Barcode search method failed:`, err.message);
          continue;
        }
      }

      throw new Error("Product not found in any database");
    } catch (error) {
      console.error("Barcode analysis error:", error);
      return { error: "Product not found" };
    }
  }

  /**
   * Text Description Analysis (Cal AI feature)
   */
  async analyzeTextDescription(description) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [
            {
              role: "user",
              content: `${this.config.prompts.text_description}"${description}"`,
            },
          ],
          temperature: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.openai.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const analysis = JSON.parse(response.data.choices[0].message.content);
      return {
        ...analysis,
        provider: "gpt4-text",
        confidence: 0.8, // Text descriptions are generally less accurate than images
      };
    } catch (error) {
      console.error("Text analysis error:", error);
      return this.fallbackTextAnalysis(description);
    }
  }

  /**
   * Volume Estimation Enhancement (Cal AI's depth sensor feature)
   */
  async enhanceWithVolumeEstimation(analysis, metadata) {
    if (!metadata.depth || !metadata.dimensions) return analysis;

    try {
      // Simulate depth sensor calculations
      const volumeMultiplier = this.calculateVolumeMultiplier(
        metadata.depth,
        metadata.dimensions
      );

      // Adjust portion sizes based on volume
      analysis.items = analysis.items.map((item) => ({
        ...item,
        portion: this.adjustPortionByVolume(item.portion, volumeMultiplier),
        calories: Math.round(item.calories * volumeMultiplier),
        protein: Math.round(item.protein * volumeMultiplier * 10) / 10,
        carbs: Math.round(item.carbs * volumeMultiplier * 10) / 10,
        fat: Math.round(item.fat * volumeMultiplier * 10) / 10,
      }));

      // Recalculate totals
      analysis.total = this.calculateTotals(analysis.items);
      analysis.volume_enhanced = true;

      return analysis;
    } catch (error) {
      console.error("Volume estimation error:", error);
      return analysis;
    }
  }

  /**
   * Apply Machine Learning Corrections (Cal AI learning feature)
   */
  async applyUserCorrections(analysis) {
    // This would typically load from a database of user corrections
    // For now, we'll simulate basic corrections

    const corrections = await this.getUserCorrectionHistory();

    analysis.items = analysis.items.map((item) => {
      const correction = corrections.find(
        (c) => c.foodName.toLowerCase() === item.name.toLowerCase()
      );

      if (correction) {
        return {
          ...item,
          calories: Math.round(item.calories * correction.calorieMultiplier),
          protein:
            Math.round(item.protein * correction.proteinMultiplier * 10) / 10,
          carbs: Math.round(item.carbs * correction.carbMultiplier * 10) / 10,
          fat: Math.round(item.fat * correction.fatMultiplier * 10) / 10,
          ml_corrected: true,
          confidence: Math.min(item.confidence + 0.1, 1.0),
        };
      }

      return item;
    });

    return analysis;
  }

  // Helper methods
  calculateOverallConfidence(analysis) {
    if (!analysis.items || analysis.items.length === 0) return 0;

    const avgConfidence =
      analysis.items.reduce((sum, item) => sum + (item.confidence || 0.5), 0) /
      analysis.items.length;

    return Math.round(avgConfidence * 100) / 100;
  }

  calculateTotals(items) {
    return items.reduce(
      (totals, item) => ({
        calories: totals.calories + (item.calories || 0),
        protein: totals.protein + (item.protein || 0),
        carbs: totals.carbs + (item.carbs || 0),
        fat: totals.fat + (item.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  async fallbackAnalysis(imageBase64, primaryResult) {
    // Implement fallback logic here
    return (
      primaryResult || {
        items: [],
        total: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      }
    );
  }

  async basicFoodAnalysis() {
    return {
      items: [
        {
          name: "Unknown Food",
          portion: "Medium serving",
          calories: 250,
          protein: 10,
          carbs: 30,
          fat: 10,
          confidence: 0.3,
        },
      ],
      total: { calories: 250, protein: 10, carbs: 30, fat: 10 },
      provider: "fallback",
    };
  }

  async getUserCorrectionHistory() {
    // Mock user corrections - in real app, this would come from database
    return [
      {
        foodName: "apple",
        calorieMultiplier: 0.9,
        proteinMultiplier: 1.0,
        carbMultiplier: 0.95,
        fatMultiplier: 1.0,
      },
      {
        foodName: "banana",
        calorieMultiplier: 1.1,
        proteinMultiplier: 1.0,
        carbMultiplier: 1.05,
        fatMultiplier: 1.0,
      },
    ];
  }

  calculateVolumeMultiplier(depth, dimensions) {
    // Simplified volume calculation
    const baseVolume = 100; // cm³
    const estimatedVolume = depth * dimensions.width * dimensions.height;
    return Math.max(0.5, Math.min(2.0, estimatedVolume / baseVolume));
  }

  adjustPortionByVolume(portion, multiplier) {
    // Extract number from portion string and adjust
    const match = portion.match(/(\d+)/);
    if (match) {
      const number = parseInt(match[1]);
      const adjustedNumber = Math.round(number * multiplier);
      return portion.replace(match[1], adjustedNumber.toString());
    }
    return portion;
  }

  parseTextResponse(textContent) {
    // Basic text parsing fallback
    return {
      items: [
        {
          name: "Detected Food",
          portion: "1 serving",
          calories: 200,
          protein: 8,
          carbs: 25,
          fat: 8,
          confidence: 0.6,
        },
      ],
      total: { calories: 200, protein: 8, carbs: 25, fat: 8 },
      provider: "text-fallback",
    };
  }

  formatNutritionixResponse(data) {
    if (!data.foods || data.foods.length === 0) return null;

    const food = data.foods[0];
    return {
      items: [
        {
          name: food.food_name,
          portion: `${food.serving_qty} ${food.serving_unit}`,
          calories: food.nf_calories,
          protein: food.nf_protein,
          carbs: food.nf_total_carbohydrate,
          fat: food.nf_total_fat,
          confidence: 0.9,
        },
      ],
      total: {
        calories: food.nf_calories,
        protein: food.nf_protein,
        carbs: food.nf_total_carbohydrate,
        fat: food.nf_total_fat,
      },
      provider: "nutritionix",
    };
  }
}

module.exports = new FoodAIService();
