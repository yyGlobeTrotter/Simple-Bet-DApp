# Avoiding Common Attacks
***

## SimpleBet.sol

### 1. Re-entrancy Attacks (SWC-107)

This contract prevents potential Re-entrancy attacks by implementing the following mechanisms:

- Handle all internal contract state changes before calling external contracts or addresses
- Using Withdrawal design pattern to separate internal accounting logic and external transfer logic, such as how it's implemented in `setBetPayout()` function and `userWithdraw()` function

### 2. Integer Overflow and Underflow (SWC-101)

This contract prevents potential Integer Overflow and Underflow attacks by utilizing OpenZeppelin's `SafeMath.sol` library which wrappers over Solidity’s arithmetic operations with added overflow checks.
