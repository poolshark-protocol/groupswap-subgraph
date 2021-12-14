import { BigDecimal, BigInt, ByteArray, Bytes, TypedMap, TypedMapEntry, Address } from "@graphprotocol/graph-ts"
import {
  DepositedToGroup,
  GroupExecuted,
  WithdrawDeclined,
  WithdrawRequested,
  GroupSwap
} from "../generated/PredaDex/GroupSwap"
import { 
  CancelledOrder,
 CancelRequest,
 WithdrawRequest,
 GroupOrder, OpenOrder, UserAccount, CompletedOrder
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

  let groupSwap = GroupSwap.bind(Address.fromString("0x5101feD546FacccD309A77Ad755170f8fBf1E81D"))
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
  let newFromAmount: BigInt = BigInt.fromI32(0);

  // create groupAmounts JSON object
  let groupAmount = new JSON.Obj()
  groupAmount.set("fromToken",fromToken.toHex())
  groupAmount.set("destToken",destToken.toHex())
  
  // //if groupId exists
  if(groupAmountObj){
    let fromAmountStr: JSON.Value = groupAmountObj.valueOf().get("fromAmount")
    let destAmountStr: JSON.Value = groupAmountObj.valueOf().get("destAmount")
    //groupAmounts.set(groupId.toHex(), groupAmountObj.valueOf().get("fromAmount"))
    // let fromAmountStr: JSON.Str | null = groupAmount.getString("fromAmount")
    if(fromAmountStr){
      newFromAmount = BigInt.fromString(fromAmountStr.toString()).plus(depositAmount)
      groupAmount.set("fromAmount", newFromAmount.toString())
      groupAmount.set("destAmount", destAmountStr)
      groupAmounts.set(groupId.toHex(), groupAmount)
    }
  }

  //if groupId doesn't exist
  else{
    groupAmount.set("fromAmount",depositAmount.toString())
    groupAmount.set("destAmount","0")
    groupAmounts.set(groupId.toHex(),groupAmount)
  }
  
  userEntity.groupAmounts = groupAmounts.stringify()

  // Entities can be written to the store with `.save()`
  userEntity.save()

  // OrderData
  let orderEntity = new OpenOrder(txnHash.toHex())

  orderEntity.gweiAdded   = userGas
  orderEntity.fromToken   = fromToken
  orderEntity.destToken   = destToken
  orderEntity.fromAmount  = depositAmount
  orderEntity.account     = account
  orderEntity.groupId     = groupId
  orderEntity.block       = event.block.number
  orderEntity.blockIndex  = event.transaction.index
  orderEntity.save()
}
export function handleGroupExecuted(event: GroupExecuted): void {

}

export function handleWithdrawDeclined(event: WithdrawDeclined): void {}

export function handleWithdrawRequested(event: WithdrawRequested): void {
  let account = event.params.user
  let withdrawAmount = event.params.amount
  let withdrawToken = event.params.withdrawToken
  let depositTxnHash = event.params.depositTxnHash

  //GroupData
  let openOrder = OpenOrder.load(depositTxnHash.toHex())
  let completedOrder = CompletedOrder.load(depositTxnHash.toHex())

  if (openOrder) {
    let groupId = openOrder.groupId
    let groupOrder = GroupOrder.load(groupId.toHex())

    // cancel request
    if(groupOrder){
      if(withdrawToken.toHex() == groupOrder.fromToken.toHex()){
        let cancelRequest = CancelRequest.load(depositTxnHash.toHex())

        if(!cancelRequest){
          cancelRequest = new CancelRequest(depositTxnHash.toHex())
          cancelRequest.account = account
          cancelRequest.amount = openOrder.fromAmount
          cancelRequest.groupId = groupId
          cancelRequest.withdrawToken = openOrder.fromToken
          cancelRequest.save()
        }
      }
    }
  }
  else if(completedOrder) {
    let groupId = completedOrder.groupId
    let groupOrder = GroupOrder.load(groupId.toHex())

    // withdraw request
    if(groupOrder){
      if (withdrawToken.toHex() == groupOrder.destToken.toHex()){
        let withdrawRequest = WithdrawRequest.load(depositTxnHash.toHex())

        if(!withdrawRequest){
          withdrawRequest = new WithdrawRequest(depositTxnHash.toHex())
          withdrawRequest.account = account
          withdrawRequest.amount = completedOrder.destAmount
          withdrawRequest.groupId = groupId
          withdrawRequest.withdrawToken = withdrawToken
          withdrawRequest.save()
        }
      }
    }
  }
}
