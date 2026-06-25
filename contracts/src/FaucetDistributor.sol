// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

/// @dev Minimal ERC-20 surface this faucet needs.
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title FaucetDistributor
 * @notice Convenience faucet (Sepolia only) for the official cTokenMock ERC-20s.
 *         Holds a balance of each mock and dispenses a fixed drip with an on-chain
 *         cooldown per (token, user). This is a convenience helper, NOT the centerpiece —
 *         the only "production" detail that matters here is the enforced cooldown.
 *
 * @dev    Used only if the cTokenMocks do NOT expose a public mint(). If they do, the
 *         frontend mints directly and this contract is unnecessary (see PLAN §4.3).
 */
contract FaucetDistributor {
    /// @notice Drip size. NOTE: align to the mock's decimals before deploy (mocks are often 6dp).
    uint256 public immutable drip;
    /// @notice Cooldown between drips for the same (token, user).
    uint256 public immutable cooldown;

    /// @notice token => user => earliest timestamp the user may claim again.
    mapping(address token => mapping(address user => uint256 nextClaim)) public nextClaim;

    event Dripped(address indexed token, address indexed to, uint256 amount);

    error Cooldown(uint256 retryAt);
    error TransferFailed();

    constructor(uint256 drip_, uint256 cooldown_) {
        drip = drip_;
        cooldown = cooldown_;
    }

    /// @notice Dispense `drip` of `token` to the caller, subject to the cooldown.
    function claim(address token) external {
        uint256 ready = nextClaim[token][msg.sender];
        if (block.timestamp < ready) revert Cooldown(ready);
        nextClaim[token][msg.sender] = block.timestamp + cooldown;
        if (!IERC20(token).transfer(msg.sender, drip)) revert TransferFailed();
        emit Dripped(token, msg.sender, drip);
    }

    /// @notice Seconds until `user` may claim `token` again (0 if claimable now).
    function timeUntilClaim(address token, address user) external view returns (uint256) {
        uint256 ready = nextClaim[token][user];
        return block.timestamp >= ready ? 0 : ready - block.timestamp;
    }
}
