import { NewGravatar, UpdatedGravatar } from '../generated/PredaDex/PredaDex'
import { PredaDex } from '../generated/schema'

export function handleDepostiedToGroup(event: DepositedToGroup): void {
  //set groupData
  let groupData = new GroupData(event.params.groupId.toHex())
  //set userData
}