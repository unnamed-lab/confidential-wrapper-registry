// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {FaucetDistributor} from "../src/FaucetDistributor.sol";

/// @dev Tiny mintable ERC-20 used only to fund the faucet in tests.
contract MockToken {
    mapping(address => uint256) public balanceOf;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract FaucetDistributorTest is Test {
    FaucetDistributor faucet;
    MockToken token;

    uint256 constant DRIP = 100e6;
    uint256 constant COOLDOWN = 8 hours;

    address alice = address(0xA11CE);

    function setUp() public {
        faucet = new FaucetDistributor(DRIP, COOLDOWN);
        token = new MockToken();
        token.mint(address(faucet), 1_000_000e6);
    }

    function test_claim_transfersDrip() public {
        vm.prank(alice);
        faucet.claim(address(token));
        assertEq(token.balanceOf(alice), DRIP);
    }

    function test_claim_enforcesCooldown() public {
        vm.startPrank(alice);
        faucet.claim(address(token));
        vm.expectRevert();
        faucet.claim(address(token));
        vm.stopPrank();
    }

    function test_claim_succeedsAfterCooldown() public {
        vm.startPrank(alice);
        faucet.claim(address(token));
        vm.warp(block.timestamp + COOLDOWN);
        faucet.claim(address(token));
        vm.stopPrank();
        assertEq(token.balanceOf(alice), DRIP * 2);
    }

    function test_timeUntilClaim_reportsRemaining() public {
        vm.prank(alice);
        faucet.claim(address(token));
        assertEq(faucet.timeUntilClaim(address(token), alice), COOLDOWN);
        vm.warp(block.timestamp + COOLDOWN);
        assertEq(faucet.timeUntilClaim(address(token), alice), 0);
    }
}
