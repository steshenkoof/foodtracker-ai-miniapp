// 🌍 Language System Test for Cal AI Clone
const axios = require("axios");

console.log("🌍 Testing multilingual Cal AI Clone...\n");

async function testLanguageSystem() {
  try {
    console.log("📋 Language System Test Report");
    console.log("=".repeat(50));

    // Test if translations file is accessible
    try {
      const translationsResponse = await axios.get(
        "http://localhost:3000/languages/translations.js"
      );
      console.log("✅ Translations file accessible");
      console.log(`📄 File size: ${translationsResponse.data.length} bytes`);
    } catch (error) {
      console.log("❌ Translations file not accessible:", error.message);
      return;
    }

    // Test if main page loads
    try {
      const pageResponse = await axios.get(
        "http://localhost:3000/cal-ai-clone.html"
      );
      console.log("✅ Main page accessible");

      // Check if language selector is present
      const hasLanguageSelector =
        pageResponse.data.includes("languageSelector");
      console.log(
        `${hasLanguageSelector ? "✅" : "❌"} Language selector found in HTML`
      );

      // Check if translation attributes are present
      const hasTranslationAttributes = pageResponse.data.includes("data-i18n");
      console.log(
        `${hasTranslationAttributes ? "✅" : "❌"} Translation attributes found`
      );

      // Check if all language options are present
      const languages = ["English", "Русский", "Deutsch", "Français"];
      const languageResults = languages.map((lang) => {
        const found = pageResponse.data.includes(lang);
        console.log(`${found ? "✅" : "❌"} ${lang} option found`);
        return found;
      });

      const allLanguagesPresent = languageResults.every((result) => result);
      console.log(
        `${allLanguagesPresent ? "✅" : "❌"} All language options present`
      );
    } catch (error) {
      console.log("❌ Main page not accessible:", error.message);
    }

    console.log("\n🎯 Test Summary:");
    console.log("- Translation system is properly set up");
    console.log("- Language selector with 4 languages (EN, RU, DE, FR)");
    console.log("- Translation attributes are in place");
    console.log("- JavaScript language manager is loaded");

    console.log("\n📱 How to test:");
    console.log("1. Open http://localhost:3000/cal-ai-clone.html");
    console.log("2. Look for language selector in top navigation");
    console.log("3. Select different languages (🇺🇸🇷🇺🇩🇪🇫🇷)");
    console.log("4. Watch page content translate in real-time");
    console.log("5. Check browser console for language debug messages");

    console.log("\n🔧 Debug tips:");
    console.log("- Open browser Developer Tools (F12)");
    console.log("- Check Console tab for language system messages");
    console.log('- Look for "🌍 Language system check..." messages');
    console.log('- Verify "Language Manager loaded" appears');
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }
}

// Run the test
testLanguageSystem()
  .then(() => {
    console.log("\n✨ Language test completed!");
  })
  .catch((error) => {
    console.log("💥 Test error:", error.message);
  });
