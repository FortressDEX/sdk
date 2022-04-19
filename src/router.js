import { TradeType } from './constants';
import invariant from 'tiny-invariant';
import { validateAndParseAddress } from './utils';
import { CAVAX } from './entities';
import { ChainId } from '.';
function toHex(currencyAmount) {
    return `0x${currencyAmount.raw.toString(16)}`;
}
const ZERO_HEX = '0x0';
/**
 * Represents the Uniswap V2 Router, and has static methods for helping execute trades.
 */
export class Router {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    /**
     * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
     * @param trade to produce call parameters for
     * @param options options for the call parameters
     */
    static swapCallParameters(trade, options, chainId = ChainId.POLYGON) {
        const etherIn = trade.inputAmount.currency === CAVAX[chainId];
        const etherOut = trade.outputAmount.currency === CAVAX[chainId];
        // the router does not support both ether in and out
        invariant(!(etherIn && etherOut), 'ETHER_IN_OUT');
        invariant(!('ttl' in options) || options.ttl > 0, 'TTL');
        const to = validateAndParseAddress(options.recipient);
        const amountIn = toHex(trade.maximumAmountIn(options.allowedSlippage, chainId));
        const amountOut = toHex(trade.minimumAmountOut(options.allowedSlippage, chainId));
        const path = trade.route.path.map(token => token.address);
        const deadline = 'ttl' in options
            ? `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(16)}`
            : `0x${options.deadline.toString(16)}`;
        const useFeeOnTransfer = Boolean(options.feeOnTransfer);
        let methodName;
        let args;
        let value;
        switch (trade.tradeType) {
            case TradeType.EXACT_INPUT:
                if (etherIn) {
                    methodName = useFeeOnTransfer ? 'swapExactAVAXForTokensSupportingFeeOnTransferTokens' : 'swapExactAVAXForTokens';
                    // (uint amountOutMin, address[] calldata path, address to, uint deadline)
                    args = [amountOut, path, to, deadline];
                    value = amountIn;
                }
                else if (etherOut) {
                    methodName = useFeeOnTransfer ? 'swapExactTokensForAVAXSupportingFeeOnTransferTokens' : 'swapExactTokensForAVAX';
                    // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
                    args = [amountIn, amountOut, path, to, deadline];
                    value = ZERO_HEX;
                }
                else {
                    methodName = useFeeOnTransfer
                        ? 'swapExactTokensForTokensSupportingFeeOnTransferTokens'
                        : 'swapExactTokensForTokens';
                    // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
                    args = [amountIn, amountOut, path, to, deadline];
                    value = ZERO_HEX;
                }
                break;
            case TradeType.EXACT_OUTPUT:
                invariant(!useFeeOnTransfer, 'EXACT_OUT_FOT');
                if (etherIn) {
                    methodName = 'swapAVAXForExactTokens';
                    // (uint amountOut, address[] calldata path, address to, uint deadline)
                    args = [amountOut, path, to, deadline];
                    value = amountIn;
                }
                else if (etherOut) {
                    methodName = 'swapTokensForExactAVAX';
                    // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
                    args = [amountOut, amountIn, path, to, deadline];
                    value = ZERO_HEX;
                }
                else {
                    methodName = 'swapTokensForExactTokens';
                    // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
                    args = [amountOut, amountIn, path, to, deadline];
                    value = ZERO_HEX;
                }
                break;
        }
        return {
            methodName,
            args,
            value
        };
    }
}
//# sourceMappingURL=router.js.map
