// Event listener for DOMContentLoaded to ensure the script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Event listener for form submission
    document.getElementById('lottoForm').addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent the default form submission

        // Retrieve and parse the input date
        const inputDate = new Date(document.getElementById('drawDate').value);
        const currentDate = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
        const oneYearAhead = new Date();
        oneYearAhead.setFullYear(currentDate.getFullYear() + 1);
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = '';

        // Validate the input date
        if (!inputDate || isNaN(inputDate)) {
            errorDiv.textContent = 'Please enter a valid date and time.';
            return;
        }

        // Validate the date range
        if (inputDate < oneYearAgo || inputDate > oneYearAhead) {
            errorDiv.textContent = 'Date must be within the past year or up to one year in the future.';
            return;
        }

        // Get the next lotto draw date
        const nextDrawDate = getNextLottoDraw(inputDate);

        try {
            console.log("Fetching Bitcoin value for draw date:", nextDrawDate);
            // Calculate the Bitcoin investment value for the next draw date
            const bitcoinValue = await calculateBitcoinInvestmentValue(nextDrawDate, currentDate);
            const tableRow = document.createElement('tr');
            tableRow.classList.add('fade-in');
            tableRow.innerHTML = `<td>${nextDrawDate.toLocaleString()}</td><td>${bitcoinValue.toFixed(2)} EUR</td>`;
            document.getElementById('resultsTable').appendChild(tableRow);
        } catch (error) {
            console.error("Error fetching Bitcoin data:", error);
            alert(error.message);
        }
    });

    // Function to get the next lotto draw date based on the input date
    function getNextLottoDraw(date) {
        const drawDays = [3, 6]; // Wednesday and Saturday
        const drawHour = 20; // 8 PM

        let nextDrawDate = new Date(date);
        nextDrawDate.setHours(drawHour, 0, 0, 0);

        // Increment the date until it matches a draw day and is in the future
        while (!drawDays.includes(nextDrawDate.getDay()) || nextDrawDate <= date) {
            nextDrawDate.setDate(nextDrawDate.getDate() + 1);
        }

        return nextDrawDate;
    }

    // Function to calculate the Bitcoin investment value
    async function calculateBitcoinInvestmentValue(drawDate, currentDate) {
        const formattedDate = `${drawDate.getDate().toString().padStart(2, '0')}-${(drawDate.getMonth() + 1).toString().padStart(2, '0')}-${drawDate.getFullYear()}`;
        const currentPriceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur`;
        let historicalPrice;

        // Fetch historical price if the draw date is in the past
        if (drawDate < currentDate) {
            const historicalPriceUrl = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${formattedDate}`;
            console.log("Formatted date for CoinGecko API:", formattedDate);
            console.log("Historical price API URL:", historicalPriceUrl);

            try {
                const historicalPriceResponse = await fetch(historicalPriceUrl);
                console.log("Historical price response status:", historicalPriceResponse.status);
                if (!historicalPriceResponse.ok) {
                    const responseText = await historicalPriceResponse.text();
                    console.error("Historical price response text:", responseText);
                    throw new Error('Failed to fetch historical Bitcoin data');
                }
                const historicalPriceData = await historicalPriceResponse.json();
                console.log("Historical price data:", historicalPriceData);
                if (!historicalPriceData.market_data || !historicalPriceData.market_data.current_price || !historicalPriceData.market_data.current_price.eur) {
                    throw new Error('Invalid historical data structure');
                }
                historicalPrice = historicalPriceData.market_data.current_price.eur;
            } catch (error) {
                console.error("Error in calculateBitcoinInvestmentValue function:", error);
                throw error;
            }
        } else {
            // If draw date is in the future, use the current price as historical price
            historicalPrice = null;
        }

        try {
            const currentPriceResponse = await fetch(currentPriceUrl);
            console.log("Current price response status:", currentPriceResponse.status);
            if (!currentPriceResponse.ok) {
                const responseText = await currentPriceResponse.text();
                console.error("Current price response text:", responseText);
                throw new Error('Failed to fetch current Bitcoin data');
            }
            const currentPriceData = await currentPriceResponse.json();
            console.log("Current price data:", currentPriceData);
            if (!currentPriceData.bitcoin || !currentPriceData.bitcoin.eur) {
                throw new Error('Invalid current data structure');
            }
            const currentPrice = currentPriceData.bitcoin.eur;

            // Calculate the investment value
            if (historicalPrice) {
                return (100 / historicalPrice) * currentPrice;
            } else {
                // Assume the investment is made today
                return 100 * currentPrice / currentPrice;
            }
        } catch (error) {
            console.error("Error in calculateBitcoinInvestmentValue function:", error);
            throw error;
        }
    }
});
