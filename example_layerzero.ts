import {EndpointId} from '@layerzerolabs/lz-definitions';
import {addressToBytes32} from '@layerzerolabs/lz-v2-utilities';
import {Options} from '@layerzerolabs/lz-v2-utilities';
import { ethers, BigNumberish, BytesLike} from 'ethers';

const provider = new ethers.providers.JsonRpcProvider("https://rpc-prod-testnet-0eakp60405.t.conduit.xyz");
const signer = new ethers.Wallet("...", provider);

interface SendParam {
  dstEid: EndpointId; // Destination endpoint ID, represented as a number.
  to: BytesLike; // Recipient address, represented as bytes.
  amountLD: BigNumberish; // Amount to send in local decimals.
  minAmountLD: BigNumberish; // Minimum amount to send in local decimals.
  extraOptions: BytesLike; // Additional options supplied by the caller to be used in the LayerZero message.
  composeMsg: BytesLike; // The composed message for the send() operation.
  oftCmd: BytesLike; // The OFT command to be executed, unused in default OFT implementations.
}

// send tokens from a contract on one network to another
async function send_oft() {
    const oftAddress = "0x3fbfd80ef7591658d1d7ddec067f413efd6f985c";
    const toAddress = "0x03CdE1E0bc6C1e096505253b310Cf454b0b462FB";
    const eidB = 40161;

    // Create contract instances
    //const oftContract = new ethers.Contract(oftDeployment.address, oftDeployment.abi, signer);
    const contractABI = require('./abi.json');
    const oftContract = new ethers.Contract(oftAddress, contractABI, signer);

    const decimals = await oftContract.decimals();
    const amount = ethers.utils.parseUnits("50000", decimals);
    let options = Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes();

    // Now you can interact with the correct contract
    const oft = oftContract;

    const sendParam: SendParam = {
      dstEid: eidB,
      to: addressToBytes32(toAddress),
      amountLD: amount,
      minAmountLD: amount,
      extraOptions: options,
      composeMsg: ethers.utils.arrayify('0x'), // Assuming no composed message
      oftCmd: ethers.utils.arrayify('0x'), // Assuming no OFT command is needed
    };
    // Get the quote for the send operation
    const feeQuote = await oft.quoteSend(sendParam, false);
    const nativeFee = feeQuote.nativeFee;

    console.log(`Require ${nativeFee} to send token`);

    console.log(
      `sending ${amount} token(s) to network (${eidB})`,
    );

    //const ERC20Factory = await ethers.getContractFactory('ERC20');
    //const innerTokenAddress = await oft.token();

    const r = await oft.send(sendParam, {nativeFee: nativeFee, lzTokenFee: 0}, signer.address, {
      value: nativeFee,
    });
    console.log(`Send tx initiated. See: https://layerzeroscan.com/tx/${r.hash}`);
}

send_oft();
