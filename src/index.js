import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import { ethers, parseEther } from "ethers";
import {
  MinPriorityQueue,
  MaxPriorityQueue,
  PriorityQueue,
} from '@datastructures-js/priority-queue';

const ZKASINO_ABI = [
  "function CoinFlip_Play(uint256 wager,address tokenAddress,bool isHeads,uint32 numBets,uint256 stopGain,uint256 stopLoss)"
]
const USDC_ABI = [
  "function balanceOf(address account) view returns (uint)"
]

const ZKASINO_ADDR = "0x6acb199b7c8c67832f516f70d25fcd9d6db0ae9d";
const USDC_ADDR = "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75"
// const provider = new ethers.JsonRpcProvider("https://rpc.ftm.tools")
const provider = new ethers.JsonRpcProvider("https://sparkling-prettiest-gadget.fantom.discover.quiknode.pro/277c94d88347bca66107aa8bdb69294b655cbd79/")
const signer = new ethers.Wallet(process.env.PK, provider);
const ZKASINO_CONTRACT = new ethers.Contract(ZKASINO_ADDR, ZKASINO_ABI, signer)
const USDC_CONTRACT = new ethers.Contract(USDC_ADDR, USDC_ABI, provider)

// params
// const wager = "1000000";
const IS_HEAD = false
const numBets = 1
// construct like this because we dont set the tp and sl
const stopGain = "1000000000000000000000000000000000000000000000000000000000000000";
const stopLoss = "1000000000000000000000000000000000000000000000000000000000000000";

async function main() {
  // max pain
  // const wage = [2000000, 4000000, 9000000, 19000000, 40000000, 82000000, 168000000];
  // med pain
  const wage = [2000000, 4000000, 9000000, 19000000];
  let temp_fail_wage = []
  let pq;

  while (true) {
    pq = PriorityQueue.fromArray(wage, (a, b) => a - b);

    const beforeBalance = await USDC_CONTRACT.balanceOf(signer.address);

    const gasPrice = await provider.getFeeData()
    console.log(pq.front())
    const options = { value: parseEther("1.0"), gasPrice: gasPrice.gasPrice }
    await ZKASINO_CONTRACT.CoinFlip_Play(
      pq.front(),
      USDC_ADDR,
      IS_HEAD,
      numBets,
      stopGain,
      stopLoss,
      options,
    );

    // 5 min - we try long the game
    sleep(300000)
    const afterBalance = await USDC_CONTRACT.balanceOf(signer.address);
    if (parseUSDCwei(afterBalance) < parseUSDCwei(beforeBalance)) {
      temp_fail_wage.push(pq.front())
      pq.dequeue()
      console.log("loss")
    } else {
      console.log("gain")
      temp_fail_wage.forEach((wage) => pq.enqueue(wage));
      temp_fail_wage = []
      sleep(300000)
    }
  }
}

// function initPq() {
//   let numbers = [1, 2, 3, 4, 5, 6];

//   let pq;
//   pq = PriorityQueue.fromArray(numbers, (a, b) => a - b);
//   console.log("init pq", pq);
//   pq.dequeue(); // -1
//   pq.dequeue(); // -1
//   // pq.dequeue(); // -1
//   // console.log(numbers);
//   console.log(pq.front())
//   let a = [1, 2, 3];
//   a.forEach((a) => pq.enqueue(a));
//   console.log(pq); // [-5, -1, -2, 3, 0, 5, 4]
//   console.log(pq.front())
//   pq.dequeue()
//   console.log(pq.front())
//   pq.dequeue()
//   console.log(pq.front())

//   let b = [1, 2, 3];
//   b.forEach((b) => pq.enqueue(b));
//   console.log(pq.front())
//   pq.dequeue()
//   console.log(pq.front())
//   pq.dequeue()
//   console.log(pq.front())
// }

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
