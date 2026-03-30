// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Aave V3 interfaces
interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getUserAccountData(address user) external view returns (uint256, uint256, uint256, uint256, uint256, uint256);
}

interface IAToken {
    function balanceOf(address user) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IYieldStrategy {
    function deposit(address token, uint256 amount, bytes calldata data) external returns (uint256);
    function withdraw(address token, uint256 amount, bytes calldata data) external returns (uint256);
    function getAPY() external view returns (uint256);
}

contract RealAaveStrategy is IYieldStrategy, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    IPool public immutable aavePool;
    IERC20 public immutable underlyingToken;
    IAToken public immutable aToken;
    
    mapping(address => uint256) public userShares;
    uint256 public totalShares;
    uint256 public totalAssets;
    
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event APYUpdated(uint256 newAPY);
    
    constructor(
        address _aavePool,
        address _underlyingToken,
        address _aToken
    ) Ownable(msg.sender) {
        aavePool = IPool(_aavePool);
        underlyingToken = IERC20(_underlyingToken);
        aToken = IAToken(_aToken);
    }
    
    function deposit(address token, uint256 amount, bytes calldata data) external override nonReentrant returns (uint256) {
        require(token == address(underlyingToken), "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve Aave pool
        underlyingToken.safeApprove(address(aavePool), amount);
        
        // Supply to Aave
        aavePool.supply(address(underlyingToken), amount, address(this), 0);
        
        // Calculate shares (1:1 for simplicity, in reality this would be more complex)
        uint256 shares = amount;
        
        userShares[msg.sender] += shares;
        totalShares += shares;
        totalAssets += amount;
        
        emit Deposited(msg.sender, amount, shares);
        return shares;
    }
    
    function withdraw(address token, uint256 amount, bytes calldata data) external override nonReentrant returns (uint256) {
        require(token == address(underlyingToken), "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(userShares[msg.sender] >= amount, "Insufficient balance");
        
        // Withdraw from Aave
        uint256 withdrawnAmount = aavePool.withdraw(address(underlyingToken), amount, msg.sender);
        
        // Update shares
        userShares[msg.sender] -= amount;
        totalShares -= amount;
        totalAssets -= withdrawnAmount;
        
        emit Withdrawn(msg.sender, withdrawnAmount, amount);
        return amount;
    }
    
    function getAPY() external view override returns (uint256) {
        // Get current liquidity rate from Aave
        (uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor) = 
            aavePool.getUserAccountData(address(this));
        
        // For simplicity, return a fixed APY based on current market conditions
        // In reality, you'd calculate this from the reserve data
        return 520; // 5.2% APY in basis points
    }
    
    function getUserBalance(address user) external view returns (uint256) {
        return userShares[user];
    }
    
    function getTotalAssets() external view returns (uint256) {
        return aToken.balanceOf(address(this));
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = aToken.balanceOf(address(this));
        if (balance > 0) {
            aavePool.withdraw(address(underlyingToken), balance, owner());
        }
    }
}
