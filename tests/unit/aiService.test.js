const aiService = require("../../services/aiService");
const config = require("../../config/ai-config");

// Mock axios for testing
jest.mock("axios");
const axios = require("axios");

describe("FoodAIService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("analyzeFood", () => {
    test("should successfully analyze food image with high confidence", async () => {
      // Mock GPT-4 Vision response
      const mockGPT4Response = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [
                    {
                      name: "apple",
                      portion: "1 medium",
                      calories: 95,
                      protein: 0.5,
                      carbs: 25,
                      fat: 0.3,
                      confidence: 0.9,
                    },
                  ],
                  total: {
                    calories: 95,
                    protein: 0.5,
                    carbs: 25,
                    fat: 0.3,
                  },
                }),
              },
            },
          ],
        },
      };

      axios.post.mockResolvedValueOnce(mockGPT4Response);

      const imageBuffer = Buffer.from("fake-image-data");
      const result = await aiService.analyzeFood(imageBuffer);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].name).toBe("apple");
      expect(result.data.items[0].calories).toBe(95);
      expect(result.data.confidence).toBeGreaterThan(0.8);
    });

    test("should handle GPT-4 Vision API errors gracefully", async () => {
      axios.post.mockRejectedValueOnce(new Error("API Error"));

      const imageBuffer = Buffer.from("fake-image-data");
      const result = await aiService.analyzeFood(imageBuffer);

      expect(result.success).toBe(false);
      expect(result.error).toBe("API Error");
      expect(result.fallback).toBeDefined();
      expect(result.fallback.items).toHaveLength(1);
    });

    test("should enhance analysis with volume estimation", async () => {
      const mockGPT4Response = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [
                    {
                      name: "pizza slice",
                      portion: "1 slice",
                      calories: 300,
                      protein: 12,
                      carbs: 35,
                      fat: 12,
                      confidence: 0.8,
                    },
                  ],
                  total: { calories: 300, protein: 12, carbs: 35, fat: 12 },
                }),
              },
            },
          ],
        },
      };

      axios.post.mockResolvedValueOnce(mockGPT4Response);

      const imageBuffer = Buffer.from("fake-image-data");
      const metadata = {
        depth: 5,
        dimensions: { width: 10, height: 8 },
      };

      const result = await aiService.analyzeFood(imageBuffer, metadata);

      expect(result.success).toBe(true);
      expect(result.data.volume_enhanced).toBe(true);
      // Volume adjustment should modify calories
      expect(result.data.items[0].calories).not.toBe(300);
    });
  });

  describe("analyzeWithGPT4Vision", () => {
    test("should parse valid JSON response correctly", async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [
                    {
                      name: "banana",
                      portion: "1 medium",
                      calories: 105,
                      protein: 1.3,
                      carbs: 27,
                      fat: 0.4,
                      confidence: 0.95,
                    },
                  ],
                  total: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
                }),
              },
            },
          ],
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await aiService.analyzeWithGPT4Vision("base64-image");

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("banana");
      expect(result.confidence).toBe(0.95);
      expect(result.provider).toBe("gpt4-vision");
    });

    test("should handle malformed JSON gracefully", async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content:
                  "This is not valid JSON, but contains food information",
              },
            },
          ],
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await aiService.analyzeWithGPT4Vision("base64-image");

      expect(result.provider).toBe("text-fallback");
      expect(result.items).toHaveLength(1);
    });

    test("should throw error on API failure", async () => {
      axios.post.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        aiService.analyzeWithGPT4Vision("base64-image")
      ).rejects.toThrow("Network error");
    });
  });

  describe("analyzeTextDescription", () => {
    test("should analyze text description successfully", async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [
                    {
                      name: "chicken breast",
                      portion: "200g",
                      calories: 330,
                      protein: 62,
                      carbs: 0,
                      fat: 7.4,
                      confidence: 0.8,
                    },
                  ],
                  total: { calories: 330, protein: 62, carbs: 0, fat: 7.4 },
                }),
              },
            },
          ],
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await aiService.analyzeTextDescription(
        "grilled chicken breast 200 grams"
      );

      expect(result.items[0].name).toBe("chicken breast");
      expect(result.items[0].protein).toBe(62);
      expect(result.provider).toBe("gpt4-text");
      expect(result.confidence).toBe(0.8);
    });
  });

  describe("calculateOverallConfidence", () => {
    test("should calculate average confidence correctly", () => {
      const analysis = {
        items: [{ confidence: 0.9 }, { confidence: 0.8 }, { confidence: 0.7 }],
      };

      const confidence = aiService.calculateOverallConfidence(analysis);
      expect(confidence).toBe(0.8);
    });

    test("should return 0 for empty items array", () => {
      const analysis = { items: [] };
      const confidence = aiService.calculateOverallConfidence(analysis);
      expect(confidence).toBe(0);
    });

    test("should handle missing confidence values", () => {
      const analysis = {
        items: [
          { confidence: 0.9 },
          {}, // No confidence property
          { confidence: 0.7 },
        ],
      };

      const confidence = aiService.calculateOverallConfidence(analysis);
      expect(confidence).toBe(0.7); // (0.9 + 0.5 + 0.7) / 3
    });
  });

  describe("calculateTotals", () => {
    test("should sum nutritional values correctly", () => {
      const items = [
        { calories: 100, protein: 5, carbs: 20, fat: 3 },
        { calories: 200, protein: 10, carbs: 15, fat: 8 },
        { calories: 150, protein: 7, carbs: 25, fat: 5 },
      ];

      const totals = aiService.calculateTotals(items);

      expect(totals.calories).toBe(450);
      expect(totals.protein).toBe(22);
      expect(totals.carbs).toBe(60);
      expect(totals.fat).toBe(16);
    });

    test("should handle missing values gracefully", () => {
      const items = [
        { calories: 100, protein: 5 }, // Missing carbs and fat
        { carbs: 15, fat: 8 }, // Missing calories and protein
      ];

      const totals = aiService.calculateTotals(items);

      expect(totals.calories).toBe(100);
      expect(totals.protein).toBe(5);
      expect(totals.carbs).toBe(15);
      expect(totals.fat).toBe(8);
    });
  });

  describe("applyUserCorrections", () => {
    test("should apply user corrections to recognized foods", async () => {
      const analysis = {
        items: [
          {
            name: "apple",
            calories: 100,
            protein: 1,
            carbs: 25,
            fat: 0.5,
            confidence: 0.8,
          },
        ],
      };

      const result = await aiService.applyUserCorrections(analysis);

      // Should apply apple correction (0.9 multiplier for calories)
      expect(result.items[0].calories).toBe(90);
      expect(result.items[0].ml_corrected).toBe(true);
      expect(result.items[0].confidence).toBe(0.9);
    });

    test("should not modify unrecognized foods", async () => {
      const analysis = {
        items: [
          {
            name: "exotic fruit",
            calories: 100,
            protein: 1,
            carbs: 25,
            fat: 0.5,
            confidence: 0.8,
          },
        ],
      };

      const result = await aiService.applyUserCorrections(analysis);

      expect(result.items[0].calories).toBe(100);
      expect(result.items[0].ml_corrected).toBeUndefined();
    });
  });

  describe("enhanceWithVolumeEstimation", () => {
    test("should adjust portions based on volume", async () => {
      const analysis = {
        items: [
          {
            name: "pasta",
            portion: "100 grams",
            calories: 200,
            protein: 8,
            carbs: 40,
            fat: 2,
          },
        ],
      };

      const metadata = {
        depth: 10,
        dimensions: { width: 10, height: 10 },
      };

      const result = await aiService.enhanceWithVolumeEstimation(
        analysis,
        metadata
      );

      expect(result.volume_enhanced).toBe(true);
      expect(result.items[0].portion).toBe("1000 grams"); // Should be adjusted
      expect(result.items[0].calories).toBeGreaterThan(200);
    });

    test("should return original analysis if no depth metadata", async () => {
      const analysis = { items: [{ calories: 100 }] };
      const metadata = {};

      const result = await aiService.enhanceWithVolumeEstimation(
        analysis,
        metadata
      );

      expect(result).toEqual(analysis);
      expect(result.volume_enhanced).toBeUndefined();
    });
  });

  describe("adjustPortionByVolume", () => {
    test("should adjust numeric portions correctly", () => {
      const result = aiService.adjustPortionByVolume("100 grams", 1.5);
      expect(result).toBe("150 grams");
    });

    test("should handle portions without numbers", () => {
      const result = aiService.adjustPortionByVolume("medium serving", 1.5);
      expect(result).toBe("medium serving");
    });
  });

  describe("formatNutritionixResponse", () => {
    test("should format Nutritionix response correctly", () => {
      const mockData = {
        foods: [
          {
            food_name: "banana",
            serving_qty: 1,
            serving_unit: "medium",
            nf_calories: 105,
            nf_protein: 1.3,
            nf_total_carbohydrate: 27,
            nf_total_fat: 0.4,
          },
        ],
      };

      const result = aiService.formatNutritionixResponse(mockData);

      expect(result.items[0].name).toBe("banana");
      expect(result.items[0].portion).toBe("1 medium");
      expect(result.items[0].calories).toBe(105);
      expect(result.provider).toBe("nutritionix");
    });

    test("should return null for empty foods array", () => {
      const mockData = { foods: [] };
      const result = aiService.formatNutritionixResponse(mockData);
      expect(result).toBeNull();
    });
  });
});

// Performance Tests
describe("FoodAIService Performance Tests", () => {
  test("should complete food analysis within reasonable time", async () => {
    const startTime = Date.now();

    // Mock quick response
    axios.post.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [
                  {
                    name: "test",
                    calories: 100,
                    protein: 5,
                    carbs: 15,
                    fat: 3,
                    confidence: 0.8,
                  },
                ],
                total: { calories: 100, protein: 5, carbs: 15, fat: 3 },
              }),
            },
          },
        ],
      },
    });

    const imageBuffer = Buffer.from("test-image");
    await aiService.analyzeFood(imageBuffer);

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Should complete within 5 seconds (generous for unit test)
    expect(processingTime).toBeLessThan(5000);
  });
});

// Edge Cases
describe("FoodAIService Edge Cases", () => {
  test("should handle very large image buffers", async () => {
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB

    axios.post.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [],
                total: { calories: 0, protein: 0, carbs: 0, fat: 0 },
              }),
            },
          },
        ],
      },
    });

    const result = await aiService.analyzeFood(largeBuffer);
    expect(result.success).toBe(true);
  });

  test("should handle empty image buffer", async () => {
    const emptyBuffer = Buffer.alloc(0);
    const result = await aiService.analyzeFood(emptyBuffer);

    expect(result.success).toBe(false);
    expect(result.fallback).toBeDefined();
  });

  test("should handle malformed API responses", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        choices: [], // Empty choices array
      },
    });

    await expect(
      aiService.analyzeWithGPT4Vision("test-image")
    ).rejects.toThrow();
  });
});
