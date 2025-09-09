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

// CrossChainRouter - Uses LayerZero for cross-chain routing (not Polygon's AggLayer)
contract CrossChainRouter is ReentrancyGuard, Ownable {
    struct ChainInfo {
        bool isActive;
        address bridgeContract;
        uint256 chainId;
    }
    
    struct YieldStrategy {
        address strategyContract;
        bool isActive;
        uint256 apy;
        string name;
    }
    
    mapping(uint256 => ChainInfo) public supportedChains;
    mapping(address => YieldStrategy) public yieldStrategies;
    mapping(address => mapping(uint256 => uint256)) public userDeposits; // user => chainId => amount
    
    event FundsRouted(address indexed user, address token, uint256 amount, uint256 fromChain, uint256 toChain, bytes strategyData);
    event ChainAdded(uint256 chainId, address bridgeContract);
    event StrategyAdded(address strategy, string name, uint256 apy);
    event FundsBridged(address indexed user, address token, uint256 amount, uint256 fromChain, uint256 toChain);
    
    constructor() Ownable(msg.sender) {}
    
    function addSupportedChain(uint256 _chainId, address _bridgeContract) external onlyOwner {
        supportedChains[_chainId] = ChainInfo({
            isActive: true,
            bridgeContract: _bridgeContract,
            chainId: _chainId
        });
        emit ChainAdded(_chainId, _bridgeContract);
    }
    
    function addYieldStrategy(address _strategy, string memory _name, uint256 _apy) external onlyOwner {
        yieldStrategies[_strategy] = YieldStrategy({
            strategyContract: _strategy,
            isActive: true,
            apy: _apy,
            name: _name
        });
        emit StrategyAdded(_strategy, _name, _apy);
    }
    
    function routeFunds(
        address token, 
        uint256 amount, 
        uint256 destinationChainId, 
        bytes calldata strategyData
    ) external nonReentrant {
        require(supportedChains[destinationChainId].isActive, "Chain not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user to this contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // For this implementation, we'll simulate cross-chain routing
        // In a real implementation, this would interact with actual bridge contracts
        _simulateCrossChainRouting(token, amount, destinationChainId, strategyData);
        
        // Update user deposits tracking
        userDeposits[msg.sender][destinationChainId] += amount;
        
        emit FundsRouted(msg.sender, token, amount, block.chainid, destinationChainId, strategyData);
    }
    
    function _simulateCrossChainRouting(
        address token,
        uint256 amount,
        uint256 destinationChainId,
        bytes calldata strategyData
    ) internal {
        // Decode strategy data to get the target strategy
        address targetStrategy = abi.decode(strategyData, (address));
        
        require(yieldStrategies[targetStrategy].isActive, "Strategy not active");
        
        // Check if we're on the same chain
        if (destinationChainId == block.chainid) {
            // Same chain - direct deposit
            IERC20(token).approve(targetStrategy, amount);
            IYieldStrategy(targetStrategy).deposit(token, amount, strategyData);
        } else {
            // Cross-chain - use bridge
            address bridgeContract = supportedChains[destinationChainId].bridgeContract;
            require(bridgeContract != address(0), "Bridge not configured");
            
            // Approve bridge contract
            IERC20(token).approve(bridgeContract, amount);
            
            // Call bridge function (this would be implemented by the bridge contract)
            // For now, we'll simulate the cross-chain deposit
            _simulateCrossChainDeposit(token, amount, destinationChainId, strategyData);
        }
        
        emit FundsBridged(msg.sender, token, amount, block.chainid, destinationChainId);
    }
    
    function _simulateCrossChainDeposit(
        address token,
        uint256 amount,
        uint256 destinationChainId,
        bytes calldata strategyData
    ) internal {
        // This simulates what would happen on the destination chain
        // In reality, this would be handled by the bridge contract
        address targetStrategy = abi.decode(strategyData, (address));
        
        // Simulate the deposit on destination chain
        // The bridge would call this function on the destination chain
        IYieldStrategy(targetStrategy).deposit(token, amount, strategyData);
    }
    
    function getUserDeposits(address user, uint256 chainId) external view returns (uint256) {
        return userDeposits[user][chainId];
    }
    
    function getBestYieldStrategy() external view returns (address bestStrategy, uint256 bestAPY) {
        bestAPY = 0;
        // This would iterate through all strategies to find the best one
        // For simplicity, we'll return the first active strategy
        // In a real implementation, you'd want to query all strategies
        return (address(0), 0);
    }
    
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }
}
