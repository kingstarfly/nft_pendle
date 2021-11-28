import chai, { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
const { solidity } = waffle;
import { BigNumber } from '@ethersproject/bignumber';
import { CryptoDiptoLiquidityMiningNft, ExampleERC20, ExampleNft } from '@typechained';

chai.use(solidity);

describe('CryptoDipto Liquidity Mining With NFT Rewards', () => {
  /*
  Functions to test:
  1. setUserBalance -> returns the balance of the user (int) 
  2. checkNftRewards -> returns (nftQtyArr, leftoverRewardPoints) -> set user's balance first, check that it is equal to expected amount
  3. redeemNftRewards -> returns (nftQtyArr, leftoverRewardPoints) -> check user balances before and after mint step
    3a. Check nft qty
    3b. Check ERC20 tokens;
*/

  let exampleERC721: ExampleNft;
  let exampleERC20: ExampleERC20;
  let smartContract: CryptoDiptoLiquidityMiningNft;
  const initNftConstructor = 'BASE_URI'; // Note: To change the addresses
  const cutOffPoints = [13, 7, 3];
  const initialRewardPoints = 100;

  beforeEach(async () => {
    const [cryptoDiptoTeam, _] = await ethers.getSigners();
    // instantiate the contract via ethers (TBC if this is the correct way of referencing them)
    const LiqMining = await ethers.getContractFactory(
      'CryptoDiptoLiquidityMiningNft',
      cryptoDiptoTeam // signer of contract (will become owner in this case)
    );

    const ERC721Token = await ethers.getContractFactory(
      'ExampleNft',
      cryptoDiptoTeam // signer of contract
    );

    const ERC20Token = await ethers.getContractFactory(
      'ExampleERC20',
      cryptoDiptoTeam // signer of contract
    );

    // wait for both contracts to deploy
    smartContract = (await LiqMining.deploy()) as CryptoDiptoLiquidityMiningNft;
    exampleERC721 = (await ERC721Token.deploy(initNftConstructor)) as ExampleNft;
    exampleERC20 = (await ERC20Token.deploy()) as ExampleERC20;
  });

  describe('#setUserBalance', () => {
    it('should correctly set the balance of a user', async () => {
      const [_, alice] = await ethers.getSigners();
      const newBalance = 100;

      // Create the user and store value of 100
      await smartContract.setUserBalance(alice.address, newBalance);

      // Expect that alice's balance is 100
      expect(await smartContract.getUserBalance(alice.address)).to.equal(newBalance);
    });
  });

  describe('#checkNftRewards', () => {
    beforeEach(async () => {
      const [_, alice] = await ethers.getSigners();

      // 1. set tiers
      await smartContract.setCutOffPoints(cutOffPoints); // prime numbers for reward tiers to test various remainder values

      // 2. set user reward points
      await smartContract.setUserBalance(alice.address, 100);
    });

    it('should return the correct quantities and tiers of NFTs to mint', async () => {
      const [__, alice] = await ethers.getSigners();
      // 3. checkNftRewards for the user, returning the nftQtyArr and rewardPoints
      const [nftQtyArr, _] = await smartContract.checkNftRewards(alice.address);

      let expectedTierCounts = [];
      let rewardPoints = initialRewardPoints;
      for (let points of cutOffPoints) {
        expectedTierCounts.push(Math.floor(rewardPoints / points));
        rewardPoints = rewardPoints % points;
      }

      expect(nftQtyArr.map((bignum: BigNumber) => bignum.toNumber())).to.deep.equal(
        expectedTierCounts
      );
    });

    it('should return the correct number of leftover reward points', async () => {
      const [__, alice] = await ethers.getSigners();
      const [_, leftoverRewardPoints] = await smartContract.checkNftRewards(alice.address);
      expect(leftoverRewardPoints.toNumber()).to.equal(2);
    });
  });

  describe('#redeemNftRewards', () => {
    beforeEach(async () => {
      const [_, alice] = await ethers.getSigners();

      // 1. set tiers
      await smartContract.setCutOffPoints(cutOffPoints); // prime numbers for reward tiers to test various remainder values

      // 2. set user reward points
      await smartContract.setUserBalance(alice.address, initialRewardPoints);

      // 3. set NFT contract address
      await smartContract.setERC721Address(exampleERC721.address);

      // 4. set pendle token ERC20 address
      await smartContract.setERC20Address(exampleERC20.address);
    });

    it('should mint the correct number of NFT of correct tiers to the user', async () => {
      const [_, alice] = await ethers.getSigners();
      // We expect [7,1,0] number of tier 1,2,3 NFTs respectively
      // Check the NFT ownership of the user BEFORE minting
      // We want to know he has 0 x tier 1s, 0 x tier2s and 0 x tier3s.
      // let userNftTierCounts = await exampleNft.getUserNftTierCounts(alice.address);
      // expect(userNftTierCounts.map((bignum) => bignum.toNumber())).to.deep.equal([0, 0, 0]);

      await smartContract.connect(alice).redeemNftRewards(alice.address);

      let expectedTierCounts = [];
      let rewardPoints = initialRewardPoints;
      for (let points of cutOffPoints) {
        expectedTierCounts.push(Math.floor(rewardPoints / points));
        rewardPoints = rewardPoints % points;
      }

      let userNftTierCounts = await exampleERC721.getUserNftTierCounts(alice.address);

      expect(userNftTierCounts.map((bignum: BigNumber) => bignum.toNumber())).to.deep.equal(
        expectedTierCounts
      );
    });

    it('should send leftover reward points as ERC20 tokens', async () => {
      const [_, alice] = await ethers.getSigners();

      const erc20BalanceBefore = await exampleERC20.getBalance(alice.address);

      await smartContract.connect(alice).redeemNftRewards(alice.address);

      const erc20BalanceAfter = await exampleERC20.getBalance(alice.address);

      let rewardPoints = initialRewardPoints;
      for (let points of cutOffPoints) {
        rewardPoints = rewardPoints % points;
      }
      expect(erc20BalanceBefore).to.equal(erc20BalanceAfter.sub(rewardPoints));
    });
  });
});
