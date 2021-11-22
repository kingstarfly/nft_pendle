// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import './ExampleNft.sol';

/**
@author All functionality in this contract is created by Team CryptoDipto.
@author NFT-related mappings and functions - Team CryptoDipto (In alphabetical order: Bob Lin An, Justin Yip Jia En, Ong Xing Xiang)
*/

contract CryptoDiptoLiquidityMiningNft {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ================================= CryptoDipto functions for NFT Rewards =================================
    address public immutable pendlePartnerNftAddress;
    address public immutable pendleTokenAddress;

    mapping(address => uint256) public userBalances;

    // Constructor
    constructor(address _pendlePartnerNftAddress, address _pendleTokenAddress) {
        pendlePartnerNftAddress = _pendlePartnerNftAddress;
        pendleTokenAddress = _pendleTokenAddress;
    }

    /**
     * @notice This function is external and allows users to redeem their Pendle rewards in the form of NFTs, with the remainder being Reward Tokens.
     * @dev Conditions:
     * only be called if the contract has been funded.
     * must have Reentrancy protection
     * only be called if 0 < current epoch (always can withdraw)
     * Anyone can call it (and claim it for any other user)
     * @param user ETH address of the user to query existing total rewards.
     * @return Quantities of each NFT Reward Tier user is entitled to, in an array, as well as the remaining Reward Points.
     */
    function redeemNftRewards(address user)
        external
        returns (uint256[] memory, uint256)
    {
        // Deduct reward points from user now.
        uint256[] memory nftQtyArr;
        uint256 leftoverRewardPoints;

        // 1. check rewards first (tiers and remainder after)
        (nftQtyArr, leftoverRewardPoints) = checkNftRewards(user);

        // 2. deduct balance to 0 (to protect from re-entrancy attacks.)
        // _beforeTransferPendingRewards(user);
        userBalances[user] = 0;

        // Note: nftQtyArr may be something like [5, 3, 1] indicating 5 x tier 1, 3 x tier 2 and 1 x tier 3 NFT to be minted
        _mintNftsGivenTiers(nftQtyArr, user);

        // Refund leftover rewards as Pendle tokens to user.
        if (leftoverRewardPoints != 0) {
            IERC20(pendleTokenAddress).safeTransfer(user, leftoverRewardPoints);
        }

        return (nftQtyArr, leftoverRewardPoints);
    }


    // Note: Maps the i+1-th tier to a certain cut off point for each index i in the array.
    // E.g. Using an example of cutoffPoints = [1000, 500, 100];
    // E.g. Array index 0 refers to tier 1 NFT with a cut off point of 1000 (cutOffPoints[0]).
    uint256[] cutOffPoints;

    /**
     * @notice This function is internal and mints the NFTs that a user is entitled to on redeeming his/her rewards.
     * @dev This function is called at the end of the redeemNftRewards function, after deducting the user's reward points balance.
     * @param nftQtyArr Array of ERC721 URIs based on the NFT Reward Tier quantities the player is entitled to.
     * @param user ETH address of the user to mint the rewards to.
     */
    function _mintNftsGivenTiers(uint256[] memory nftQtyArr, address user)
        internal
    {
        // Iterate through nftTokenUris to mint to user
        for (uint256 i = 0; i < nftQtyArr.length; i++) {
            // find out latest mint ID of token uri
            // mintToken accepts 3 parameters - address to send to, qty of nft, tier of nft.
            ExampleNft(pendlePartnerNftAddress).mintTokens(user, nftQtyArr[i], i+1); // NOTE: Ensure that the partnered NFT contract has this function.
        }
    }

    /**
     * @notice This function is internal (view) and checks the current pending reward points of a user.
     * @dev This function is non-mutating and called to let user know what rewards points they can get.
     * @dev This function is called at the start of checkNftRewards.
     * @param user ETH address of the user to mint the rewards to.
     * @return amountOut - The amount of rewards the user currently has.
     */
    function _checkPendingRewards(address user)
        internal
        view
        returns (uint256 amountOut)
    {
        // Does the same thing as the above function, but do not modify epochData.
        // _updatePendingRewards(user);

        /**
         * Note: Below commented block of code integrates into Pendle's exisiting reward system. 
         * However, for the purposes of this project and simplicity, we will be hardcoding a return result.
        
        uint256 _lastEpoch = Math.min(_getCurrentEpochId(), numberOfEpochs + vestingEpochs);
        for (uint256 i = expiryData[expiry].lastEpochClaimed[user]; i <= _lastEpoch; i++) {
            if (epochData[i].availableRewardsForUser[user] > 0) {
                amountOut = amountOut.add(epochData[i].availableRewardsForUser[user]);
            }
        }
        return amountOut;
        */
        
        // returns user's balance
        return userBalances[user];
    }

    
    // Lets governing personnel to update cutoff points for different tiers
    /**
     * Note: Actual contract to have onlyGovernance modifier for this function
     * @notice This function is public and used to modify a user's balances, and is STRICTLY meant for this testing environment only.
     * @param newCutOffPoints New array of cut off points after this function
     */
    function setCutOffPoints(uint256[] memory newCutOffPoints) public {
        cutOffPoints = newCutOffPoints;
    }
    
    /**
     * @notice This function is public and used to modify a user's balances, and is STRICTLY meant for this testing environment only.
     * @param user ETH address of the user to top up reward balances.
     * @param newBalance New balance of the user after the function is called
     */
    function setUserBalance(address user, uint256 newBalance) public {
        userBalances[user] = newBalance;
    }

    /**
     * @notice This function is public and allows anyone to check the breakdown of rewards, given the user address
     * @dev This function is called within redeemNFTRewards before deducting the user's balance, and can be called on the interface as well.
     * @param user ETH address of the user to query existing total rewards.
     * @return Quantities of each NFT Reward Tier user is entitled to, in an array, as well as the remaining Reward Points.
     */
    function checkNftRewards(address user)
        public
        view
        returns (uint256[] memory, uint256)
    {
        // initialize variables and get reward points that user currently has
        uint256 rewardPoints = userBalances[user];
        // uint256[] storage nftQtyArr;
        uint256[] memory nftQtyArr = new uint256[](cutOffPoints.length);

        for (uint256 i = 0; i < cutOffPoints.length; i++) {
            nftQtyArr[i] = rewardPoints.div(cutOffPoints[i]); // integer division rounds down
            rewardPoints = rewardPoints.mod(cutOffPoints[i]); // get remainder (rewardPoints after current tier)
        }

        /*
         *  At this point, nftQtyArr already contains the number of each NFT tier reward (1,2,3).
         *  rewardPoints contains the remainding reward tokens that will be directly transferred to the user redeeming rewards.
         *  return the tierQtyArr, and rewardPoints to transfer to the user.
         */
        return (nftQtyArr, rewardPoints);
    }
}