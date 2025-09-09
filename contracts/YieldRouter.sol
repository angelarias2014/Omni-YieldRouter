// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { FunctionsClient } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import { FunctionsRequest } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsRequest.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ICrossChainRouter {
    function routeFunds(address token, uint256 amount, uint256 destinationChainId, bytes calldata callData) external;
    function getUserDeposits(address user, uint256 chainId) external view returns (uint256);
    function getBestYieldStrategy() external view returns (address bestStrategy, uint256 bestAPY);
}

contract YieldRouter is FunctionsClient, ReentrancyGuard, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    ICrossChainRouter public crossChainRouter;
    uint64 public subscriptionId;
    bytes32 public latestRequestId;
    string public latestAPY;

    mapping(address => uint256) public deposits;
    mapping(address => mapping(uint256 => uint256)) public userDepositsByChain; // user => chainId => amount

    event Response(bytes32 indexed requestId, string apy);
    event RequestError(bytes32 indexed requestId, bytes error);
    event DepositMade(address indexed user, address token, uint256 amount, uint256 chainId);
    event APYUpdated(string newAPY);

    constructor(address _crossChainRouter, address _functionsRouter, uint64 _subscriptionId) FunctionsClient(_functionsRouter) Ownable(msg.sender) {
        crossChainRouter = ICrossChainRouter(_crossChainRouter);
        subscriptionId = _subscriptionId;
    }

    function deposit(address token, uint256 amount, uint256 toChainId, bytes calldata strategyData) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token address");
        
        // Transfer tokens from user to this contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        userDepositsByChain[msg.sender][toChainId] += amount;

        // Route funds through CrossChain Router
        IERC20(token).approve(address(crossChainRouter), amount);
        crossChainRouter.routeFunds(token, amount, toChainId, strategyData);
        
        emit DepositMade(msg.sender, token, amount, toChainId);
    }

    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }
    
    function getUserDeposits(address user, uint256 chainId) external view returns (uint256) {
        return userDepositsByChain[user][chainId];
    }
    
    function getBestYieldStrategy() external view returns (address bestStrategy, uint256 bestAPY) {
        return crossChainRouter.getBestYieldStrategy();
    }

    function requestAPYData() external {
        // Inline JavaScript to fetch APY data from multiple sources
        string memory source = 
            "const aaveAPY = await fetch('https://aave-api-v2.aave.com/data/liquidity/v2?poolId=mainnet').then(r => r.json()).then(data => data.reserves[0].liquidityRate * 100);"
            "const yearnAPY = await fetch('https://api.yearn.finance/v1/chains/1/vaults/all').then(r => r.json()).then(data => data[0].apy.net_apy * 100);"
            "const beefyAPY = await fetch('https://api.beefy.finance/apy').then(r => r.json()).then(data => Object.values(data)[0] * 100);"
            "const bestAPY = Math.max(aaveAPY, yearnAPY, beefyAPY);"
            "return Functions.encodeString(bestAPY.toString());";
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        
        latestRequestId = _sendRequest(req.encodeCBOR(), subscriptionId, 200000);
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (err.length > 0) {
            emit RequestError(requestId, err);
        } else {
            latestAPY = string(response);
            emit Response(requestId, latestAPY);
            emit APYUpdated(latestAPY);
        }
    }
} 