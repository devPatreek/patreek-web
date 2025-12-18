// --- PATREEK WIDGET SMOKE TEST ---

async function testWidgets() {
    console.log("🚀 Starting Widget Smoke Test...");

    // 1. Test Crypto (CoinGecko)
    try {
        console.log("💰 Fetching Bitcoin Price...");
        const cryptoRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true");
        if (!cryptoRes.ok) throw new Error(`Crypto Status: ${cryptoRes.status}`);
        const cryptoData = await cryptoRes.json();
        console.log("✅ Crypto Success:", cryptoData);
    } catch (e) {
        console.error("❌ Crypto Failed:", e.message);
    }

    // 2. Test Weather (Open-Meteo) - Simulating NY coordinates
    try {
        console.log("🌤️ Fetching Weather...");
        const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true");
        if (!weatherRes.ok) throw new Error(`Weather Status: ${weatherRes.status}`);
        const weatherData = await weatherRes.json();
        console.log("✅ Weather Success:", weatherData.current_weather);
    } catch (e) {
        console.error("❌ Weather Failed:", e.message);
    }

    console.log("🏁 Test Complete.");
}

testWidgets();
