// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ILayerZeroEndpoint {
    function send(uint16 _dstChainId, bytes calldata _destination, bytes calldata _payload, address payable _refundAddress, address _zroPaymentAddress, bytes calldata _adapterParams) external payable;
}

interface ILayerZeroReceiver {
    function lzReceive(uint16 _srcChainId, bytes calldata _srcAddress, uint64 _nonce, bytes calldata _payload) external;
}

contract LayerZeroBridge is ILayerZeroReceiver, ReentrancyGuard, Ownable {
    ILayerZeroEndpoint public immutable lzEndpoint;
    
    struct BridgeRequest {
        address user;
        address token;
        uint256 amount;
        uint256 destinationChainId;
        bytes strategyData;
        bool completed;
    }
    
    mapping(bytes32 => BridgeRequest) public bridgeRequests;
    mapping(uint16 => bytes) public trustedRemoteLookup;
    mapping(address => bool) public supportedTokens;
    
    uint256 public nonce;
    
    event BridgeInitiated(bytes32 indexed requestId, address indexed user, address token, uint256 amount, uint256 destinationChainId);
    event BridgeCompleted(bytes32 indexed requestId, address indexed user, address token, uint256 amount);
    event TrustedRemoteSet(uint16 _srcChainId, bytes _path);
    
    constructor(address _lzEndpoint) Ownable(msg.sender) {
        lzEndpoint = ILayerZeroEndpoint(_lzEndpoint);
    }
    
    function setTrustedRemote(uint16 _srcChainId, bytes calldata _path) external onlyOwner {
        trustedRemoteLookup[_srcChainId] = _path;
        emit TrustedRemoteSet(_srcChainId, _path);
    }
    
    function addSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = true;
    }
    
    function bridgeFunds(
        address token,
        uint256 amount,
        uint256 destinationChainId,
        bytes calldata strategyData
    ) external payable nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Create bridge request
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, token, amount, destinationChainId, nonce++));
        bridgeRequests[requestId] = BridgeRequest({
            user: msg.sender,
            token: token,
            amount: amount,
            destinationChainId: destinationChainId,
            strategyData: strategyData,
            completed: false
        });
        
        // Prepare payload
        bytes memory payload = abi.encode(requestId, msg.sender, token, amount, strategyData);
        
        // Send cross-chain message
        lzEndpoint.send{value: msg.value}(
            uint16(destinationChainId),
            trustedRemoteLookup[uint16(destinationChainId)],
            payload,
            payable(msg.sender),
            address(0),
            bytes("")
        );
        
        emit BridgeInitiated(requestId, msg.sender, token, amount, destinationChainId);
    }
    
    function lzReceive(uint16 _srcChainId, bytes calldata _srcAddress, uint64, bytes calldata _payload) external override {
        require(msg.sender == address(lzEndpoint), "Only endpoint can call this");
        require(trustedRemoteLookup[_srcChainId].length != 0, "Trusted remote not set");
        
        // Decode payload
        (bytes32 requestId, address user, address token, uint256 amount, bytes memory strategyData) = 
            abi.decode(_payload, (bytes32, address, address, uint256, bytes));
        
        // Complete the bridge
        _completeBridge(requestId, user, token, amount, strategyData);
    }
    
    function _completeBridge(
        bytes32 requestId,
        address user,
        address token,
        uint256 amount,
        bytes memory strategyData
    ) internal {
        require(!bridgeRequests[requestId].completed, "Bridge already completed");
        
        // Mark as completed
        bridgeRequests[requestId].completed = true;
        
        // Transfer tokens to user (simulating arrival on destination chain)
        IERC20(token).transfer(user, amount);
        
        emit BridgeCompleted(requestId, user, token, amount);
    }
    
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }
}
