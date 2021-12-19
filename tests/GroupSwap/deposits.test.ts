import { assert, createMockedFunction, clearStore, logStore, test, newMockEvent, newMockCall ,} from "matchstick-as/assembly/index"
import { BigInt, ByteArray, Bytes, store, Value } from "@graphprotocol/graph-ts"
import { ethereum, Address} from "@graphprotocol/graph-ts"
import { GroupOrder } from "../../generated/schema"
import { GroupSwap } from "../../generated/PredaDex/GroupSwap"
import {
    DepositedToGroup
  } from "../../generated/PredaDex/GroupSwap"
import { createNewDepositedToGroupEvent, handleNewDepositedToGroups} from "./utils"
import { JSON } from "assemblyscript-json"; 

let GROUPORDER_ENTITY_TYPE = "GroupOrder"
let ORDER_ENTITY_TYPE = "Order"

test("Can initialise store with an array of Entity objects", () => {
  let groupData = new GroupOrder("0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e")
  groupData.save()

  assert.fieldEquals(GROUPORDER_ENTITY_TYPE, "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
                                            "id",
                                            "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e")

  assert.fieldEquals(GROUPORDER_ENTITY_TYPE, "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
                                            "groupAmount",
                                            "0"
  )

  assert.fieldEquals(GROUPORDER_ENTITY_TYPE, "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
                                            "groupGwei",
                                            "0"
  )

  clearStore()
})
  
test("handleDepositedToGroup - should handle new GroupOrder", () => {

    // Call mappings
  let newDepositedToGroupEvent = createNewDepositedToGroupEvent(
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      BigInt.fromI32(1),
      BigInt.fromI32(2),
  )

  let contractAddress = Address.fromString("0x5101feD546FacccD309A77Ad755170f8fBf1E81D")
  let contractName    = "GroupSwap"
  let functionName    = "getGroup" 
  let functionSig     = "getGroup(address,address):(bytes32)"

  let fromAddress  = Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f")
  let destAddress  = Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
  let fromTokenParam = ethereum.Value.fromAddress(fromAddress)
  let destTokenParam = ethereum.Value.fromAddress(destAddress)
  
  let argsArray: Array<ethereum.Value> = [fromTokenParam, destTokenParam]

  let groupId = Bytes.fromByteArray(ByteArray.fromHexString("0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e"))
  
  createMockedFunction(contractAddress, functionName, functionSig)
    .withArgs(argsArray)
    .returns([ethereum.Value.fromBytes(groupId)])

  handleNewDepositedToGroups([newDepositedToGroupEvent])

  assert.fieldEquals(
      GROUPORDER_ENTITY_TYPE,
      "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
      "id",
      "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e"
  )

  assert.fieldEquals(
    GROUPORDER_ENTITY_TYPE,
    "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
    "groupAmount",
    "1"
  )

  assert.fieldEquals(
    GROUPORDER_ENTITY_TYPE,
    "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
    "groupGwei",
    "2"
  )

  clearStore()
})

test("handleDepositedToGroup - should handle existing GroupOrder", () => {

  let deposit = new GroupOrder("0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e")
  deposit.groupAmount = BigInt.fromI32(2)
  deposit.groupGwei   = BigInt.fromI32(3)
  deposit.save()

  // Call mappings
  let newDepositedToGroupEvent = createNewDepositedToGroupEvent(
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      BigInt.fromI32(1),
      BigInt.fromI32(2),
  )

  handleNewDepositedToGroups([newDepositedToGroupEvent])

  assert.fieldEquals(
      GROUPORDER_ENTITY_TYPE,
      "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
      "id",
      "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e"
  )

  assert.fieldEquals(
    GROUPORDER_ENTITY_TYPE,
    "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
    "groupAmount",
    "3"
  )

  assert.fieldEquals(
    GROUPORDER_ENTITY_TYPE,
    "0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e",
    "groupGwei",
    "5"
  )
 // logStore()

  clearStore()
})

test("handleDepositedToGroup - should handle new OpenOrder", () => {

  // Call mappings
  let newDepositedToGroupEvent = createNewDepositedToGroupEvent(
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      BigInt.fromI32(1),
      BigInt.fromI32(2),
  )

  handleNewDepositedToGroups([newDepositedToGroupEvent])

  //logStore()

  assert.fieldEquals(
    ORDER_ENTITY_TYPE, "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
    "id",
    "0xa16081f360e3847006db660bae1c6d1b2e17ec2a" 
  )
  clearStore()
})


