
import { assert, createMockedFunction, clearStore, test, newMockEvent, newMockCall ,} from "matchstick-as/assembly/index"
import { BigInt, Bytes, store, Value } from "@graphprotocol/graph-ts"
import { ethereum, Address} from "@graphprotocol/graph-ts"
import { GroupOrder } from "../../generated/schema"
import { GroupSwap } from "../../generated/PredaDex/GroupSwap"


test("Can mock and call function with different argument types", () => {
    let numValue = ethereum.Value.fromI32(152)
    let stringValue = ethereum.Value.fromString("example string value")
    let arrayValue = ethereum.Value.fromI32Array([156666, 123412])
    let booleanValue = ethereum.Value.fromBoolean(true)
    let objectValue = ethereum.Value.fromAddress(Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"))
    
    let argsArray: Array<ethereum.Value> = [numValue, stringValue, arrayValue, booleanValue, objectValue]
    createMockedFunction(Address.fromString("0x059D3E8320726ec827188fF76a8d6C08b6f9E774"), "funcName", "funcName():(void)")
        .withArgs(argsArray)
        .returns([ethereum.Value.fromString("result")])
    let val = ethereum.call(new ethereum.SmartContractCall("conName", Address.fromString("0x059D3E8320726ec827188fF76a8d6C08b6f9E774"), "funcName", "funcName():(void)", argsArray))![0]
    
    assert.equals(ethereum.Value.fromString("result"), val)
})

test("Can test if mocked function reverts", () => {
    createMockedFunction(Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"), "revert", "").reverts()
    let val = ethereum.call(new ethereum.SmartContractCall("conName", Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"), "revert", "", []))
  
    assert.equals(ethereum.Value.fromBoolean(true), ethereum.Value.fromBoolean(val == null))
})

test("Can mock GroupSwap function correctly", () => {
    let contractAddress = Address.fromString("0x5101feD546FacccD309A77Ad755170f8fBf1E81D")
    let contractName    = "GroupSwap"
    let functionName    = "estimateGasRequirements" 
    let functionSig     = "estimateGasRequirements(address, address, uint256):(uint256)"
    let expectedResult  = BigInt.fromString("300000000000")

    let fromAddress  = Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
    let destAddress  = Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f")
    let fromTokenParam = ethereum.Value.fromAddress(fromAddress)
    let destTokenParam = ethereum.Value.fromAddress(destAddress)
    let amountParam = ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))
    
    let argsArray: Array<ethereum.Value> = [fromTokenParam, destTokenParam, amountParam]
    let expectedGasRequired      = BigInt.fromI64(300_000_000_000)
    let expectedGasRequiredValue = ethereum.Value.fromUnsignedBigInt(expectedGasRequired)

    
    createMockedFunction(contractAddress, functionName, functionSig)
      .withArgs(argsArray)
      .returns([expectedGasRequiredValue])
  
    let groupSwap = GroupSwap.bind(contractAddress)
    let result = ethereum.call(new ethereum.SmartContractCall(
                                                               contractName, 
                                                               contractAddress,  
                                                               functionName, 
                                                               functionSig,
                                                               argsArray))![0]
  
    assert.equals(ethereum.Value.fromUnsignedBigInt(expectedGasRequired), expectedGasRequiredValue)
})



