import { BigDecimal, BigInt, ByteArray, Bytes, Address, store } from "@graphprotocol/graph-ts"
import {
  DepositedToGroup,
  GroupExecuted,
  WithdrawDeclined,
  WithdrawRequested,
  GroupSwap,
  GroupExecuted__Params
} from "../../generated/PredaDex/GroupSwap"
import { 
 CancelledOrder,
 CancelRequest,
 WithdrawRequest,
 GroupOrder, OpenOrder, UserAccount, CompletedOrder, GroupExecution
} from "../../generated/schema"

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
  let blockIndex = event.transaction.index
  let blockNumber = event.block.number

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
    let orderTxnHashes = new Array<Bytes>(0)
    orderTxnHashes.push(txnHash)
    groupEntity.orderTxnHashes = orderTxnHashes
  }
  else{
    let orderTxnHashes = groupEntity.orderTxnHashes
    orderTxnHashes.push(txnHash)
    groupEntity.orderTxnHashes = orderTxnHashes
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
  orderEntity.blockNumber = event.block.number
  orderEntity.blockIndex  = event.transaction.index
  orderEntity.save()
}

export function handleGroupExecuted(event: GroupExecuted): void {

  let groupId = event.params.groupId
  let returnAmount = event.params.returnAmount
  let txnHash = event.transaction.hash
  //TODO: add to emitted event
  let inputAmount = BigInt.fromI32(1)
  let gasUsed = BigInt.fromI32(2)

  //TODO: get list of OpenOrder hashes and add to destAmount // subtract from fromAmount
  let blockNumber = event.block.number
  let blockIndex  = event.transaction.index

  let groupExecution = GroupExecution.load(txnHash.toHex())

  if(!groupExecution){

    let newGroupExecution = new GroupExecution(txnHash.toHex())
    let groupOrder = GroupOrder.load(groupId.toHex())

    if(groupOrder){

      let openOrders = groupOrder.orderTxnHashes
      let newOpenOrders = new Array<Bytes>();
      let compltdTxnHashes = new Array<Bytes>();

      for (let i = 0 ; i < groupOrder.orderTxnHashes.length; ++i) {
        // load each txnHash from openOrders
        let openOrder = OpenOrder.load(openOrders[i].toHex())
        if(openOrder){
          let completedOrder = CompletedOrder.load(openOrders[i].toHex())
          let excludeTxnHash = (blockNumber == openOrder.blockNumber) && (blockIndex > openOrder.blockIndex)

          // check block deposited
          if(!completedOrder && !excludeTxnHash){

            // initialize completed order
            let newCompletedOrder = new CompletedOrder(openOrders[i].toHex())
            newCompletedOrder.account = openOrder.account
            newCompletedOrder.fromToken = openOrder.fromToken
            newCompletedOrder.destToken = openOrder.destToken
            newCompletedOrder.groupTxnHash = txnHash

            // divide up returnAmount for each order
            let fromAmountDecimal  = BigDecimal.fromString(openOrder.fromAmount.toString())
            let inputAmountDecimal = BigDecimal.fromString(inputAmount.toString())
            let orderGroupRatio    = fromAmountDecimal.div(inputAmountDecimal)
            let destAmountStr      = returnAmount.toBigDecimal().times(orderGroupRatio).toString().split('.')[0]
          
            // save entity
            newCompletedOrder.destAmount = BigInt.fromString(destAmountStr)
            newCompletedOrder.save()
            // remove from openOrder status
            store.remove('OpenOrder', openOrders[i].toHex())

            // add to list of completedOrders for GroupExecution
            compltdTxnHashes.push(openOrders[i])
          }
          else if (excludeTxnHash) {
            newOpenOrders.push(openOrders[i])
          }
          else {
            //report some error
          }
        }
        else{
          //report an error
        }
      }

      // save new txnHash list
      newGroupExecution.compltdTxnHashes = compltdTxnHashes

      // modify groupOrder and save changes
      groupOrder.groupAmount = groupOrder.groupAmount.minus(inputAmount)
      groupOrder.groupGwei = groupOrder.groupGwei.minus(gasUsed)
      groupOrder.orderTxnHashes = newOpenOrders
      groupOrder.save() 
    }    

    // TODO: store block and blockIndex
    newGroupExecution.returnAmount = returnAmount
    newGroupExecution.returnAmountLeft = returnAmount
    newGroupExecution.groupId = groupId
    newGroupExecution.usedGas = gasUsed
    newGroupExecution.inputAmount = inputAmount
    newGroupExecution.blockNumber = blockNumber
    newGroupExecution.blockIndex = blockIndex
    newGroupExecution.save()
  }

}

export function handleWithdrawDeclined(event: WithdrawDeclined): void {}

// TODO: if it can be declined right away...store a withdraw declined event?
// remove partial withdraws from event
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
    let originAccount = openOrder.account

    // check if account matches
    if(originAccount.toHex() == account.toHex()){
      if(withdrawToken.toHex() == openOrder.fromToken.toHex()){
        let cancelRequest = CancelRequest.load(depositTxnHash.toHex())

        // check for duplicate requests
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
    let originAccount = completedOrder.account

    // check if account matches
    if(originAccount.toHex() == account.toHex()){
      // check token requested matches
      if (withdrawToken.toHex() == completedOrder.destToken.toHex()){
        let withdrawRequest = WithdrawRequest.load(depositTxnHash.toHex())

        // check for duplicated requests
        if(!withdrawRequest){
          withdrawRequest = new WithdrawRequest(depositTxnHash.toHex())
          withdrawRequest.account = account
          withdrawRequest.amount = completedOrder.destAmount
          withdrawRequest.groupTxnHash =  completedOrder.groupTxnHash
          withdrawRequest.withdrawToken = withdrawToken
          withdrawRequest.save()
        }
      }
    }
  }
}
