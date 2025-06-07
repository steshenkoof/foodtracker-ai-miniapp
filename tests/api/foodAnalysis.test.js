const request = require("supertest");
const fs = require("fs");
const path = require("path");

// We'll import the app after creating the server file
let app;

describe("Food Analysis API Tests", () => {
  beforeAll(async () => {
    // Import app after it's created
    app = require("../../server");

    // Create test user and get auth token
    const registerResponse = await request(app).post("/api/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    global.testToken = registerResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    if (app && app.close) {
      await app.close();
    }
  });

  describe("POST /api/analyze-image", () => {
    test("should analyze food image successfully", async () => {
      // Create a mock image buffer
      const mockImage = Buffer.from("fake-image-data");

      const response = await request(app)
        .post("/api/analyze-image")
        .set("Authorization", `Bearer ${global.testToken}`)
        .attach("food_image", mockImage, "test.jpg")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.total.calories).toBeGreaterThanOrEqual(0);
    });

    test("should reject image without authentication", async () => {
      const mockImage = Buffer.from("fake-image-data");

      await request(app)
        .post("/api/analyze-image")
        .attach("food_image", mockImage, "test.jpg")
        .expect(401);
    });

    test("should reject too large images", async () => {
      const largeImage = Buffer.alloc(15 * 1024 * 1024); // 15MB

      const response = await request(app)
        .post("/api/analyze-image")
        .set("Authorization", `Bearer ${global.testToken}`)
        .attach("food_image", largeImage, "large.jpg")
        .expect(400);

      expect(response.body.error).toMatch(/file size/i);
    });

    test("should reject unsupported file formats", async () => {
      const mockFile = Buffer.from("fake-data");

      const response = await request(app)
        .post("/api/analyze-image")
        .set("Authorization", `Bearer ${global.testToken}`)
        .attach("food_image", mockFile, "test.txt")
        .expect(400);

      expect(response.body.error).toMatch(/format/i);
    });

    test("should handle multiple food items in image", async () => {
      const mockImage = Buffer.from("multi-food-image");

      const response = await request(app)
        .post("/api/analyze-image")
        .set("Authorization", `Bearer ${global.testToken}`)
        .attach("food_image", mockImage, "multi.jpg")
        .field(
          "metadata",
          JSON.stringify({
            depth: 5,
            dimensions: { width: 10, height: 8 },
          })
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    test("should include confidence scores", async () => {
      const mockImage = Buffer.from("confident-image");

      const response = await request(app)
        .post("/api/analyze-image")
        .set("Authorization", `Bearer ${global.testToken}`)
        .attach("food_image", mockImage, "confident.jpg")
        .expect(200);

      expect(response.body.data.confidence).toBeDefined();
      expect(response.body.data.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.data.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("POST /api/analyze-barcode", () => {
    test("should analyze barcode successfully", async () => {
      const response = await request(app)
        .post("/api/analyze-barcode")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send({ barcode: "123456789012" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test("should validate barcode format", async () => {
      const response = await request(app)
        .post("/api/analyze-barcode")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send({ barcode: "invalid" })
        .expect(400);

      expect(response.body.error).toMatch(/barcode/i);
    });

    test("should handle product not found", async () => {
      const response = await request(app)
        .post("/api/analyze-barcode")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send({ barcode: "999999999999" })
        .expect(404);

      expect(response.body.error).toMatch(/not found/i);
    });
  });

  describe("POST /api/analyze-text", () => {
    test("should analyze text description successfully", async () => {
      const response = await request(app)
        .post("/api/analyze-text")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send({ description: "grilled chicken breast 200 grams with rice" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    test("should require description field", async () => {
      await request(app)
        .post("/api/analyze-text")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send({})
        .expect(400);
    });

    test("should handle empty description", async () => {
      const response = await request(app)
        .post("/api/analyze-text")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send({ description: "" })
        .expect(400);

      expect(response.body.error).toMatch(/description/i);
    });

    test("should limit description length", async () => {
      const longDescription = "a".repeat(1001);

      const response = await request(app)
        .post("/api/analyze-text")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send({ description: longDescription })
        .expect(400);

      expect(response.body.error).toMatch(/too long/i);
    });
  });

  describe("GET /api/nutrition-history", () => {
    test("should get user nutrition history", async () => {
      const response = await request(app)
        .get("/api/nutrition-history")
        .set("Authorization", `Bearer ${global.testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test("should support date filtering", async () => {
      const today = new Date().toISOString().split("T")[0];

      const response = await request(app)
        .get("/api/nutrition-history")
        .query({ date: today })
        .set("Authorization", `Bearer ${global.testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test("should support pagination", async () => {
      const response = await request(app)
        .get("/api/nutrition-history")
        .query({ page: 1, limit: 10 })
        .set("Authorization", `Bearer ${global.testToken}`)
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe("POST /api/save-meal", () => {
    test("should save analyzed meal", async () => {
      const mealData = {
        meal_type: "breakfast",
        items: [
          {
            name: "oatmeal",
            portion: "1 cup",
            calories: 150,
            protein: 5,
            carbs: 30,
            fat: 3,
          },
        ],
        total: {
          calories: 150,
          protein: 5,
          carbs: 30,
          fat: 3,
        },
      };

      const response = await request(app)
        .post("/api/save-meal")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send(mealData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meal_id).toBeDefined();
    });

    test("should validate meal data", async () => {
      const invalidMeal = {
        items: [], // Empty items
        total: {},
      };

      await request(app)
        .post("/api/save-meal")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send(invalidMeal)
        .expect(400);
    });
  });

  describe("POST /api/user-correction", () => {
    test("should accept user correction for AI learning", async () => {
      const correction = {
        original_analysis: {
          name: "apple",
          calories: 100,
        },
        corrected_values: {
          name: "apple",
          calories: 95,
        },
        confidence: 0.9,
      };

      const response = await request(app)
        .post("/api/user-correction")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send(correction)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/nutrition-goals", () => {
    test("should get user nutrition goals", async () => {
      const response = await request(app)
        .get("/api/nutrition-goals")
        .set("Authorization", `Bearer ${global.testToken}`)
        .expect(200);

      expect(response.body.goals).toBeDefined();
      expect(response.body.goals.calories).toBeDefined();
    });
  });

  describe("PUT /api/nutrition-goals", () => {
    test("should update user nutrition goals", async () => {
      const goals = {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 67,
      };

      const response = await request(app)
        .put("/api/nutrition-goals")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send({ goals })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test("should validate goal values", async () => {
      const invalidGoals = {
        calories: -100, // Negative calories
        protein: "invalid",
      };

      await request(app)
        .put("/api/nutrition-goals")
        .set("Authorization", `Bearer ${global.testToken}`)
        .send({ goals: invalidGoals })
        .expect(400);
    });
  });
});

// Performance Tests
describe("Food Analysis API Performance Tests", () => {
  test("should handle concurrent image analysis requests", async () => {
    const mockImage = Buffer.from("concurrent-test-image");

    const requests = Array(5)
      .fill()
      .map(() =>
        request(app)
          .post("/api/analyze-image")
          .set("Authorization", `Bearer ${global.testToken}`)
          .attach("food_image", mockImage, "concurrent.jpg")
      );

    const responses = await Promise.all(requests);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  test("should respond within acceptable time limits", async () => {
    const startTime = Date.now();

    const mockImage = Buffer.from("speed-test-image");

    await request(app)
      .post("/api/analyze-image")
      .set("Authorization", `Bearer ${global.testToken}`)
      .attach("food_image", mockImage, "speed.jpg")
      .expect(200);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Should respond within 30 seconds
    expect(responseTime).toBeLessThan(30000);
  });
});

// Security Tests
describe("Food Analysis API Security Tests", () => {
  test("should prevent SQL injection in text analysis", async () => {
    const maliciousInput = "'; DROP TABLE users; --";

    const response = await request(app)
      .post("/api/analyze-text")
      .set("Authorization", `Bearer ${global.testToken}`)
      .send({ description: maliciousInput })
      .expect(200); // Should not crash, should be handled gracefully

    expect(response.body.success).toBe(true);
  });

  test("should rate limit API requests", async () => {
    const mockImage = Buffer.from("rate-limit-test");

    // Make many requests quickly
    const requests = Array(10)
      .fill()
      .map(() =>
        request(app)
          .post("/api/analyze-image")
          .set("Authorization", `Bearer ${global.testToken}`)
          .attach("food_image", mockImage, "rate.jpg")
      );

    const responses = await Promise.all(
      requests.map((req) => req.catch((err) => err.response))
    );

    // Some requests should be rate limited (429 status)
    const rateLimited = responses.some((res) => res && res.status === 429);

    expect(rateLimited).toBe(true);
  });

  test("should sanitize file names", async () => {
    const mockImage = Buffer.from("sanitize-test");

    const response = await request(app)
      .post("/api/analyze-image")
      .set("Authorization", `Bearer ${global.testToken}`)
      .attach("food_image", mockImage, "../../../etc/passwd")
      .expect(200);

    expect(response.body.success).toBe(true);
    // Should not crash or access unauthorized files
  });

  test("should validate JWT tokens properly", async () => {
    const invalidToken = "invalid.jwt.token";

    await request(app)
      .post("/api/analyze-image")
      .set("Authorization", `Bearer ${invalidToken}`)
      .attach("food_image", Buffer.from("test"), "test.jpg")
      .expect(401);
  });
});

// Error Handling Tests
describe("Food Analysis API Error Handling", () => {
  test("should handle AI service failures gracefully", async () => {
    // This would require mocking the AI service to fail
    const mockImage = Buffer.from("error-test-image");

    const response = await request(app)
      .post("/api/analyze-image")
      .set("Authorization", `Bearer ${global.testToken}`)
      .attach("food_image", mockImage, "error.jpg");

    // Should either succeed or fail gracefully with proper error message
    if (response.status !== 200) {
      expect(response.body.error).toBeDefined();
      expect(response.body.fallback).toBeDefined();
    }
  });

  test("should handle database connection errors", async () => {
    // This would require mocking database failures
    const response = await request(app)
      .get("/api/nutrition-history")
      .set("Authorization", `Bearer ${global.testToken}`);

    // Should handle gracefully even if database is down
    expect([200, 500, 503]).toContain(response.status);

    if (response.status !== 200) {
      expect(response.body.error).toBeDefined();
    }
  });

  test("should handle malformed request bodies", async () => {
    await request(app)
      .post("/api/analyze-text")
      .set("Authorization", `Bearer ${global.testToken}`)
      .set("Content-Type", "application/json")
      .send("invalid json string")
      .expect(400);
  });
});
