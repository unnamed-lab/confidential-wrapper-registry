// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {FaucetDistributor} from "../src/FaucetDistributor.sol";

/**
 * @notice Deploys FaucetDistributor to Sepolia.
 *         DRIP/COOLDOWN are configurable via env; defaults assume 6-decimal mocks.
 *
 *   forge script script/DeployFaucet.s.sol --rpc-url sepolia --broadcast --verify
 */
contract DeployFaucet is Script {
    function run() external {
        uint256 drip = vm.envOr("FAUCET_DRIP", uint256(100e6));
        uint256 cooldown = vm.envOr("FAUCET_COOLDOWN", uint256(8 hours));

        vm.startBroadcast();
        FaucetDistributor faucet = new FaucetDistributor(drip, cooldown);
        vm.stopBroadcast();

        console.log("FaucetDistributor:", address(faucet));
        console.log("  drip:", drip);
        console.log("  cooldown:", cooldown);
        console.log("Remember to fund it with each cTokenMock, then set faucetDistributor in address-book.ts");
    }
}
