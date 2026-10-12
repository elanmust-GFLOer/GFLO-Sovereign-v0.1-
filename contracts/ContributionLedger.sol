// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @notice Experimental XP accounting primitive; not a contribution verifier.
/// @dev Whole XP units. Evidence IDs are global within this deployment.
/// Grantors must enforce contribution validity and canonical ID assignment off-chain.
contract ContributionLedger {
    error Unauthorized();
    error InvalidAddress();
    error InvalidGrant();
    error AlreadyCredited();

    address public owner;
    address public pendingOwner;
    mapping(address => bool) public grantors;
    mapping(address => uint256) public xp;
    mapping(bytes32 => bool) public credited;

    event GrantorUpdated(address indexed grantor, bool allowed);
    event OwnershipTransferStarted(address indexed owner, address indexed proposedOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ContributionCredited(bytes32 indexed contributionId, address indexed recipient,
        address indexed grantor, uint256 amount);

    constructor(address initialOwner) {
        if (initialOwner == address(0) || initialOwner == address(this)) revert InvalidAddress();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    function setGrantor(address grantor, bool allowed) external onlyOwner {
        if (grantor == address(0) || grantor == address(this)) revert InvalidAddress();
        grantors[grantor] = allowed;
        emit GrantorUpdated(grantor, allowed);
    }

    /// @dev The owner is not implicitly a grantor.
    function credit(bytes32 contributionId, address recipient, uint256 amount) external {
        if (!grantors[msg.sender]) revert Unauthorized();
        if (recipient == address(0) || recipient == address(this)) revert InvalidAddress();
        if (contributionId == bytes32(0) || amount == 0) revert InvalidGrant();
        if (credited[contributionId]) revert AlreadyCredited();
        credited[contributionId] = true;
        xp[recipient] += amount;
        emit ContributionCredited(contributionId, recipient, msg.sender, amount);
    }

    /// @notice Replace a pending proposal by proposing another valid owner.
    function transferOwnership(address proposedOwner) external onlyOwner {
        if (proposedOwner == address(0) || proposedOwner == address(this)) revert InvalidAddress();
        pendingOwner = proposedOwner;
        emit OwnershipTransferStarted(owner, proposedOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        address previousOwner = owner;
        // Remove an explicitly granted issuance role from the previous admin.
        if (grantors[previousOwner]) {
            grantors[previousOwner] = false;
            emit GrantorUpdated(previousOwner, false);
        }
        owner = msg.sender;
        pendingOwner = address(0);
        emit OwnershipTransferred(previousOwner, msg.sender);
    }
}
