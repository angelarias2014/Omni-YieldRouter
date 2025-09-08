// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IYieldStrategy {
    function deposit(address token, uint256 amount, bytes calldata data) external returns (uint256);
    function withdraw(address token, uint256 amount, bytes calldata data) external returns (uint256);
    function getAPY() external view returns (uint256);
}

// Mock Aave Strategy - In reality this would interact with Aave protocol
contract AaveStrategy is IYieldStrategy, ReentrancyGuard, Ownable {
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public shares;
    uint256 public totalDeposits;
    uint256 public constant APY = 520; // 5.2% APY in basis points
    
    event Deposited(address indexed user, address token, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, address token, uint256 amount, uint256 shares);
    
    function deposit(address token, uint256 amount, bytes calldata data) external override nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from caller
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Calculate shares (1:1 for simplicity, in reality this would be more complex)
        uint256 newShares = amount;
        
        deposits[msg.sender] += amount;
        shares[msg.sender] += newShares;
        totalDeposits += amount;
        
        emit Deposited(msg.sender, token, amount, newShares);
        return newShares;
    }
    
    function withdraw(address token, uint256 amount, bytes calldata data) external override nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        
        // Calculate shares to burn
        uint256 sharesToBurn = (amount * shares[msg.sender]) / deposits[msg.sender];
        
        deposits[msg.sender] -= amount;
        shares[msg.sender] -= sharesToBurn;
        totalDeposits -= amount;
        
        // Transfer tokens back to user
        IERC20(token).transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, token, amount, sharesToBurn);
        return sharesToBurn;
    }
    
    function getAPY() external pure override returns (uint256) {
        return APY;
    }
    
    function getUserBalance(address user) external view returns (uint256) {
        return deposits[user];
    }
}
