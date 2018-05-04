const bittrex = require("../node.bittrex.api");
const fs = require("fs");
const moment = require("moment");

async function getMarkets() {
  return new Promise((res, rej) => {
    bittrex.getmarketsummaries(function (response, err) {
      if (err) rej(err);
      if (!response.success) rej(response.message);
      res(response.result.map(m => m["MarketName"]));
    });
  });
}

async function main() {
  const markets = await getMarkets();
  let lastDate = "";
  
  console.log("Connecting ....");
  bittrex.websockets.client(function (client) {
    // connected - you can do any one-off connection events here
    //
    // Note: Reoccuring events like listen() and subscribe() should be done
    // in onConnect so that they are fired during a reconnection event.
    console.log("Connected");
  });
  
  bittrex.options({
    "verbose": true
  });
  
  bittrex.options({
    verbose   : true,
    websockets: {
      onConnect: function () {
        console.log("onConnect fired");
        bittrex.websockets.subscribe(markets, function (data, client) {
          if (data.M === "updateExchangeState") {
            data.A.forEach(function (data_for) {
              // console.log("Market Update for " + data_for.MarketName, data_for.Sells);
              const timestamp = moment.now();
              const today = moment.unix(timestamp / 1000).format("YYYYMMDD");
              const fileName = `${today}/${data_for.MarketName}.log`.toLowerCase();
              if (lastDate !== today) {
                lastDate = today;
                try {
                  fs.mkdirSync(today);
                } catch (e) {
                  console.error(e);
                }
              }
              data_for["timestamp"] = timestamp;
              fs.appendFile(fileName, JSON.stringify(data_for) + "\n", function (err) {
                if (err) throw err;
              });
              
            });
          }
        });
      }
    }
  });
}

main().then(() => console.log("done")).catch(e => console.error(e));