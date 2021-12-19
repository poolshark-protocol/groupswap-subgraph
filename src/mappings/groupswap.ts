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
 GroupOrder, UserAccount, Order, GroupExecution
} from "../../generated/schema"

import { JSON } from "assemblyscript-json";

const OPEN_STATUS             = "open"
const CANCELLED_STATUS        = "cancelled"
const EXECUTED_STATUS         = "executed"
const COMPLETED_STATUS        = "complete"

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
  orderEntity.depstTxnHash    = txnHash
  orderEntity.depstAmount     = depositAmount
  orderEntity.depstBlock      = event.block.number
  orderEntity.depstIndex      = event.transaction.index
  orderEntity.canclTxnHashes  = new Array<Bytes>()
  orderEntity.canclAmount     = BigInt.fromI32(0)
  orderEntity.wthdrwTxnHashes = new Array<Bytes>()
  orderEntity.wthdrwAmount    = BigInt.fromI32(0)
  orderEntity.trnsfrTxnHashes = new Array<Bytes>()
  orderEntity.trnsfrAmount    = BigInt.fromI32(0)
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
            openOrder.weiReturned  = BigInt.fromI32(0)
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
  let txnHash = event.transaction.hash
  let blockNumber = event.block.number
  let blockIndex = event.transaction.index

  //GroupData
  let order = Order.load(depositTxnHash.toHex())
  

  // check if account matches
  if(order){
    let groupId = order.groupId
    let originAccount = order.account
    let accountMatches = originAccount.toHex() == account.toHex()
    if (order.status == 'open' && accountMatches) {
      let fromTokenMatches = withdrawToken.toHex() == order.fromToken.toHex()
      if(fromTokenMatches){
        let cancelRequest = new CancelRequest(txnHash.toHex())
        cancelRequest.account = account
        cancelRequest.orderTxnHash = order.depstTxnHash
        cancelRequest.withdrawToken = order.fromToken
        cancelRequest.amount = withdrawAmount
        cancelRequest.block = blockNumber
        cancelRequest.blockIndex = blockIndex
        cancelRequest.save()
      }
      else{
        //handle error
      }
    }
    else if(order.status == 'executed' && accountMatches) {
      let destTokenMatches = withdrawToken.toHex() == order.destToken.toHex()
      // check token requested matches
      if (destTokenMatches){
        let withdrawRequest = new WithdrawRequest(txnHash.toHex())
        withdrawRequest.account = account
        withdrawRequest.orderTxnHash = order.depstTxnHash
        withdrawRequest.withdrawToken = order.destToken
        withdrawRequest.amount = withdrawAmount
        withdrawRequest.block = blockNumber
        withdrawRequest.blockIndex = blockIndex
        withdrawRequest.save()
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
