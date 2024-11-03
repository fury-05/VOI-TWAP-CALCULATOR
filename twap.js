const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const startDate = new Date('2024-10-01'); // Change Start Date
const endDate = new Date('2024-10-20'); // Change End Date
const usdAmount = 1000; // Amount in USD
const cryptoId = "voi-network";

// Convert date to timestamp (in seconds)
const startTimestamp = Math.floor(startDate.getTime() / 1000);
const endTimestamp = Math.floor(endDate.getTime() / 1000);

// API URLs for historical prices and current price
const historicalUrl = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart/range?vs_currency=usd&from=${startTimestamp}&to=${endTimestamp}`;
const currentPriceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`;

// Helper function to group prices by day and calculate daily averages
const groupByDay = (prices) => {
  const dailyPrices = {};

  // Iterate over each price point and group by day
  prices.forEach(([timestamp, price]) => {
    const date = new Date(timestamp).toISOString().split('T')[0]; // Extract only the date part (YYYY-MM-DD)
    if (!dailyPrices[date]) {
      dailyPrices[date] = [];
    }
    dailyPrices[date].push(price); // Add price to the array for that specific day
  });

  // Calculate the average price for each day
  return Object.values(dailyPrices).map(dayPrices => dayPrices.reduce((a, b) => a + b, 0) / dayPrices.length);
};

// Function to fetch current price of VOI
const fetchCurrentPrice = async () => {
  const response = await fetch(currentPriceUrl);
  const data = await response.json();
  return data[cryptoId].usd;
};

// Function to calculate price increase needed to match entered amount
const calculatePriceIncrease = (currentPrice, twap) => {
  const neededPrice = usdAmount / (usdAmount / twap); // TWAP price to match entered amount
  const priceDifference = neededPrice - currentPrice; // Difference from current price
  const percentageIncrease = (priceDifference / currentPrice) * 100; // Percentage increase needed

  return {
    neededPrice,
    priceDifference,
    percentageIncrease,
  };
};

// Fetch historical price data and calculate TWAP
fetch(historicalUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(async data => {
    const groupedPrices = groupByDay(data.prices); // Group by day and calculate daily averages
    const twap = groupedPrices.reduce((a, b) => a + b, 0) / groupedPrices.length; // Calculate TWAP
    const voiAmount = usdAmount / twap; // Calculate equivalent amount of VOI

    const currentPrice = await fetchCurrentPrice(); // Fetch current price
    const { neededPrice, priceDifference, percentageIncrease } = calculatePriceIncrease(currentPrice, twap); // Calculate price increase needed

    // Output the results
    console.log("Voi Time Weighted Average Price (TWAP):", twap.toFixed(6));
    console.log(`The VOI amount equivalent to ${usdAmount} USD from ${startDate.toISOString()} to ${endDate.toISOString()} is ${voiAmount.toFixed(6)}`);
    console.log("Current Market Price of VOI:", currentPrice.toFixed(6));
    console.log(`Price based on TWAP: ${usdAmount / voiAmount} USD/VOI`);
    
    // Additional calculations
    console.log(`Price needed to match the entered amount: ${neededPrice.toFixed(6)} USD/VOI`);
    console.log(`Price difference from current market price: ${priceDifference.toFixed(6)} USD`);
    console.log(`Percentage increase needed to match the entered amount: ${percentageIncrease.toFixed(2)}%`);
    
    // Calculate how much less you will get if you sell at TWAP price
    const amountIfSoldAtTwap = voiAmount * twap;
    const amountIfSoldAtCurrentPrice = voiAmount * currentPrice;
    const differenceIfSoldAtTwap = amountIfSoldAtCurrentPrice - amountIfSoldAtTwap;

    console.log(`If you sell at TWAP price, you will get ${amountIfSoldAtTwap.toFixed(6)} USD.`);
    console.log(`If you sell at current market price, you will get ${amountIfSoldAtCurrentPrice.toFixed(6)} USD.`);
    console.log(`You will receive ${differenceIfSoldAtTwap.toFixed(6)} USD less if sold at TWAP price.`);
  })
  .catch(error => {
    console.error("Error fetching data:", error);
  });
