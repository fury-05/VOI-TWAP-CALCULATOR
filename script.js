document.getElementById('calculate-btn').addEventListener('click', async () => {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const usdAmountInput = document.getElementById('usd-amount');

    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const usdAmount = parseFloat(usdAmountInput.value);

    // Validate inputs
    if (!startDateInput.value || !endDateInput.value || isNaN(usdAmount) || usdAmount <= 0) {
        alert('Please enter valid start date, end date, and amount in USD.');
        return;
    }

    const cryptoId = "voi-network";

    // Convert date to timestamp (in seconds)
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // API URL
    const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart/range?vs_currency=usd&from=${startTimestamp}&to=${endTimestamp}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        // Calculate TWAP (Time-Weighted Average Price)
        let totalVolume = 0;
        let totalValue = 0;

        for (const priceData of data.prices) {
            const price = priceData[1]; // Price in USD
            const volume = priceData[0] / 1000; // Volume in thousands
            totalValue += price * volume;
            totalVolume += volume;
        }

        const twap = totalValue / totalVolume;
        const voiAmount = usdAmount / twap;
        const currentPrice = data.prices[data.prices.length - 1][1]; // Last price
        const priceDifferencePercent = ((currentPrice - twap) / twap) * 100;

        const amountIfSoldAtTWAP = voiAmount * twap;
        const differenceIfSoldAtTWAP = amountIfSoldAtTWAP - usdAmount;

        const amountIfSoldAtCurrent = voiAmount * currentPrice;
        const differenceIfSoldAtCurrent = amountIfSoldAtCurrent - usdAmount;

        // Output results
        document.getElementById('voi-twap').textContent = twap.toFixed(6);
        document.getElementById('voi-amount').textContent = voiAmount.toFixed(6);
        document.getElementById('current-price').textContent = currentPrice.toFixed(6);
        document.getElementById('price-difference').textContent = priceDifferencePercent.toFixed(2) + '%';
        document.getElementById('amount-if-sold-twap').textContent = amountIfSoldAtTWAP.toFixed(2) + ' USD';
        document.getElementById('difference-if-sold-twap').textContent = differenceIfSoldAtTWAP.toFixed(2) + ' USD';
        document.getElementById('amount-if-sold-current').textContent = amountIfSoldAtCurrent.toFixed(2) + ' USD';
        document.getElementById('difference-if-sold-current').textContent = differenceIfSoldAtCurrent.toFixed(2) + ' USD';

        // Status Indicator
        const status = document.getElementById('status');
        if (amountIfSoldAtCurrent > usdAmount) {
            status.textContent = `Profit of ${((differenceIfSoldAtCurrent / usdAmount) * 100).toFixed(2)}%`;
            status.className = 'status green'; // Green for profit
        } else if (amountIfSoldAtCurrent < usdAmount) {
            status.textContent = `Loss of ${((differenceIfSoldAtCurrent / usdAmount) * 100).toFixed(2)}%`;
            status.className = 'status red'; // Red for loss
        } else {
            status.textContent = 'No Change (0%)';
            status.className = 'status yellow'; // Yellow for no change
        }

        // Show result section
        const resultDiv = document.querySelector('.result');
        resultDiv.style.opacity = 1; // Make results visible
        resultDiv.style.display = 'block'; // Make results visible
    } catch (error) {
        alert('An error occurred: ' + error.message);
    }
});
