
# Hats.finance CTF #2 writeup

Challenge : https://github.com/hats-finance/vault-game

Type of Attack : Re-entrancy attack
Vulnerability level : Critical, The vault could be drained, rendering the wrapped token worthless. 

# Finding the vulnerability

 1. Since we need to drain the contract of ETH, we will look for vulnerabilities in functions with `payable` extension, specifically functions that sends ETH to users, This left us with two functions, `withdraw()` and `redeem()`, both function execute an internal function called `_withdraw()`.
 2. Looking at the `_withdraw()` function, we didn't see any reentrancy guard, and the code sends eth to users first before doing the rebalance of excessETH. So this is most likely a reentrancy vulnerability.

# Executing the attack

 1. We need to create an imbalance between the amount of Wrapped token and ETH, sadly this contract doesn't have any receive function, which mean you can't send ETH to the contract in a normal way. But we still can fund a new contract and call `selfdestruct()`to the vault contract, during `selfdestruct()` all ETH on the contract will be forcefully transferred to the recipient.
Self Destruct contract : 
```js
contract Selfdes{
	constructor(address  target) payable {
		selfdestruct(payable(target));
	}
}
```
Implementation :
```js
function  forceSend(uint  amount) public  returns (address){
	Selfdes temp = (new Selfdes){value:amount}(address(VictimContract));
	return  address(temp);
}
```
 2.   Since we need to exploit through `withdraw()` function, we must deposit some of ETH to the Wrapped Token.
 3. 
  

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
