import { assert, createMockedFunction, clearStore, logStore, test, newMockEvent, newMockCall ,} from "matchstick-as/assembly/index"
import { BigInt, Bytes, store, Value } from "@graphprotocol/graph-ts"
import { ethereum, Address} from "@graphprotocol/graph-ts"
import { GroupOrder, UserAccount} from "../../generated/schema"
import { GroupSwap } from "../../generated/PredaDex/GroupSwap"
import {
    DepositedToGroup
  } from "../../generated/PredaDex/GroupSwap"
import { createNewDepositedToGroupEvent, handleNewDepositedToGroups } from "./utils"
import { JSON } from "assemblyscript-json"; 

let USER_ENTITY_TYPE  = "UserAccount"
let GROUPORDER_ENTITY_TYPE = "GroupOrder"
let USERORDER_ENTITY_TYPE = "UserOrder"

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

  let address = Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7")

  let userAccount = new UserAccount(address.toHexString())
  let jsonString = "{}"

  let groupAmounts: JSON.Obj = <JSON.Obj>JSON.parse(jsonString)
  let groupAmount: JSON.Obj = new JSON.Obj()
  groupAmount.set("fromAddress","0x1")
  groupAmount.set("destAddress","0x2")
  groupAmount.set("fromAmount",10000000000)
  groupAmount.set("destAmount",0)
  groupAmounts.set("groupId1",groupAmount)
  
  userAccount.groupAmounts = groupAmounts.stringify()
  userAccount.save()

  assert.fieldEquals(USER_ENTITY_TYPE, "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7",
                                            "id",
                                            "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7")  

  assert.fieldEquals(USER_ENTITY_TYPE, "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7",
                                            "groupAmounts",
                                            "{\"groupId1\":{\"fromAddress\":\"0x1\",\"destAddress\":\"0x2\",\"fromAmount\":10000000000,\"destAmount\":0}}")  

  clearStore()
})
  
test("handleDepositedToGroup - should handle new GroupOrder", () => {

    // Call mappings
  let newDepositedToGroupEvent = createNewDepositedToGroupEvent(
      Bytes.fromHexString("0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e"),
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
      Bytes.fromHexString("0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e"),
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

  clearStore()
})

test("handleDepositedToGroup - should handle new UserAccount", () => {

  // Call mappings
  let newDepositedToGroupEvent = createNewDepositedToGroupEvent(
      Bytes.fromHexString("0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e"),
      "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      BigInt.fromI32(1),
      BigInt.fromI32(2),
  )

  handleNewDepositedToGroups([newDepositedToGroupEvent])

  //logStore()

  assert.fieldEquals(
    USER_ENTITY_TYPE,
    "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7",
    "id",
    "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7"
  )

  assert.fieldEquals(
    USER_ENTITY_TYPE,
    "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7",
    "groupAmounts",
    "{\"0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e\":{\"fromToken\":\"0x1\",\"destToken\":\"0x2\",\"fromAmount\":\"1\",\"destAmount\":0}}"
  )

  clearStore()
})

test("handleDepositedToGroup - should handle existing UserAccount with new group", () => {
  let address = Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7")
  let userAccount = new UserAccount(address.toHex())
  let jsonString = "{}"
  

  let groupAmounts: JSON.Obj = <JSON.Obj>JSON.parse(jsonString)
  let groupAmount: JSON.Obj = new JSON.Obj()
  groupAmount.set("fromAddress","0x1")
  groupAmount.set("destAddress","0x2")
  groupAmount.set("fromAmount",10000000000)
  groupAmount.set("destAmount",0)
  groupAmounts.set("groupId1",groupAmount)
  
  userAccount.groupAmounts = groupAmounts.stringify()
  userAccount.save()

  // Call mappings
  let newDepositedToGroupEvent = createNewDepositedToGroupEvent(
      Bytes.fromHexString("0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e"),
      "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      BigInt.fromI32(1),
      BigInt.fromI32(2),
  )

  handleNewDepositedToGroups([newDepositedToGroupEvent])

  //logStore()

  assert.fieldEquals(USER_ENTITY_TYPE, "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7",
  "id",
  "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7")  

  assert.fieldEquals(USER_ENTITY_TYPE, "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7",
  "groupAmounts",
  "{\"groupId1\":{\"fromAddress\":\"0x1\",\"destAddress\":\"0x2\",\"fromAmount\":10000000000,\"destAmount\":0},\"0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e\":{\"fromToken\":\"0x1\",\"destToken\":\"0x2\",\"fromAmount\":\"1\",\"destAmount\":0}}"
  )
  clearStore()
})

test("handleDepositedToGroup - should handle new OrderAccount", () => {
  let address = Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7")
  let userAccount = new UserAccount(address.toHex())
  let jsonString = "{}"
  

  let groupAmounts: JSON.Obj = <JSON.Obj>JSON.parse(jsonString)
  let groupAmount: JSON.Obj = new JSON.Obj()
  groupAmount.set("fromAddress","0x1")
  groupAmount.set("destAddress","0x2")
  groupAmount.set("fromAmount",10000000000)
  groupAmount.set("destAmount",0)
  groupAmounts.set("groupId1",groupAmount)
  
  userAccount.groupAmounts = groupAmounts.stringify()
  userAccount.save()

  // Call mappings
  let newDepositedToGroupEvent = createNewDepositedToGroupEvent(
      Bytes.fromHexString("0xe46f9cbe5d8c6d3c9df0fa21d0d8c906b17c3346d5af27bd6e59913321162a6e"),
      "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      BigInt.fromI32(1),
      BigInt.fromI32(2),
  )

  handleNewDepositedToGroups([newDepositedToGroupEvent])

  logStore()

  assert.fieldEquals(
    USERORDER_ENTITY_TYPE, "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
    "id",
    "0xa16081f360e3847006db660bae1c6d1b2e17ec2a" 
  )
  clearStore()
})
