import { BigDecimal, BigInt, Bytes, TypedMap, TypedMapEntry } from "@graphprotocol/graph-ts"
import {
  DepositedToGroup,
  GroupExecuted,
  WithdrawDeclined,
  WithdrawRequested,
  WithdrawnFromGroupPost,
  WithdrawnFromGroupPre
} from "../generated/PredaDex/GroupSwap"
import { 
 GroupData, UserData
} from "../generated/schema"

export function handleDepositedToGroup(event: DepositedToGroup): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let groupEntity = GroupData.load(event.params.groupId.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  // create new GroupData if the pair doesn't exist
  if (!groupEntity) {
    groupEntity = new GroupData(event.transaction.from.toHex())
    groupEntity.groupAmount = BigInt.fromI32(0).toBigDecimal()
    groupEntity.groupGwei = BigInt.fromI32(0)
  }

  groupEntity.groupAmount = groupEntity.groupAmount.plus(event.params.amount.toBigDecimal())
  groupEntity.groupGwei = groupEntity.groupGwei.plus(event.params.userGas)

  // Entities can be written to the store with `.save()`
  groupEntity.save()

  let userEntity = UserData.load(event.params.user.toHex())

  if (!userEntity) {
    userEntity = new UserData(event.transaction.from.toHex())
    userEntity.groupMap = "{}";
  }

  //add current group to userEntity if missing
  //update amount based on deposit

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.



  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.estimateGasRequirements(...)
  // - contract.getGroup(...)
}

export function handleGroupExecuted(event: GroupExecuted): void {}

export function handleWithdrawDeclined(event: WithdrawDeclined): void {}

export function handleWithdrawRequested(event: WithdrawRequested): void {}

export function handleWithdrawnFromGroupPost(
  event: WithdrawnFromGroupPost
): void {}

export function handleWithdrawnFromGroupPre(
  event: WithdrawnFromGroupPre
): void {}
