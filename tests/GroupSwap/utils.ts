import { Address, ethereum, Bytes, BigInt, ByteArray} from "@graphprotocol/graph-ts"
import { createMockedFunction, newMockEvent } from "matchstick-as/assembly/index"


import { GroupOrder } from "../../generated/schema"
import { DepositedToGroup, GroupSwap } from "../../generated/PredaDex/GroupSwap"
import { handleDepositedToGroup } from "../../src/mapping"

export function handleNewDepositedToGroups(events: DepositedToGroup[]): void {
  events.forEach(event => {
      handleDepositedToGroup(event)
  })
}

let contractAddress = Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7")
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
