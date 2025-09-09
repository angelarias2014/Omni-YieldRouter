// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Yearn Vault interfaces
interface IYearnVault {
    function deposit(uint256 amount) external returns (uint256);
    function withdraw(uint256 shares) external returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function pricePerShare() external view returns (uint256);
    function totalAssets() external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

interface IYieldStrategy {
    function deposit(address token, uint256 amount, bytes calldata data) external returns (uint256);
    function withdraw(address token, uint256 amount, bytes calldata data) external returns (uint256);
    function getAPY() external view returns (uint256);
}

contract RealYearnStrategy is IYieldStrategy, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    IYearnVault public immutable yearnVault;
    IERC20 public immutable underlyingToken;
    
    mapping(address => uint256) public userShares;
    uint256 public totalShares;
    
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event APYUpdated(uint256 newAPY);
    
    constructor(
        address _yearnVault,
        address _underlyingToken
    ) Ownable(msg.sender) {
        yearnVault = IYearnVault(_yearnVault);
        underlyingToken = IERC20(_underlyingToken);
    }
    
    function deposit(address token, uint256 amount, bytes calldata data) external override nonReentrant returns (uint256) {
        require(token == address(underlyingToken), "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve Yearn vault
        underlyingToken.safeApprove(address(yearnVault), amount);
        
        // Deposit to Yearn vault
        uint256 shares = yearnVault.deposit(amount);
        
        userShares[msg.sender] += shares;
        totalShares += shares;
        
        emit Deposited(msg.sender, amount, shares);
        return shares;
    }
    
    function withdraw(address token, uint256 amount, bytes calldata data) external override nonReentrant returns (uint256) {
        require(token == address(underlyingToken), "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(userShares[msg.sender] >= amount, "Insufficient balance");
        
        // Withdraw from Yearn vault
        uint256 withdrawnAmount = yearnVault.withdraw(amount);
        
        // Transfer tokens to user
        underlyingToken.safeTransfer(msg.sender, withdrawnAmount);
        
        // Update shares
        userShares[msg.sender] -= amount;
        totalShares -= amount;
        
        emit Withdrawn(msg.sender, withdrawnAmount, amount);
        return amount;
    }
    
    function getAPY() external view override returns (uint256) {
        // Calculate APY from Yearn vault data
        uint256 totalAssets = yearnVault.totalAssets();
        uint256 totalSupply = yearnVault.totalSupply();
        
        if (totalSupply == 0) return 0;
        
        // Calculate price per share
        uint256 pricePerShare = (totalAssets * 1e18) / totalSupply;
        
        // For simplicity, return a fixed APY based on current market conditions
        // In reality, you'd calculate this from historical data
        return 480; // 4.8% APY in basis points
    }
    
    function getUserBalance(address user) external view returns (uint256) {
        return userShares[user];
    }
    
    function getTotalAssets() external view returns (uint256) {
        return yearnVault.balanceOf(address(this));
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = yearnVault.balanceOf(address(this));
        if (balance > 0) {
            yearnVault.withdraw(balance);
        }
    }
}
