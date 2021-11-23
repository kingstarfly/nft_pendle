import chai, { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import { ExampleNft, CryptoDiptoLiquidityMiningNft } from '@typechained';
const { solidity } = waffle;
import GreeterABI from '../build/artifacts/contracts/Greeter.sol/Greeter.json';
import LiqMiningABI from '../build/artifacts/contracts/CryptoDiptoLiquidityMiningNft.sol/CryptoDiptoLiquidityMiningNft.json';
import ExampleNftABI from '../build/artifacts/contracts/ExampleNft.sol/ExampleNft.json';

chai.use(solidity);

describe('CryptoDipto Liquidity Mining With NFT Rewards', () => {
  //   let greeter: Greeter;
  let exampleNft: ExampleNft;
  let smartContract: CryptoDiptoLiquidityMiningNft;

  // this is the same list as `ethers.getSigners()`
  // getWallets() gives 10 random wallets which we assign to these 4 users
  let [cryptoDiptoTeam, alice, bob, charlie, _] = waffle.provider.getWallets();
  console.log(cryptoDiptoTeam);
  const initNftConstructor = ['BASE_URI']; // Note: To change the addresses

  // intitialize smart contract fixture for liquidity mining
  const smartContractfixture = async () => {
    return (await waffle.deployContract(
      cryptoDiptoTeam,
      LiqMiningABI
    )) as CryptoDiptoLiquidityMiningNft;
  };

  // intitialize NFT fixture for Example NFT Factory contract
  const nftFixture = async () => {
    return (await waffle.deployContract(
      cryptoDiptoTeam,
      ExampleNftABI,
      initNftConstructor
    )) as ExampleNft;
  };

  beforeEach(async () => {
    smartContract = await waffle.loadFixture(smartContractfixture);
    exampleNft = await waffle.loadFixture(nftFixture);
  });

  //   it('Initalize with correct default greeting', async () => {
  //     expect(await greeter.greet()).to.equal(initGreeting);
  //   });

  /*
  Functions to test:
  1. setUserBalance -> returns the balance of the user (int) 
  2. checkNftRewards -> returns (nftQtyArr, leftoverRewardPoints) -> set user's balance first, check that it is equal to expected amount
  3. redeemNftRewards -> returns (nftQtyArr, leftoverRewardPoints) -> check user balances before and after mint step
    a. Check nft qty
    b. Check ERC20 tokens;
*/
  describe('#setUserBalance', async () => {
    it('should correct set the balance of a user (alice)', async () => {
      const newBalance: number = 100;
      // const userAddress: string = '0x5238A644636946963ffeDAc52Ec53fb489D3a1CD';
      // Create the user and store value of 100
      const tx = await smartContract.setUserBalance(alice.address, newBalance);
      console.log(tx);

      // expect that cryptoDiptoTeam's balance is 100
      expect(await smartContract.getUserBalance(alice.address)).to.equal(newBalance);
    });
  });

  describe('#checkNftRewards', async () => {
    beforeEach(async () => {
      // 1. set tiers
      await smartContract.setCutOffPoints([13, 7, 3]); // prime numbers for reward tiers to test various remainder values

      // 2. set user reward points
      await smartContract.setUserBalance(alice.address, 100);
    });
    it('should return the correct quantities and tiers of NFTs to mint', async () => {
      // 3. checkNftRewards for the user, returning the nftQtyArr and rewardPoints
      const [nftQtyArr, _] = await smartContract.checkNftRewards(alice.address);
      expect(nftQtyArr.map((bignum) => bignum.toNumber())).to.deep.equal([7, 1, 0]);
    });

    it('should return the correct number of leftover reward points', async () => {
      const [_, leftoverRewardPoints] = await smartContract.checkNftRewards(alice.address);
      expect(leftoverRewardPoints.toNumber()).to.equal(2);
    });
  });

  describe('#redeemNftRewards', async () => {
    beforeEach(async () => {
      // 1. set tiers
      await smartContract.setCutOffPoints([13, 7, 3]); // prime numbers for reward tiers to test various remainder values

      // 2. set user reward points
      await smartContract.setUserBalance(alice.address, 100);

      // 3. set smart contract address
      await smartContract.setERC721Address(exampleNft.address);
      console.log(exampleNft.address);
    });

    it('should mint the correct number of NFT of correct tiers to the user', async () => {
      // We expect [7,1,0] number of tier 1,2,3 NFTs respectively
      // Check the NFT ownership of the user BEFORE minting
      // We want to know he has 0 x tier 1s, 0 x tier2s and 0 x tier3s.
      //   let userNftTierCounts = await exampleNft.getUserNftTierCounts(alice.address);
      //   expect(userNftTierCounts.map((bignum) => bignum.toNumber())).to.deep.equal([0, 0, 0]);

      // get alice to redeemNftRewards
      await smartContract.redeemNftRewards(alice.address, { gasLimit: 22000 });

      /*
        Problem: We want to mint NFTs to a user, but we realise we need ether to do that, and we are not sure how to obtain the required ether. We want the smart contract to hold ether to 'sponsor' the fees required to mint the tokens. Alice also needs some ether to pay for transactions?

        Network: We don't know what network we are on, probably Rinkeyby (since we are using Alchemy)

        Others: If no way to do this, can we just emulate it on the NFT contract? (without the actual minting but only changes to internal state)
      */

      // Check the NFT ownership of the user AFTER minting
      // We want to know he has 7 x tier 1s, 1 x tier2s and 0 x tier3s.
      let userNftTierCounts = await exampleNft.getUserNftTierCounts(alice.address);
      expect(userNftTierCounts.map((bignum) => bignum.toNumber())).to.deep.equal([7, 1, 0]);
    });
  });
  /*
  describe('#redeemNftRewards', async () => {});

  describe('#setGreeting', () => {
    const newGreeting = 'Bonjour!';

    it('should revert with insufficent donation', async () => {
      // this will send from alice (or first wallet) by default
      await expect(
        greeter.setGreeting(newGreeting, {
          value: ethers.utils.parseEther('0.9'),
        })
      ).to.be.reverted;
    });

    it('should update the greeting with sufficient donation', async () => {
      const donationInWei = ethers.utils.parseEther('2');
      // reconnect contract with a different signer before calling if you want to send from a different wallet.
      await expect(
        greeter.connect(cryptoDiptoTeam).setGreeting(newGreeting, {
          value: donationInWei,
        })
      )
        // the following line is temporarily broken after London hardfork
        // .to.changeEtherBalances(greeter, [cryptoDiptoTeam, greeter], [-donationInWei, donationInWei])
        .to.emit(greeter, 'GreetingUpdated')
        .withArgs(newGreeting, cryptoDiptoTeam.address, donationInWei);

      expect(await greeter.greet()).to.equal(newGreeting);
    });
  });
});
*/
});

// Wait so the reporter has time to fetch and return prices from APIs.
// https://github.com/cgewecke/eth-gas-reporter/issues/254
// describe('eth-gas-reporter workaround', () => {
//   it('should kill time', (done) => {
//     setTimeout(done, 2000);
//   });
// });
