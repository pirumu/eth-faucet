var express = require("express");
var router = express.Router();
const Web3 = require("web3");
const tether = require("../contract/tether");
const test_url =
  "https://ropsten.infura.io/v3/32be1ce36c1d43c6ab7a92712d7b0db6";
const DECIMALS = 1000000;
const UNIT_GWEI = 1000000000;
const network = "ropsten";
const web3 = new Web3(test_url);
const admin_address = "0x694CC5B13a86697C553Cece7C90F93C137FaC612";
const contract = new web3.eth.Contract(tether.abi, tether.address);
const BN = require("bignumber.js");
const privateKeyRaw =
  "ec73bbcd3d639051b4b4aac9a531f694e05d72d82c667bbb51d092bfa32a9aa5";
const TX = require("ethereumjs-tx");
const ETH = "eth";
const USDT = "usdt";
const BTC = "btc";
const BCH = "bch";
const PENDING = "pending";
const axios = require("axios").default;

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Vantt Faucet" });
});

router.post("/raw-transaction", async function (req, res, next) {
  const { to_address, coin_type } = req.body;
  console.log(req.body);
  const from_address = "0x694CC5B13a86697C553Cece7C90F93C137FaC612";
  let hash = "";
  let amount = 10;
  let coin_icon = "";
  let coin_name = "";
  switch (coin_type) {
    case ETH:
      coin_name = "Ethereum(ETH)";
      coin_icon = 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
      hash = await sendEth(from_address, to_address, amount);
      break;
    case USDT:
      coin_name = "Tether (USDT)";
      coin_icon = 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png';
      amount = 1000;
      hash = await sendUsdt(from_address, to_address, amount);
      break;
    case BTC:
      break;

    case BCH:
      break;
  }
 
   if(!hash) {
      res.status(500);
      res.json({ error: "something error" });
   }
  res.json({ hash: hash,type: coin_type,icon:coin_icon,name :coin_name});
});

/* GET home page. */
router.get("/balance", async function (req, res, next) {
  let eth_balance = await web3.eth.getBalance(admin_address);
  let usdt_balance = await await contract.methods
    .balanceOf(admin_address)
    .call();
  eth_balance = web3.utils.fromWei(eth_balance.toString(), "ether");
  usdt_balance = new BN(usdt_balance).dividedBy(DECIMALS);

  res.json({
    eth: new Intl.NumberFormat("en-IN", { maximumSignificantDigits: 3 }).format(
      eth_balance
    ),
    usdt: new Intl.NumberFormat("en-IN", {
      maximumSignificantDigits: 3,
    }).format(usdt_balance.toString()),
    btc: 0,
    bch: 0,
  });
});

const sendEth = async (sender, to, amount) => {
    try {

      amount = web3.utils.toWei(amount.toString(), "ether");
      let privateKey = Buffer.from(privateKeyRaw,'hex');
      const txCount = await web3.eth.getTransactionCount(sender, PENDING);
      let gas = await web3.eth.estimateGas({
        from: sender,
        to: to,
        value: web3.utils.toHex(amount.toString()),
      });
    
      const est = await axios.get("https://ethgasstation.info/api/ethgasAPI.json");
      const data = est.data
        ? est.data
        : {
            safeLow: 210,
            fastest: 900,
            average:500,
          };
    const gasPrice =  ( (new BN(UNIT_GWEI)).multipliedBy(data.average/10))
      const tx = new TX.Transaction(
        {
          nonce: web3.utils.toHex(txCount),
          from: sender,
          gasLimit: web3.utils.toHex(gas ? gas : "21000"),
          gasPrice: web3.utils.toHex(gasPrice),
          to: to,
          value: web3.utils.toHex(amount.toString()),
        },
        { chain: network }
      );
    
      tx.sign(privateKey);
    
      const serializedTx = tx.serialize();
    
      const raw = "0x" + serializedTx.toString("hex");
    
      // Broadcast Raw Transaction
    
      const tran = web3.eth.sendSignedTransaction(raw);
    
      const transactionPromiseBuilder = () =>
        new Promise((resolve, reject) => {
          tran.on("error", (err) => reject(err));
          tran.on("transactionHash", (hash) => resolve(hash));
        });
      const result = await transactionPromiseBuilder();
    
      return result;

    } catch (error) {
      return "";
      //console.log(error);
    }
};

const sendUsdt = async (sender, to, amount) => {
  try {
    let amountSend = (amount * DECIMALS).toString();
    let privateKey = Buffer.from(privateKeyRaw,'hex');
    const dataByte = contract.methods.transfer(to, amountSend).encodeABI();
    
    let gas = await web3.eth.estimateGas({
      from: sender,
      to: tether.address,
      data: dataByte,
    });

    const est = await axios.get(
      "https://ethgasstation.info/api/ethgasAPI.json"
    );

    const data = est.data
      ? est.data
      : {
          average: 800,
          safeLow: 210,
          fastest: 900,
        };
    const txCount = await web3.eth.getTransactionCount(sender, PENDING);
    const gasPrice =  ( (new BN(UNIT_GWEI)).multipliedBy(data.average/10));
    const tx = new TX.Transaction(
      {
        nonce: web3.utils.toHex(txCount),
        from: sender,
        gasLimit: web3.utils.toHex(gas ? gas : "56000"),
        gasPrice: web3.utils.toHex(gasPrice),
        to: tether.address,
        data: dataByte,
      },
      { chain: network }
    );

    tx.sign(privateKey);

    const serializedTx = tx.serialize();

    const raw = "0x" + serializedTx.toString("hex");

    // Broadcast Raw Transaction

    const tran = web3.eth.sendSignedTransaction(raw);

    const transactionPromiseBuilder = () =>
      new Promise((resolve, reject) => {
        tran.on("error", (error) => reject(error));

        tran.on("transactionHash", (hash) => resolve(hash));
      });
    const trxHash = await transactionPromiseBuilder();

    return trxHash;
  } catch (error) {
    console.log(error);
  }
};

module.exports = router;
