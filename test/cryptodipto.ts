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
  let [_, bob] = waffle.provider.getWallets();
  const initSmartContractConstructor = ['NFT_ADDRESS', 'ERC20_ADDRESS']; // Note: To change the addresses
  const initNftConstructor = ['BASE_URI']; // Note: To change the addresses

  // intitialize smart contract fixture for liquidity mining
  const smartContractfixture = async () => {
    return (await waffle.deployContract(
      bob,
      LiqMiningABI,
      initSmartContractConstructor
    )) as CryptoDiptoLiquidityMiningNft;
  };

  // intitialize NFT fixture for Example NFT Factory contract
  const nftFixture = async () => {
    return (await waffle.deployContract(bob, ExampleNftABI, initNftConstructor)) as ExampleNft;
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
  1. _checkPendingRewards -> returns the balance of the user (int) 
  2. checkNftRewards -> returns (nftQtyArr, leftoverRewardPoints) -> set user's balance first, check that it is equal to expected amount
  3. _mintNftsGivenTiers -> check user balances before and after mint step
    a. Check nft qty
    b. Check ERC20 tokens
  4. redeemNftRewards -> returns (nftQtyArr, leftoverRewardPoints);
*/
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
        greeter.connect(bob).setGreeting(newGreeting, {
          value: donationInWei,
        })
      )
        // the following line is temporarily broken after London hardfork
        // .to.changeEtherBalances(greeter, [bob, greeter], [-donationInWei, donationInWei])
        .to.emit(greeter, 'GreetingUpdated')
        .withArgs(newGreeting, bob.address, donationInWei);

      expect(await greeter.greet()).to.equal(newGreeting);
    });
  });
});

// Wait so the reporter has time to fetch and return prices from APIs.
// https://github.com/cgewecke/eth-gas-reporter/issues/254
// describe('eth-gas-reporter workaround', () => {
//   it('should kill time', (done) => {
//     setTimeout(done, 2000);
//   });
// });
