// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Beefy Vault interfaces
interface IBeefyVault {
    function deposit(uint256 amount) external;
    function withdraw(uint256 shares) external;
    function balanceOf(address account) external view returns (uint256);
    function getPricePerFullShare() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function want() external view returns (address);
}

interface IYieldStrategy {
    function deposit(address token, uint256 amount, bytes calldata data) external returns (uint256);
    function withdraw(address token, uint256 amount, bytes calldata data) external returns (uint256);
    function getAPY() external view returns (uint256);
}

contract RealBeefyStrategy is IYieldStrategy, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    IBeefyVault public immutable beefyVault;
    IERC20 public immutable underlyingToken;
    
    mapping(address => uint256) public userShares;
    uint256 public totalShares;
    
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event APYUpdated(uint256 newAPY);
    
    constructor(
        address _beefyVault,
        address _underlyingToken
    ) Ownable(msg.sender) {
        beefyVault = IBeefyVault(_beefyVault);
        underlyingToken = IERC20(_underlyingToken);
    }
    
    function deposit(address token, uint256 amount, bytes calldata data) external override nonReentrant returns (uint256) {
        require(token == address(underlyingToken), "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve Beefy vault
        underlyingToken.safeApprove(address(beefyVault), amount);
        
        // Deposit to Beefy vault
        beefyVault.deposit(amount);
        
        // Calculate shares based on vault's price per share
        uint256 pricePerShare = beefyVault.getPricePerFullShare();
        uint256 shares = (amount * 1e18) / pricePerShare;
        
        userShares[msg.sender] += shares;
        totalShares += shares;
        
        emit Deposited(msg.sender, amount, shares);
        return shares;
    }
    
    function withdraw(address token, uint256 amount, bytes calldata data) external override nonReentrant returns (uint256) {
        require(token == address(underlyingToken), "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(userShares[msg.sender] >= amount, "Insufficient balance");
        
        // Withdraw from Beefy vault
        beefyVault.withdraw(amount);
        
        // Get current balance after withdrawal
        uint256 withdrawnAmount = underlyingToken.balanceOf(address(this));
        
        // Transfer tokens to user
        underlyingToken.safeTransfer(msg.sender, withdrawnAmount);
        
        // Update shares
        userShares[msg.sender] -= amount;
        totalShares -= amount;
        
        emit Withdrawn(msg.sender, withdrawnAmount, amount);
        return amount;
    }
    
    function getAPY() external view override returns (uint256) {
        // Calculate APY from Beefy vault data
        uint256 totalSupply = beefyVault.totalSupply();
        uint256 pricePerShare = beefyVault.getPricePerFullShare();
        
        if (totalSupply == 0) return 0;
        
        // For simplicity, return a fixed APY based on current market conditions
        // In reality, you'd calculate this from historical data and vault performance
        return 610; // 6.1% APY in basis points
    }
    
    function getUserBalance(address user) external view returns (uint256) {
        return userShares[user];
    }
    
    function getTotalAssets() external view returns (uint256) {
        return beefyVault.balanceOf(address(this));
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = beefyVault.balanceOf(address(this));
        if (balance > 0) {
            beefyVault.withdraw(balance);
        }
    }
}
