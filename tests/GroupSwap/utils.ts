import { Address, ethereum, Bytes, BigInt, ByteArray} from "@graphprotocol/graph-ts"
import { createMockedFunction, newMockEvent } from "matchstick-as/assembly/index"


import { GroupExecution, GroupOrder, WithdrawRequest } from "../../generated/schema"
import { DepositedToGroup, GroupExecuted, GroupSwap, WithdrawRequested } from "../../generated/PredaDex/GroupSwap"
import { handleDepositedToGroup, handleGroupExecuted, handleWithdrawRequested } from "../../src/mappings/groupswap"

export function handleNewDepositedToGroups(events: DepositedToGroup[]): void {
  events.forEach(event => {
      handleDepositedToGroup(event)
  })
}

export function handleNewWithdrawRequested(events: WithdrawRequested[]): void {
  events.forEach(event => {
      handleWithdrawRequested(event)
  })
}

export function handleNewGroupExecuted(events: GroupExecuted[]): void {
  events.forEach(event => {
      handleGroupExecuted(event)
  })
}

let contractAddress = Address.fromString("0x5101feD546FacccD309A77Ad755170f8fBf1E81D")
let contract = GroupSwap.bind(contractAddress)

export function createNewDepositedToGroupEvent(fromToken: string, destToken: string, user: string, amount: BigInt, userGas: BigInt): DepositedToGroup {
    let newDepositedToGroupEvent = changetype<DepositedToGroup>(newMockEvent())
    newDepositedToGroupEvent.parameters = new Array()

    let fromTokenParam = new ethereum.EventParam("fromToken", ethereum.Value.fromAddress(Address.fromString(fromToken)))
    let destTokenParam = new ethereum.EventParam("destToken", ethereum.Value.fromAddress(Address.fromString(destToken)))
    let userParam = new ethereum.EventParam("user", ethereum.Value.fromAddress(Address.fromString(user)))
    let amountParam = new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
    let userGasParam = new ethereum.EventParam("userGas", ethereum.Value.fromUnsignedBigInt(userGas))

    newDepositedToGroupEvent.parameters.push(fromTokenParam)
    newDepositedToGroupEvent.parameters.push(destTokenParam)
    newDepositedToGroupEvent.parameters.push(userParam)
    newDepositedToGroupEvent.parameters.push(amountParam)
    newDepositedToGroupEvent.parameters.push(userGasParam)

    return newDepositedToGroupEvent
}

export function createNewGroupExecutedEvent(groupId: string, returnAmount: BigInt ): GroupExecuted {
  let newGroupExecutedEvent = changetype<GroupExecuted>(newMockEvent())
  newGroupExecutedEvent.parameters = new Array()

  let groupIdParam = new ethereum.EventParam("groupId", ethereum.Value.fromBytes(Bytes.fromByteArray(ByteArray.fromHexString(groupId))))
  let returnAmountParam = new ethereum.EventParam("returnAmount", ethereum.Value.fromUnsignedBigInt(returnAmount))
  
  newGroupExecutedEvent.parameters.push(groupIdParam)
  newGroupExecutedEvent.parameters.push(returnAmountParam)

  return newGroupExecutedEvent
}

export function createNewWithdrawRequestEvent(depositTxnHash: string, user: string, amount: BigInt, userGas: BigInt, withdrawToken: string ): WithdrawRequested {
  let newWithdrawRequestEvent = changetype<WithdrawRequested>(newMockEvent())
  newWithdrawRequestEvent.parameters = new Array()

  let depositTxnHashParam = new ethereum.EventParam("depositTxnHash", ethereum.Value.fromBytes(Bytes.fromByteArray(ByteArray.fromHexString(depositTxnHash))))
  let userParam = new ethereum.EventParam("user", ethereum.Value.fromAddress(Address.fromString(user)))
  let amountParam = new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  let userGasParam = new ethereum.EventParam("userGas", ethereum.Value.fromUnsignedBigInt(userGas))
  let withdrawTokenParam = new ethereum.EventParam("withdrawTokenParam", ethereum.Value.fromAddress(Address.fromString(withdrawToken)))

  newWithdrawRequestEvent.parameters.push(depositTxnHashParam)
  newWithdrawRequestEvent.parameters.push(userParam)
  newWithdrawRequestEvent.parameters.push(amountParam)
  newWithdrawRequestEvent.parameters.push(userGasParam)
  newWithdrawRequestEvent.parameters.push(withdrawTokenParam)

  return newWithdrawRequestEvent
}
