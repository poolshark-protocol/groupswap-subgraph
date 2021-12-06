import { assert, createMockedFunction, clearStore, test, newMockEvent, newMockCall ,} from "matchstick-as/assembly/index"
import { BigInt, Bytes, store, Value } from "@graphprotocol/graph-ts"
import { ethereum, Address} from "@graphprotocol/graph-ts"
import { GroupData } from "../../generated/schema"
import { GroupSwap } from "../../generated/PredaDex/GroupSwap"
import {
    DepositedToGroup
  } from "../../generated/PredaDex/GroupSwap"
import { createNewDepositedToGroupEvent, handleNewDepositedToGroups } from "./utils"

let USERDATA_ENTITY_TYPE  = "UserData"
let GROUPDATA_ENTITY_TYPE = "GroupData"

test("Can initialise store with an array of Entity objects", () => {
  let deposit = new GroupData("0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e")
 // console.log(deposit.getBigInt("groupAmount").toString())
  deposit.save()

  // assert.fieldEquals(GROUPDATA_ENTITY_TYPE, 0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e,
  //                                           "groupAmount",
  //                                           Value.fromBigInt(BigInt.zero()).toString())

  // assert.fieldEquals(GROUPDATA_ENTITY_TYPE, "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
  //                                           "groupGwei",
  //                                           Value.fromBigInt(BigInt.zero()).toString())

  clearStore()
})
  
test("handleDepositedToGroup - should handle new groupEntity", () => {

    // Call mappings
  let newDepositedToGroupEvent = createNewDepositedToGroupEvent(
      "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
      "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      BigInt.fromI32(1),
      BigInt.fromI32(2),
  )

  handleNewDepositedToGroups([newDepositedToGroupEvent])

  // assert.fieldEquals(
  //     USERDATA_ENTITY_TYPE,
  //     "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
  //     "groupAmount",
  //     Value.fromBigInt(BigInt.fromI32(1)).toString()
  // )
  clearStore()
})

