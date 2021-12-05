
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
    
    //assert.equals(ethereum.Value.fromString("result"), val)
})    

    // test("handleDepositedToGroup - should handle new userEntity", () => {
        
    // })