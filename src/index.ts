import {
  createSlashCommandHandler,
  ApplicationCommand,
  InteractionHandler,
  Interaction,
  InteractionResponse,
  InteractionResponseType,
  ApplicationCommandOptionType,
} from "@glenstack/cf-workers-discord-bot";

const checkIsStock = (symbol: string) => {
  return symbol.length <= 5 && symbol.length > 0 && /^[a-zA-Z]*$/.test(symbol);
};
const formatNumber = (money: string, pureNum = false) => {
  if (money === "None") {
    return "None";
  }
  return (
    (pureNum ? "" : "$") +
    (money[0] === "-" ? "-" : "") +
    (Math.abs(Number(money)) >= 1.0e9
      ? (Math.abs(Number(money)) / 1.0e9).toFixed(2) + "B"
      : // Six Zeroes for Millions
      Math.abs(Number(money)) >= 1.0e6
      ? (Math.abs(Number(money)) / 1.0e6).toFixed(2) + "M"
      : // Three Zeroes for Thousands
      Math.abs(Number(money)) >= 1.0e3
      ? (Math.abs(Number(money)) / 1.0e3).toFixed(2) + "K"
      : Math.abs(Number(money)))
  );
};

const stockFound = (data: object) => {
  return Object.keys(data).length > 0;
};

// Hello
// --------------------------------------------------------------
const helloCommand: ApplicationCommand = {
  name: "hello",
  description: "Bot will say hello to you!",
};
const helloHandler: InteractionHandler = async (
  interaction: Interaction
): Promise<InteractionResponse> => {
  const userID = interaction.member.user.id;

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `Hello, <@${userID}>!`,
      allowed_mentions: {
        users: [userID],
      },
    },
  };
};
// --------------------------------------------------------------
const infoCommand: ApplicationCommand = {
  name: "info",
  description: "Get fundamental info of the a company",
  options: [
    {
      type: ApplicationCommandOptionType.STRING,
      name: "symbol",
      description: "The symbol of the company. Eg: TSLA",
      required: true,
    },
  ],
};

const infoHandler: InteractionHandler = async (
  interaction: Interaction
): Promise<InteractionResponse> => {
  const userID = interaction.member.user.id;
  // @ts-ignore
  const APIKEY = await CONFIG.get("API_KEY");
  const options = interaction.data.options;
  const symbol = options && options[0].value;
  const isStock = checkIsStock(symbol);
  let content = `😢 I couldn't find the symbol ${symbol}`;

  if (isStock) {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol.toUpperCase()}&apikey=${APIKEY}`
    );
    const data = await response.json();
    const stockIsFound = stockFound(data);
    console.log(`Data => ${JSON.stringify(data)}`);
    if (stockIsFound) {
      content = `
Hi,<@${userID}>. Here's the result:

__*Summary*__
**Symbol: **${data["Symbol"]}
**Name: **${data["Name"]}

**Sector & Industry: **
${data["Industry"]} (${data["Sector"]})

**Address: **
${data["Address"]}

**Description: **
${data["Description"]}

__*Valuation*__
**Forward PE: **  ${data["ForwardPE"]}
**Trailing PE: **   ${data["TrailingPE"]}
**PEG Ratio: **     ${data["PEGRatio"]}
**Book Value: **  ${data["PEGRatio"]}
**PS Ratio: **        ${data["PriceToSalesRatioTTM"]}
**PB Ratio: **        ${data["PriceToBookRatio"]}
**EPS: **               $${data["EPS"]}
**Revenue per Share (TTM): **          $${data["RevenuePerShareTTM"]}
      `;
    }
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: content,
      allowed_mentions: {
        users: [userID],
      },
    },
  };
};

// --------------------------------------------------------------

// --------------------------------------------------------------
const incomeCommand: ApplicationCommand = {
  name: "income",
  description: "Get annual and quarterly income statement of a symbol",
  options: [
    {
      type: ApplicationCommandOptionType.STRING,
      name: "symbol",
      description: "The symbol of the company. Eg: TSLA",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.STRING,
      name: "time",
      description: "Quarterly / Anually income statement",
      required: true,
      choices: [
        {
          name: "Anually",
          value: "Anually",
        },
        {
          name: "Quarterly",
          value: "Quarterly",
        },
      ],
    },
  ],
};
const incomeHandler: InteractionHandler = async (
  interaction: Interaction
): Promise<InteractionResponse> => {
  const userID = interaction.member.user.id;
  // @ts-ignore
  const APIKEY = await CONFIG.get("API_KEY");
  const options = interaction.data.options;
  console.log(`Options => ${JSON.stringify(options)}`);
  const symbolObj = options && options.find((obj) => obj.name === "symbol");
  const timeObj = options && options.find((obj) => obj.name === "time");
  if (!symbolObj || !timeObj) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "😢 An error occured",
        allowed_mentions: {
          users: [userID],
        },
      },
    };
  } else {
    const isStock = checkIsStock(symbolObj.value);
    let content = `😢 I couldn't find the symbol ${symbolObj.value}`;

    if (isStock) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${symbolObj.value.toUpperCase()}&apikey=${APIKEY}`
      );
      const data = await response.json();
      const stockIsFound = stockFound(data);
      console.log(`Data => ${JSON.stringify(data)}`);
      if (stockIsFound) {
        const stockData =
          timeObj.value === "Anually"
            ? data["annualReports"][0]
            : data["quarterlyReports"][0];
        const dataSymbol = data["symbol"];
        content = `
Hi,<@${userID}>. Here's the result of ${dataSymbol}:

**__Fiscal Date Ending: ${stockData["fiscalDateEnding"]}__**

**Gross Profit: **   ${formatNumber(stockData["grossProfit"])}
**Total Revenue: **   ${formatNumber(stockData["totalRevenue"])}
**Cost of Revenue: **   ${formatNumber(stockData["costOfRevenue"])}
**Cost of Goods and Service Sold: **   ${formatNumber(
          stockData["costofGoodsAndServicesSold"]
        )}
**Operating Income: **   ${formatNumber(stockData["operatingIncome"])}
**Selling General & Adminsistrative: **   ${formatNumber(
          stockData["sellingGeneralAndAdministrative"]
        )}
**R&D: **   ${formatNumber(stockData["researchAndDevelopment"])}
**Operating Expenses: **   ${formatNumber(stockData["operatingExpenses"])}
**Net Investment Income: **   ${formatNumber(stockData["investmentIncomeNet"])}
**Net Interest Income: **   ${formatNumber(stockData["netInterestIncome"])}
**Interest Income: **   ${formatNumber(stockData["interestIncome"])}
**Interest Expense: **   ${formatNumber(stockData["interestExpense"])}
**Non-interest Income: **   ${formatNumber(stockData["nonInterestIncome"])}
**Other Non-operating Income: **   ${formatNumber(
          stockData["otherNonOperatingIncome"]
        )}
**Depreciation: **   ${formatNumber(stockData["depreciation"])}
**Depreciation & Amortization: **   ${formatNumber(
          stockData["depreciationAndAmortization"]
        )}
**Income Before Tax: **   ${formatNumber(stockData["incomeBeforeTax"])}
**Income Tax Expense: **   ${formatNumber(stockData["incomeTaxExpense"])}
**Intrest and Debt Expense: **   ${formatNumber(
          stockData["interestAndDebtExpense"]
        )}
**Net Income from Continuing Operations: **   ${formatNumber(
          stockData["netIncomeFromContinuingOperations"]
        )}
**Comprehensive Income Net of Tax: **   ${formatNumber(
          stockData["comprehensiveIncomeNetOfTax"]
        )}
**EBIT: **   ${formatNumber(stockData["ebit"])}
**EBITDA: **   ${formatNumber(stockData["ebitda"])}
**Net Income: **   ${formatNumber(stockData["netIncome"])}
  `;
      }
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: content,
          allowed_mentions: {
            users: [userID],
          },
        },
      };
    }
  }
};

// --------------------------------------------------------------
// --------------------------------------------------------------
const balanceCommand: ApplicationCommand = {
  name: "balance",
  description: "Get annual and quarterly balance sheets of a symbol",
  options: [
    {
      type: ApplicationCommandOptionType.STRING,
      name: "symbol",
      description: "The symbol of the company. Eg: TSLA",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.STRING,
      name: "time",
      description: "Quarterly / Anually balance sheet",
      required: true,
      choices: [
        {
          name: "Anually",
          value: "Anually",
        },
        {
          name: "Quarterly",
          value: "Quarterly",
        },
      ],
    },
  ],
};
const balanceHandler: InteractionHandler = async (
  interaction: Interaction
): Promise<InteractionResponse> => {
  const userID = interaction.member.user.id;
  // @ts-ignore
  const APIKEY = await CONFIG.get("API_KEY");
  const options = interaction.data.options;
  const symbolObj = options && options.find((obj) => obj.name === "symbol");
  const timeObj = options && options.find((obj) => obj.name === "time");
  if (!symbolObj || !timeObj) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "😢 An error occured",
        allowed_mentions: {
          users: [userID],
        },
      },
    };
  } else {
    const isStock = checkIsStock(symbolObj.value);
    let content = `😢 I couldn't find the symbol ${symbolObj.value}`;

    if (isStock) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${symbolObj.value.toUpperCase()}&apikey=${APIKEY}`
      );
      const data = await response.json();
      const stockIsFound = stockFound(data);
      console.log(
        `Data => ${JSON.stringify(data)}, StockIsFound => ${stockIsFound}`
      );
      if (stockIsFound) {
        const stockData =
          timeObj.value === "Anually"
            ? data["annualReports"][0]
            : data["quarterlyReports"][0];
        const dataSymbol = data["symbol"];

        content = `
Hi,<@${userID}>. Here's the result of ${dataSymbol}:
**__Fiscal Date Ending: ${stockData["fiscalDateEnding"]}__**

**Total Assets: **   ${formatNumber(stockData["totalAssets"])}
**Total Current Assets: **   ${formatNumber(stockData["totalCurrentAssets"])}
**Cash and Cash Equivalents At Carrying Value: **   ${formatNumber(
          stockData["cashAndCashEquivalentsAtCarryingValue"]
        )}
**Cash & Short Term Investments: **   ${formatNumber(
          stockData["cashAndShortTermInvestments"]
        )}
**Inventory: **   ${formatNumber(stockData["inventory"])}
**Current Net Receivables: **   ${formatNumber(
          stockData["currentNetReceivables"]
        )}
**Total Noncurrent Assets: **   ${formatNumber(
          stockData["totalNonCurrentAssets"]
        )}
**Property, Plant & Equipment: **   ${formatNumber(
          stockData["propertyPlantEquipment"]
        )}
**Accumulated Depreciation, Depletion and Amortization, Property, Plant, and Equipment, Ending Balance : **   ${formatNumber(
          stockData["accumulatedDepreciationAmortizationPPE"]
        )}
**Intangible Assets: **   ${formatNumber(stockData["intangibleAssets"])}
**Intangible Assets Excluding Goodwill: **   ${formatNumber(
          stockData["intangibleAssetsExcludingGoodwill"]
        )}
**Goodwill: **   ${formatNumber(stockData["goodwill"])}
**Investments: **   ${formatNumber(stockData["investments"])}
**Long-term Investments: **   ${formatNumber(stockData["longTermInvestments"])}
**Short-term Investments: **   ${formatNumber(
          stockData["shortTermInvestments"]
        )}
**Other Assets, Current: **   ${formatNumber(stockData["otherCurrentAssets"])}
**Other Assets, Noncurrent: **   ${formatNumber(
          stockData["otherNonCurrrentAssets"]
        )}
**Total Liabilities: **   ${formatNumber(stockData["totalLiabilities"])}
**Total Current Liabilities: **   ${formatNumber(
          stockData["totalCurrentLiabilities"]
        )}
**Current Accounts Payable: **   ${formatNumber(
          stockData["currentAccountsPayable"]
        )}
**Deferred Revenue: **   ${formatNumber(stockData["deferredRevenue"])}
**Current Debt: **   ${formatNumber(stockData["currentDebt"])}
**Short-term Debt: **   ${formatNumber(stockData["shortTermDebt"])}
**Total Noncurrent Liabilities: **   ${formatNumber(
          stockData["totalNonCurrentLiabilities"]
        )}
**Noncurrent Finance Lease Liabilitiy: **   ${formatNumber(
          stockData["capitalLeaseObligations"]
        )}
**Long-term Debt: **   ${formatNumber(stockData["longTermDebt"])}
**Current Long-term Debt: **   ${formatNumber(stockData["currentLongTermDebt"])}
**Noncurrent Long-term Debt: **   ${formatNumber(
          stockData["longTermDebtNoncurrent"]
        )}
**Short-term & Long-term Debt Total: **   ${formatNumber(
          stockData["shortLongTermDebtTotal"]
        )}
**Other Current Liabilities: **   ${formatNumber(
          stockData["otherCurrentLiabilities"]
        )}
**Other Noncurrent Liabilities: **   ${formatNumber(
          stockData["otherNonCurrentLiabilities"]
        )}
**Total Shareholder Equity: **   ${formatNumber(
          stockData["totalShareholderEquity"]
        )}
**Treasury Stock: **   ${formatNumber(stockData["treasuryStock"])}
**Retained Earnings: **   ${formatNumber(stockData["retainedEarnings"])}
**Common Stock: **   ${formatNumber(stockData["commonStock"])}
**Common Stock, Shares Outstanding: **   ${formatNumber(
          stockData["commonStockSharesOutstanding"],
          true
        )}
  `;
        console.log(content);
      }
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: content,
        allowed_mentions: {
          users: [userID],
        },
      },
    };
  }
};

// --------------------------------------------------------------
// --------------------------------------------------------------
const cashflowCommand: ApplicationCommand = {
  name: "cashflow",
  description: "Get annual and quarterly cash flow of a symbol",
  options: [
    {
      type: ApplicationCommandOptionType.STRING,
      name: "symbol",
      description: "The symbol of the company. Eg: TSLA",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.STRING,
      name: "time",
      description: "Quarterly / Anually cash flow",
      required: true,
      choices: [
        {
          name: "Anually",
          value: "Anually",
        },
        {
          name: "Quarterly",
          value: "Quarterly",
        },
      ],
    },
  ],
};
const cashflowHandler: InteractionHandler = async (
  interaction: Interaction
): Promise<InteractionResponse> => {
  const userID = interaction.member.user.id;
  // @ts-ignore
  const APIKEY = await CONFIG.get("API_KEY");
  const options = interaction.data.options;
  const symbolObj = options && options.find((obj) => obj.name === "symbol");
  const timeObj = options && options.find((obj) => obj.name === "time");
  if (!symbolObj || !timeObj) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "😢 An error occured",
        allowed_mentions: {
          users: [userID],
        },
      },
    };
  } else {
    const isStock = checkIsStock(symbolObj.value);
    let content = `😢 I couldn't find the symbol ${symbolObj.value}`;

    if (isStock) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${symbolObj.value.toUpperCase()}&apikey=${APIKEY}`
      );
      const data = await response.json();
      const stockIsFound = stockFound(data);
      if (stockIsFound) {
        console.log(`Data => ${JSON.stringify(data)}`);
        const stockData =
          timeObj.value === "Anually"
            ? data["annualReports"][0]
            : data["quarterlyReports"][0];
        const dataSymbol = data["symbol"];
        content = `
  Hi,<@${userID}>. Here's the result of ${dataSymbol}:
  

**__Fiscal Date Ending: ${stockData["fiscalDateEnding"]}__**
**Operating Cash Flow: **   ${formatNumber(stockData["operatingCashflow"])}
**Payments for Operating Activities: **   ${formatNumber(
          stockData["paymentsForOperatingActivities"]
        )}
**Proceeds from Operating Activities: **   ${formatNumber(
          stockData["proceedsFromOperatingActivities"]
        )}
**Increase (Decrease) in Operating Liabilities: **   ${formatNumber(
          stockData["changeInOperatingLiabilities"]
        )}
**Increase (Decrease) in Operating Assets: **   ${formatNumber(
          stockData["changeInOperatingAssets"]
        )}
**Depreciation, Depletion and Amortization: **   ${formatNumber(
          stockData["depreciationDepletionAndAmortization"]
        )}
**Capital Expenditures: **   ${formatNumber(stockData["capitalExpenditures"])}
**Increase (Decrease) in Receivables: **   ${formatNumber(
          stockData["changeInReceivables"]
        )}
**Increase (Decrease) in Inventories: **   ${formatNumber(
          stockData["changeInInventory"]
        )}
**Net Income (Loss): **   ${formatNumber(stockData["profitLoss"])}
**Net Cash Provided by (Used in) Investing Activities: **   ${formatNumber(
          stockData["cashflowFromInvestment"]
        )}
**Net Cash Provided by (Used in) Financing Activities: **   ${formatNumber(
          stockData["cashflowFromFinancing"]
        )}
**Proceeds from (Repayments of) Short-term Debt: **   ${formatNumber(
          stockData["proceedsFromRepaymentsOfShortTermDebt"]
        )}
**Payments for Repurchase of Common Stock: **   ${formatNumber(
          stockData["paymentsForRepurchaseOfCommonStock"]
        )}
**Payments for Repurchase of Equity: **   ${formatNumber(
          stockData["paymentsForRepurchaseOfEquity"]
        )}
**Payments for Repurchase of Common Stock: **   ${formatNumber(
          stockData["paymentsForRepurchaseOfPreferredStock"]
        )}
**Payments of Dividends: **   ${formatNumber(stockData["dividendPayout"])}
**Payments of Ordinary Dividends, Common Stock: **   ${formatNumber(
          stockData["dividendPayoutCommonStock"]
        )}
**Payments of Ordinary Dividends, Preferred Stock and Preference Stock: **   ${formatNumber(
          stockData["dividendPayoutPreferredStock"]
        )}
**Proceeds from Issuance of Common Stock: **   ${formatNumber(
          stockData["proceedsFromIssuanceOfCommonStock"]
        )}
**Proceeds from Issuance of Long-term Debt and Capital Securities: **   ${formatNumber(
          stockData["proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet"]
        )}
**Proceeds from Issuance of Preferred Stock, Preference Stock: **   ${formatNumber(
          stockData["proceedsFromIssuanceOfPreferredStock"]
        )}
**Proceeds from (Repurchase of) Equity: **   ${formatNumber(
          stockData["proceedsFromRepurchaseOfEquity"]
        )}
**Proceeds from Sale of Treasury Stock: **   ${formatNumber(
          stockData["proceedsFromSaleOfTreasuryStock"]
        )}
**Cash and Cash Equivalents, Period Increase (Decrease): **   ${formatNumber(
          stockData["changeInCashAndCashEquivalents"]
        )}
**Effect of Exchange Rate on Cash and Cash Equivalents: **   ${formatNumber(
          stockData["changeInExchangeRate"]
        )}
**Net Income (Loss): **   ${formatNumber(stockData["netIncome"])}
      `;
      }
    }
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: content,
        allowed_mentions: {
          users: [userID],
        },
      },
    };
  }
};

// --------------------------------------------------------------

const slashCommandHandler = createSlashCommandHandler({
  applicationID: "902479383208546325",
  // @ts-ignore
  applicationSecret: APPLICATION_SECRET,
  publicKey: "499884f63a65f404cbf50c1d5cfcdd56b421681ea5f3d014b61685f1dcdb44f8",
  commands: [
    [helloCommand, helloHandler],
    [infoCommand, infoHandler],
    [incomeCommand, incomeHandler],
    [balanceCommand, balanceHandler],
    [cashflowCommand, cashflowHandler],
  ],
});

addEventListener("fetch", (event) => {
  try {
    event.respondWith(slashCommandHandler(event.request));
  } catch (e) {
    console.log(e);
  }
});
