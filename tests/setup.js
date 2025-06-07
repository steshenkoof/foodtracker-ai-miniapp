// Global test setup
global.console = {
  ...console,
  // Suppress console.log during tests unless needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret";
process.env.OPENAI_API_KEY = "test_openai_key";
process.env.NUTRITIONIX_APP_ID = "test_nutritionix_id";
process.env.NUTRITIONIX_APP_KEY = "test_nutritionix_key";

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test helpers
global.generateMockUser = () => ({
  id: 1,
  username: "testuser",
  email: "test@example.com",
  subscription_type: "free",
});

global.generateMockFoodAnalysis = () => ({
  success: true,
  data: {
    items: [
      {
        name: "Test Food",
        portion: "1 serving",
        calories: 100,
        protein: 10,
        carbs: 15,
        fat: 5,
        confidence: 0.9,
      },
    ],
    total: {
      calories: 100,
      protein: 10,
      carbs: 15,
      fat: 5,
    },
    confidence: 0.9,
  },
  provider: "test",
});
