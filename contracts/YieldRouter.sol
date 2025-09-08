// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { FunctionsClient } from "@chainlink/functions/contracts/FunctionsClient.sol";
import { FunctionsRequest } from "@chainlink/functions/contracts/FunctionsRequest.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IAggLayerRouter {
    function routeFunds(address token, uint256 amount, uint256 destinationChainId, bytes calldata callData) external;
    function getUserDeposits(address user, uint256 chainId) external view returns (uint256);
    function getBestYieldStrategy() external view returns (address bestStrategy, uint256 bestAPY);
}

contract YieldRouter is FunctionsClient, ReentrancyGuard, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    IAggLayerRouter public agglayer;
    uint64 public subscriptionId;
    bytes32 public latestRequestId;
    string public latestAPY;

    mapping(address => uint256) public deposits;
    mapping(address => mapping(uint256 => uint256)) public userDepositsByChain; // user => chainId => amount

    event Response(bytes32 indexed requestId, string apy);
    event RequestError(bytes32 indexed requestId, bytes error);
    event DepositMade(address indexed user, address token, uint256 amount, uint256 chainId);
    event APYUpdated(string newAPY);

    constructor(address _agglayer, address _functionsRouter, uint64 _subscriptionId) FunctionsClient(_functionsRouter) Ownable(msg.sender) {
        agglayer = IAggLayerRouter(_agglayer);
        subscriptionId = _subscriptionId;
    }

    function deposit(address token, uint256 amount, uint256 toChainId, bytes calldata strategyData) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token address");
        
        // Transfer tokens from user to this contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        userDepositsByChain[msg.sender][toChainId] += amount;

        // Route funds through AggLayer
        IERC20(token).approve(address(agglayer), amount);
        agglayer.routeFunds(token, amount, toChainId, strategyData);
        
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
        return agglayer.getBestYieldStrategy();
    }

    function requestAPYData(string calldata source, bytes calldata secrets, string[] calldata args) external {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (args.length > 0) req.setArgs(args);
        if (secrets.length > 0) req.addInlineSecrets(secrets);

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