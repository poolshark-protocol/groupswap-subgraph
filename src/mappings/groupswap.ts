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
 CancelRequest,
 WithdrawRequest,
 GroupOrder, Order, GroupExecution
} from "../../generated/schema"

import { JSON } from "assemblyscript-json";

const OPEN_STATUS             = "open"
const CANCELLED_STATUS        = "cancelled"
const EXECUTED_STATUS         = "executed"
const COMPLETED_STATUS        = "completed"

export function handleDepositedToGroup(event: DepositedToGroup): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type

  // //event params
  let fromToken = event.params.fromToken;
  let destToken = event.params.destToken;
  let account = event.params.user;
  let depositAmount = event.params.amount;
  let userGas = event.params.userGas;

  if(depositAmount == BigInt.fromI32(0) && userGas == BigInt.fromI32(0)){
    return
  }

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
    groupEntity.groupWei = BigInt.fromI32(0)
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
  groupEntity.groupWei = groupEntity.groupWei.plus(userGas)
  groupEntity.fromToken = fromToken
  groupEntity.destToken = destToken

  //save groupEntity
  groupEntity.save()

  // OrderData
  let orderEntity = new Order(txnHash.toHex())
  orderEntity.account         = account
  orderEntity.status          = OPEN_STATUS
  orderEntity.groupId         = groupId
  orderEntity.fromToken       = fromToken
  orderEntity.destToken       = destToken
  orderEntity.fromAmount      = depositAmount
  orderEntity.destAmount      = BigInt.fromI32(0)
  orderEntity.weiAdded        = userGas
  orderEntity.weiReturn       = BigInt.fromI32(0)
  orderEntity.depstTxnHash    = txnHash
  orderEntity.depstAmount     = depositAmount
  orderEntity.depstBlock      = event.block.number
  orderEntity.depstIndex      = event.transaction.index
  orderEntity.canclTxnHashes  = new Array<Bytes>()
  orderEntity.canclAmount     = BigInt.fromI32(0)
  orderEntity.wthdrwTxnHashes = new Array<Bytes>()
  orderEntity.wthdrwAmount    = BigInt.fromI32(0)
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
        let openOrder = Order.load(openOrders[i].toHex())
        if(openOrder && openOrder.status == "open"){
          // exclude txn hashes
          let excludeTxnHash = (blockNumber == openOrder.depstBlock) && (openOrder.depstIndex < blockIndex)
          
          // check block deposited
          if(!excludeTxnHash){

            // divide up returnAmount for each order
            let fromAmountDecimal  = BigDecimal.fromString(openOrder.fromAmount.toString())
            let inputAmountDecimal = BigDecimal.fromString(inputAmount.toString())
            let orderGroupRatio    = fromAmountDecimal.div(inputAmountDecimal)
            let destAmountStr      = returnAmount.toBigDecimal().times(orderGroupRatio).toString().split('.')[0]
          
            // save entity
            openOrder.status       = EXECUTED_STATUS
            openOrder.fromAmount   = BigInt.fromI32(0)
            openOrder.destAmount   = BigInt.fromString(destAmountStr)
            openOrder.returnAmount = BigInt.fromString(destAmountStr)
            openOrder.groupTxnHash = txnHash
            // TODO: split wei 80/20
            openOrder.weiReturn  = BigInt.fromI32(0)
            openOrder.save()

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
      groupOrder.groupWei = groupOrder.groupWei.minus(gasUsed)
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
  let amountParam = event.params.amount
  let withdrawToken = event.params.withdrawToken
  let depositTxnHash = event.params.depositTxnHash
  let txnHash = event.transaction.hash
  let blockNumber = event.block.number
  let blockIndex = event.transaction.index

  //GroupData
  let order = Order.load(depositTxnHash.toHex())
  let wthdrwAmount = BigInt.fromI32(0)
  

  // check if account matches
  if(order){
    let originAccount = order.account
    let accountMatches = originAccount.toHex() == account.toHex()
    if (order.status == 'open' && accountMatches) {
      let groupOrder = GroupOrder.load(order.groupId.toHex())  
      let fromTokenMatches = withdrawToken.toHex() == order.fromToken.toHex()
      if(fromTokenMatches && groupOrder){

        let amountLeft = order.fromAmount

        //check if user is trying to withdraw all
        if(amountParam >= amountLeft){
          wthdrwAmount = amountLeft
          order.status = CANCELLED_STATUS
          order.fromAmount = BigInt.fromI32(0)
          order.canclAmount = order.canclAmount.plus(amountLeft)
        }
        else{
          wthdrwAmount = amountParam
          order.fromAmount = order.fromAmount.minus(amountParam)
          order.wthdrwAmount = order.canclAmount.plus(amountParam)
        }
        
        groupOrder.groupAmount = groupOrder.groupAmount.minus(wthdrwAmount)
        

        let newCanclTxnHashes = order.canclTxnHashes
        newCanclTxnHashes.push(txnHash)
        order.canclTxnHashes = newCanclTxnHashes

        let cancelRequest = new CancelRequest(txnHash.toHex())
        cancelRequest.account = account
        cancelRequest.orderTxnHash = order.depstTxnHash
        cancelRequest.withdrawToken = order.fromToken
        cancelRequest.amount = amountParam
        cancelRequest.block = blockNumber
        cancelRequest.blockIndex = blockIndex

        //if no wei has been returned and the user has fully cancelled
        if(order.weiReturn == BigInt.fromI32(0) && order.fromAmount.equals(BigInt.fromI32(0))){
          cancelRequest.weiReturn = order.weiAdded
          order.weiReturn = order.weiAdded
          groupOrder.groupWei = groupOrder.groupWei.minus(order.weiAdded)
        }
        //else don't return any wei
        else{
          cancelRequest.weiReturn = BigInt.fromI32(0)
        }

        cancelRequest.save() 
        order.save()
        groupOrder.save()       
      }
      else{
        //handle error
      }
    }
    else if(order.status == 'executed' && accountMatches) {
      let destTokenMatches = withdrawToken.toHex() == order.destToken.toHex()
      let groupExecution = GroupExecution.load(order.groupTxnHash.toHex())
      // check token requested matches
      if (destTokenMatches && groupExecution){

        let amountLeft = order.destAmount

        //check if user is trying to withdraw all
        if(amountParam >= amountLeft){
          wthdrwAmount = amountLeft
          order.status = COMPLETED_STATUS
          order.destAmount = BigInt.fromI32(0)
          order.wthdrwAmount = order.wthdrwAmount.plus(amountLeft)
        }
        // else allow partial withdraw
        else{
          wthdrwAmount = amountParam
          order.destAmount = order.destAmount.minus(amountParam)
          order.wthdrwAmount = order.wthdrwAmount.plus(amountParam)
        }

        let newWthdrwTxnHashes = order.wthdrwTxnHashes
        newWthdrwTxnHashes.push(txnHash)
        order.wthdrwTxnHashes = newWthdrwTxnHashes
        
        let withdrawRequest = new WithdrawRequest(txnHash.toHex())
        withdrawRequest.account = account
        withdrawRequest.orderTxnHash = order.depstTxnHash
        withdrawRequest.withdrawToken = order.destToken
        withdrawRequest.amount = wthdrwAmount
        withdrawRequest.block = blockNumber
        withdrawRequest.blockIndex = blockIndex

        //if no wei has been returned and the user has fully withdrawn
        if(order.weiReturn == BigInt.fromI32(0) && order.fromAmount.equals(BigInt.fromI32(0))){
          //note: order.weiReturn is updated in GroupExecuted handler 
          withdrawRequest.weiReturn = order.weiReturn
          groupExecution.weiAmountLeft.minus(order.weiReturn)
        }
        //else don't return any wei
        else{
          withdrawRequest.weiReturn = BigInt.fromI32(0)
        }

        withdrawRequest.save()
        order.save()
        groupExecution.save()
      }
      else{
        //handle error
      }
    }
    else{
      //handle error
    }

  }
}
