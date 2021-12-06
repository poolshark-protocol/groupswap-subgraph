// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libraries/UniversalERC20.sol";
import "./interfaces/IGroupSwap.sol";
import "./interfaces/IPredaDex.sol";
import "hardhat/console.sol";

contract GroupSwap is IGroupSwap {
    using UniversalERC20 for IERC20;

    address internal _owner;
    address internal immutable deployed;
    IPredaDex internal immutable predaDex;

    constructor(address _contractOwner, address _predaDex) payable {
        _owner = _contractOwner;
        deployed = address(this);
        predaDex = IPredaDex(_predaDex);
    }

    receive() external payable {}
    fallback() external payable {}

    function _checkGasRequirements(
        uint256 gasUsed
    ) internal pure returns (uint256 gasRequirement) {
        // TODO: Impl custom gas estimator
        // 100 gwei hard coded tmp value
        uint256 answer = 100_000_000_000;

        // Using e In solidity
        uint256 eN = 271828;
        uint256 eD = 100000;

        // Curve algorithm :  e ^ -(x/1.3)
        gasRequirement = (
            (
                uint256(answer) * (1 + ((1 / (eN / eD))
                ** (uint256(answer) / uint256(130_000_000_000))))
            )
            / 21_000 * gasUsed);
    }

    // TODO: To call this off-chain, you would query The Graph to get the token pair for a given group
    // Then call this function with the group's data
    function estimateGasRequirements(
        IERC20 fromToken,
        IERC20 destToken,
        uint256 amount
    ) external override view returns (uint256 gasRequired) {
        // TODO: Params
        // TODO: lowlevel call
        ( , , uint256 estimateGasAmount) = predaDex.quoteAndDistribute(
            fromToken,
            destToken,
            amount,
            1, // Parts // TODO: Find optimal parts note: tests failed with parts set to 10
            0, // Flags
            1 // DestTokenEthPriceTimesGasPrice
        );

        return _checkGasRequirements(estimateGasAmount);
    }

    function getGroup(
        address fromToken,
        address destToken
    ) external override pure returns (bytes32) {
        return keccak256(abi.encodePacked(fromToken, destToken));
    }

    // If amount is 0 then it will withdraw the full balance of the token
    function requestWithdraw(
        address withdrawToken,
        bytes32 group,
        uint192 amount
    ) external payable override {

        emit WithdrawRequested(group, msg.sender, amount, uint64(msg.value), withdrawToken);

        // TODO: Validate the user sends approveWithdrawRequest's gasAmount * current gas price + 10% in msg.value

        // if (groupToTokens[group][0] == withdrawToken) {
        //     if (amount == 0) {
        //         amount = userBal[msg.sender].balances[group][0];
        //         require(amount > 0, "No balance");
        //     }
        //     else {
        //         require(userBal[msg.sender].balances[group][0] >= amount, "Not enough allowance pre");
        //     }
        //     userBal[msg.sender].balances[group][0] -= amount;
        //     groupData[group].totalAmount -= uint128(amount);
        // }
        // else {
        //     if (amount == 0) {
        //         amount = userBal[msg.sender].balances[group][1];
        //         require(amount > 0, "No balance");
        //     }
        //     else {
        //         require(userBal[msg.sender].balances[group][1] >= amount, "Not enough allowance post");
        //     }
        //     userBal[msg.sender].balances[group][1] -= amount;
        // }

        // IERC20(withdrawToken).universalTransfer(msg.sender, amount);
    }

    function approveWithdrawRequest(
        address withdrawToken,
        uint256 amount,
        address receiver
    ) public override { // Only gelato bot
        IERC20(withdrawToken).universalTransfer(receiver, amount);
    }

    function declineWithdrawRequest(
        bytes32 group,
        address user,
        address tokenRequested
    ) public override { // Only gelato bot
        emit WithdrawDeclined(group, user, tokenRequested);
    }

    function deposit(
        address fromToken,
        address destToken,
        uint192 amount
    ) external override payable {
        uint64 userGas = IERC20(fromToken).isETH()
            ? uint64(msg.value - amount)
            : uint64(msg.value);

        bytes32 group = keccak256(abi.encodePacked(fromToken, destToken));

        emit DepositedToGroup(group, msg.sender, amount, userGas);

        IERC20(fromToken).universalTransferFrom(msg.sender, deployed, amount);
    }

    struct Params {
        bytes32 group;
        uint256 minReturn;
        uint256[] distribution;
        uint256 flags;
    }

    // TODO: Rework to take in The Graph params from Polywrap check
    function performUpkeep(
        bytes calldata performData
    ) external override {
/*        Params[] memory data = abi.decode(performData, (Params[]));

        for (uint i; i < data.length; i++) {
            uint256 returnAmount = _swap(
                IERC20(groupToTokens[data[i].group][0]),
                IERC20(groupToTokens[data[i].group][1]),
                groupData[data[i].group].totalAmount,
                data[i].minReturn,
                data[i].distribution,
                data[i].flags
            );

            uint256 ratio = returnAmount*10**18 / groupData[data[i].group].totalAmount;

            for (uint64 userIndex; userIndex < groupData[data[i].group].counter; userIndex++) {
                address user = groupData[data[i].group].userAddresses[userIndex];

                if (userBal[user].balances[data[i].group][0] == 0) continue;

                userBal[user].balances[data[i].group][1] += (userBal[user].balances[data[i].group][0] * ratio) / 10**18;
                userBal[user].balances[data[i].group][0] = 0;
                delete groupData[data[i].group].userAddresses[userIndex];
            }
            // Clean the group
            groupData[data[i].group].totalAmount = 0;
            groupData[data[i].group].totalGas = 0;
            groupData[data[i].group].counter = 0;
        }
*/
    }

}