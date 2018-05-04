const bittrex = require("../node.bittrex.api");
const fs = require("fs");

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
              const fileName = `${data_for.MarketName}.log`.toLowerCase();
              fs.appendFile(fileName, JSON.stringify(data_for), function (err) {
                if (err) throw err;
                // console.log(`Added data to ${fileName} file.`);
              });
              
            });
          }
        });
        
        // bittrex.websockets.subscribe(["BTC-OMG"], function (data, client) {
        //   if (data.M === "updateExchangeState") {
        //     data.A.forEach(function (data_for) {
        //       console.log("Market Update for " + data_for.MarketName);
        //     });
        //   }
        // });
      }
    }
  });
}

main().then(() => console.log("done")).catch(error => console.error(error));