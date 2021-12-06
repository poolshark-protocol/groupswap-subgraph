import { Address, ethereum, Bytes, BigInt } from "@graphprotocol/graph-ts"
import { newMockEvent } from "matchstick-as/assembly/index"

import { GroupData } from "../../generated/schema"
import { DepositedToGroup, GroupSwap } from "../../generated/PredaDex/GroupSwap"
import { handleDepositedToGroup } from "../../src/mapping"

export function handleNewDepositedToGroups(events: DepositedToGroup[]): void {
  events.forEach(event => {
      handleDepositedToGroup(event)
  })
}

let contractAddress = Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7")
let contract = GroupSwap.bind(contractAddress)

export function createNewDepositedToGroupEvent(groupId: string, user: string, amount: BigInt, userGas: BigInt): DepositedToGroup {
    let newDepositedToGroupEvent = changetype<DepositedToGroup>(newMockEvent())
    newDepositedToGroupEvent.parameters = new Array()

    let groupIdParam = new ethereum.EventParam("groupId", ethereum.Value.fromString(groupId))
    let userParam = new ethereum.EventParam("user", ethereum.Value.fromAddress(Address.fromString(user)))
    let amountParam = new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
    let userGasParam = new ethereum.EventParam("userGas", ethereum.Value.fromUnsignedBigInt(userGas))

    newDepositedToGroupEvent.parameters.push(groupIdParam)
    newDepositedToGroupEvent.parameters.push(userParam)
    newDepositedToGroupEvent.parameters.push(amountParam)
    newDepositedToGroupEvent.parameters.push(userGasParam)

    return newDepositedToGroupEvent
}
