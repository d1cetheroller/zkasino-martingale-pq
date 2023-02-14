import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import { ethers, parseEther } from "ethers";

const ZKASINO_ABI = [
  "function CoinFlip_Play(uint256 wager,address tokenAddress,bool isHeads,uint32 numBets,uint256 stopGain,uint256 stopLoss)"
]
const USDC_ABI = [
  "function balanceOf(address account) view returns (uint)"
]

const ZKASINO_ADDR = "0x6acb199b7c8c67832f516f70d25fcd9d6db0ae9d";
const USDC_ADDR = "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75"
const provider = new ethers.JsonRpcProvider("https://rpc.ftm.tools")
const signer = new ethers.Wallet(process.env.PK, provider);
const ZKASINO_CONTRACT = new ethers.Contract(ZKASINO_ADDR, ZKASINO_ABI, signer)
const USDC_CONTRACT = new ethers.Contract(USDC_ADDR, USDC_ABI, provider)

// params
const wager = "1000000";
const IS_HEAD = true
const numBets = 1
// construct like this because we dont set the tp and sl
const stopGain = "1000000000000000000000000000000000000000000000000000000000000000";
const stopLoss = "1000000000000000000000000000000000000000000000000000000000000000";

async function main() {
  while (true) {
    sleep(60000)
    const beforeBalance = await USDC_CONTRACT.balanceOf(signer.address);
    console.log("before balance", parseUSDCwei(beforeBalance))

    const options = { value: parseEther("1.0") }
    const bet = await ZKASINO_CONTRACT.CoinFlip_Play(
      wager,
      USDC_ADDR,
      IS_HEAD,
      numBets,
      stopGain,
      stopLoss,
      options
    );
    console.log("bet sent")

    sleep(60000)
    const afterBalance = await USDC_CONTRACT.balanceOf(signer.address);
    console.log("after balance", parseUSDCwei(afterBalance))
  }
}

function parseUSDCwei(amount) {
  const usdc = parseInt(amount) / 10 ** 6;
  return usdc
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
