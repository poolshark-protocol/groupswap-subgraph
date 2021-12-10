import { BigDecimal, BigInt, ByteArray, Bytes, TypedMap, TypedMapEntry, Address } from "@graphprotocol/graph-ts"
import {
  DepositedToGroup,
  GroupExecuted,
  WithdrawDeclined,
  WithdrawRequested,
  WithdrawnFromGroupPost,
  WithdrawnFromGroupPre,
  GroupSwap
} from "../generated/PredaDex/GroupSwap"
import { 
 GroupOrder, UserOrder, UserAccount
} from "../generated/schema"

import { JSON } from "assemblyscript-json"; 

export function handleDepositedToGroup(event: DepositedToGroup): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type

  // //event params
  let fromToken = event.params.fromToken;
  let destToken = event.params.destToken;
  let account = event.params.user;
  let depositAmount = event.params.amount;
  let userGas = event.params.userGas;

  //transaction data
  let txnHash = event.transaction.hash;

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  // create new GroupData if the pair doesn't exist

  let groupSwap = GroupSwap.bind(Address.fromString("0x059D3E8320726ec827188fF76a8d6C08b6f9E774"))
  let groupId = groupSwap.getGroup(fromToken, destToken)

  //GroupData
  let groupEntity = GroupOrder.load(groupId.toHex())

  if (!groupEntity) {
    groupEntity = new GroupOrder(groupId.toHex())
    groupEntity.groupAmount = BigInt.fromI32(0)
    groupEntity.groupGwei = BigInt.fromI32(0)
  }

  groupEntity.groupAmount = groupEntity.groupAmount.plus(depositAmount)
  groupEntity.groupGwei = groupEntity.groupGwei.plus(userGas)
  groupEntity.fromToken = fromToken
  groupEntity.destToken = destToken

  //save groupEntity
  groupEntity.save()

  //UserData
  let userEntity = UserAccount.load(account.toHex())

  if (!userEntity) {
    userEntity = new UserAccount(account.toHex())
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

  //if groupId doesn't exist
  else{
    let groupAmount = new JSON.Obj()
    groupAmount.set("fromToken",fromToken.toHex())
    groupAmount.set("destToken",destToken.toHex())
    groupAmount.set("fromAmount",depositAmount.toString())
    groupAmount.set("destAmount",0)
    groupAmounts.set(groupId.toHex(),groupAmount)
  }
  
  userEntity.groupAmounts = groupAmounts.stringify()

  // Entities can be written to the store with `.save()`
  userEntity.save()

  // OrderData
  let orderEntity = new UserOrder(txnHash.toHex())

  orderEntity.gweiAdded  = userGas
  orderEntity.fromToken  = fromToken
  orderEntity.destToken  = destToken
  orderEntity.fromAmount = depositAmount
  orderEntity.account    = account

  orderEntity.save()
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
