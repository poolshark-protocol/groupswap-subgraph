import { BigDecimal, BigInt, ByteArray, Bytes, TypedMap, TypedMapEntry, Address } from "@graphprotocol/graph-ts"
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

import { JSON } from "assemblyscript-json"; 

export function handleDepositedToGroup(event: DepositedToGroup): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type

  //event params
  let groupId = event.params.groupId;
  let account = event.params.user;
  let depositAmount = event.params.amount;
  let userGas = event.params.userGas;

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  // create new GroupData if the pair doesn't exist

  //GroupData
  let groupEntity = GroupData.load(groupId.toHex())

  if (!groupEntity) {
    groupEntity = new GroupData(groupId.toHex())
    groupEntity.groupAmount = BigInt.fromI32(0)
    groupEntity.groupGwei = BigInt.fromI32(0)
  }

  groupEntity.groupAmount = groupEntity.groupAmount.plus(depositAmount)
  groupEntity.groupGwei = groupEntity.groupGwei.plus(userGas)

  //save groupEntity
  groupEntity.save()

  //UserData
  let userEntity = UserData.load(account.toHexString())

  if (!userEntity) {
    userEntity = new UserData(account.toHex())
    userEntity.groupAmounts = "{}";
  }
  

  let groupAmounts: JSON.Obj = <JSON.Obj>JSON.parse(userEntity.groupAmounts)
  let groupAmountObj: JSON.Obj | null = groupAmounts.getObj(groupId.toHex())
  let fromAmount: BigInt = BigInt.fromI32(0);
  
  // //if groupId exists
  if(groupAmountObj){
    let groupAmount: JSON.Obj = <JSON.Obj>JSON.parse(groupAmountObj.valueOf())
    let fromAmountStr: JSON.Str | null = groupAmount.getString("fromAmount")
    if(fromAmountStr){
      fromAmount = BigInt.fromString(JSON.parse(fromAmountStr.valueOf()).toString()).plus(depositAmount)
      groupAmount.set("fromAmount", fromAmount.toString())
      groupAmounts.set(groupId.toHex(), groupAmount)
    } 
  }
  // //if groupId doesn't exist
  // else{
  //   groupAmount = new JSON.Obj()
  //   groupAmount.set("fromAddress","0x1")
  //   groupAmount.set("destAddress","0x2")
  //   groupAmount.set("fromAmount",depositAmount)
  //   groupAmount.set("destAmount",0)
  //   groupAmounts.set("groupId1",groupAmount)
  // }
  
  

  //userEntity.groupAmounts = groupAmounts.stringify()


  // Entities can be written to the store with `.save()`
  userEntity.save()
  

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
  //let contract = Contract.bind(event.address)
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
