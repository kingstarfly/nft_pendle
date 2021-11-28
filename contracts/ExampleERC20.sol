// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;
import 'hardhat/console.sol';

contract ExampleERC20 {

    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        uint256 initialBalance = 10000 * 10 ** 18;
        balances[address(this)] = initialBalance;
        owner = msg.sender;
    }

    function transferTokenFromContract(address recipient, uint256 amount) public virtual returns (bool) {
        require(balances[address(this)] > amount, 'insufficient contract balance');
        balances[address(this)] -= amount; 
        balances[recipient] += amount; 
        return true;
    }

    function getBalance(address user) public view returns(uint256) {
        return balances[user];
    }

    function setBalance(address user, uint256 qty) public {
        balances[user] = qty;
    }
}
