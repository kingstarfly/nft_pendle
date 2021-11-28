# Team CryptoDipto: Pendle Liquidity Mining with NFTs

This is the codebase for Team CryptoDipto's development project for NFT rewards for Pendle's Liquidity Mining contract.

## Table of Contents

- [About](#about)
- [Problem](#problem)
- [Our Plan](#plan)
- [Getting Started](#getting_started)
- [Acknowledgements](#acknowledgements)
- [Authors](#authors)

## About <a name = "about"></a>

This is a development project for NTU's Blockchain Technology Module (CZ4153) in collaboration with Pendle Finance.

Our project aims to provide support for rewarding Liquidity Providers (LPs) to Pendle's AMM with NFTs (ERC721 tokens). This will allow the Pendle team to reward LPs with in-house designed NFTs as with the collaboration with Galaxy. 

We have created a sound reward mechanism to reward LPs via different reward tiers, essentially a configurable exchange rate of rewards points to NFTs. We build upon Pendle's existing method of tracking reward points, and extend it by providing new functions related to NFT rewards that **allow a user to check the quantity and tier of NFTs that he is eligible to claim** before **redeeming said NFTs**. 

We have also added test scripts written in TypeScript to test the validity and correctness of our smart contracts and user flows.

Currently, our program is deployed locally with future plans for deployment within the Testnet.

## Problem <a name = "problem"></a>

Liquidity Mining pools have been an increasingly attractive mechanism for cryptocurrency investors to park their tokens into, as a means of earning passive income via returns through Yield Farming.

Traditionally, investors that provide Liquidity for these pools are rewarded with the tokens found within the pool (transfer fees) or other reward tokens. However, Non-Fungible Tokens (NFTs) have become increasingly popular due to the proof-of-ownership this asset class has to offer. As wider adoption of NFTs takes the world of cryptocurrency by storm, NFTs are starting to be considered in various DeFi protocols as a legitimate asset class. Thus, Pendle is exploring ways to reward LPs with NFTs on top of Pendle reward tokens. With this in mind, Pendle's project on Liquidity Mining with NFT rewards caught our attention, and Team CryptoDipto decided to embark on this project.

## Plan <a name = "plan"></a>

Team CryptoDipto has undergone many iterations of plans to fulfil the use cases required for this project. The team met many blockers due to the level of complexity of Pendle's current reward system, and decided that in the interest of time, we would not build the NFT support within the existing contract.

### Assumptions

To keep our code functional and transferable, Team CryptoDipto worked at the end states of Pendle's existing Reward System, and worked with a few assumptions:
1. The number of reward points a user has, has already been determined (no need to specify expiry in our contract).
2. Reward points are directly translated to ERC20 Tokens when redeemed (1:1).
3. Pendle has no existing NFT tier system defined for reward points, and users will always aim for the highest tier of NFT rewards.

### Notable Mapping(s) and Functions

- `uint256[] cutOffPoints`
  - An array that dictates the minimum number of reward points a user must have before being eligible for a specific tier of NFTs.

- `function setCutOffPoints`
  - A function that allows Pendle to modify the cutOffPoints array. This gives Pendle the flexibility to change the cut off points to manage its incentives for liquidity providers.
    
- `function redeemNftRewards`
  - A function that checks a user's eligible NFT rewards via `checkNftRewards`. Subsequently, the function will mint the required NFTs to the user and also transfer the required ERC20 tokens to the user.
    
- `function checkNftRewards`
  - A function that receives a user address and outputs the quantities and tiers of eligible NFT rewards, and also leftover reward points to be redeemed as ERC20 tokens.

## Getting Started <a name = "getting_started"></a>

If you are looking at the repository and wish to fork it to your local machine:
- Head to your desired folder to host this repository within.

```sh
git clone https://github.com/kingstarfly/nft_pendle.git .
yarn
```

Once installed, run Hardhat's testing network:

```sh
yarn hardhat node
```

Then, on a new terminal, go to the repository's root folder and run this to
deploy your contract:

```sh
yarn deploy
```
### Prerequisites

What things you need to install the software and how to install them.

```
- node.js
- git
```

## Acknowledgements <a name = "acknowledgements"></a>

We would like to thank Dr. Sourav Gupta and Alex Xiong from NTU for their instruction and mentorship on the subjects of Blockchain Technology, smart contracts and DeFi. 

We would also like to thank Anton Buenavista from Pendle Finance for his guidance throughout the process of this project, and allowing us to gain deeper insights into the DeFi/NFT smart contract development space. 

## Authors <a name = "authors"></a>

 - [Bob Lin An](https://github.com/bobbyrayyy)
 - [Justin Yip Jia En](https://github.com/JYIP010)
 - [Ong Xing Xiang](https://github.com/kingstarfly)