
import { assert, createMockedFunction, clearStore, test, newMockEvent, newMockCall ,} from "matchstick-as/assembly/index"
import { BigInt, Bytes, store, Value } from "@graphprotocol/graph-ts"
import { ethereum, Address} from "@graphprotocol/graph-ts"
import { GroupData } from "../../generated/schema"
import {  } from "../../generated/PredaDex/GroupSwap"
import { handleDepositedToGroup } from "../../src/mapping"

import {
    DepositedToGroup,
    GroupExecuted,
    WithdrawDeclined,
    WithdrawRequested,
    WithdrawnFromGroupPost,
    WithdrawnFromGroupPre
  } from "../../generated/PredaDex/GroupSwap"


test("Can mock and call function with different argument types", () => {
    let numValue = ethereum.Value.fromI32(152)
    let stringValue = ethereum.Value.fromString("example string value")
    let arrayValue = ethereum.Value.fromI32Array([156666, 123412])
    let booleanValue = ethereum.Value.fromBoolean(true)
    let objectValue = ethereum.Value.fromAddress(Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"))
    
    let argsArray: Array<ethereum.Value> = [numValue, stringValue, arrayValue, booleanValue, objectValue]
    createMockedFunction(Address.fromString("0x90cBa2Bbb19ecc291A12066Fd8329D65FA1f1947"), "funcName", "funcName():(void)")
        .withArgs(argsArray)
        .returns([ethereum.Value.fromString("result")])
    let val = ethereum.call(new ethereum.SmartContractCall("conName", Address.fromString("0x90cBa2Bbb19ecc291A12066Fd8329D65FA1f1947"), "funcName", "funcName():(void)", argsArray))![0]
    
    assert.equals(ethereum.Value.fromString("result"), val)
})

test("Can test if mocked function reverts", () => {
    createMockedFunction(Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"), "revert", "").reverts()
    let val = ethereum.call(new ethereum.SmartContractCall("conName", Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"), "revert", "", []))
  
    assert.equals(ethereum.Value.fromBoolean(true), ethereum.Value.fromBoolean(val == null))
})

test("handleDepositedToGroup - should handle new userEntity", () => {
    let contractAddress = Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7")
    let expectedResult = Address.fromString("0x90cBa2Bbb19ecc291A12066Fd8329D65FA1f1947")
    let groupIdParam = BigInt.fromString("1234")
    createMockedFunction(contractAddress, "deposit", "gravatarToOwner(uint256):(address)")
      .withArgs([ethereum.Value.fromSignedBigInt(bigIntParam)])
      .returns([ethereum.Value.fromAddress(Address.fromString("0x90cBa2Bbb19ecc291A12066Fd8329D65FA1f1947"))])
  
    let gravity = Gravity.bind(contractAddress)
    let result = gravity.gravatarToOwner(bigIntParam)
  
    assert.equals(ethereum.Value.fromAddress(expectedResult), ethereum.Value.fromAddress(result))
})

