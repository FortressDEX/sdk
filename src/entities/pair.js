import { Price } from './fractions/price';
import { TokenAmount } from './fractions/tokenAmount';
import invariant from 'tiny-invariant';
import JSBI from 'jsbi';
import { pack, keccak256 } from '@ethersproject/solidity';
import { getCreate2Address } from '@ethersproject/address';
import { FACTORY_ADDRESS, INIT_CODE_HASH, MINIMUM_LIQUIDITY, ZERO, ONE, FIVE, _997, _1000, ChainId } from '../constants';
import { sqrt, parseBigintIsh } from '../utils';
import { InsufficientReservesError, InsufficientInputAmountError } from '../errors';
import { Token } from './token';
let PAIR_ADDRESS_CACHE = {};
export class Pair {
    constructor(tokenAmountA, tokenAmountB, chainId = ChainId.POLYGON) {
        const tokenAmounts = tokenAmountA.token.sortsBefore(tokenAmountB.token) // does safety checks
            ? [tokenAmountA, tokenAmountB]
            : [tokenAmountB, tokenAmountA];
        this.liquidityToken = new Token(tokenAmounts[0].token.chainId, Pair.getAddress(tokenAmounts[0].token, tokenAmounts[1].token, chainId), 18, 'AXP', 'avaXwap');
        this.tokenAmounts = tokenAmounts;
    }
    static getAddress(tokenA, tokenB, chainId = ChainId.POLYGON) {
        var _a;
        const tokens = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]; // does safety checks
        if (((_a = PAIR_ADDRESS_CACHE === null || PAIR_ADDRESS_CACHE === void 0 ? void 0 : PAIR_ADDRESS_CACHE[tokens[0].address]) === null || _a === void 0 ? void 0 : _a[tokens[1].address]) === undefined) {
            PAIR_ADDRESS_CACHE = {
                ...PAIR_ADDRESS_CACHE,
                [tokens[0].address]: {
                    ...PAIR_ADDRESS_CACHE === null || PAIR_ADDRESS_CACHE === void 0 ? void 0 : PAIR_ADDRESS_CACHE[tokens[0].address],
                    [tokens[1].address]: getCreate2Address(FACTORY_ADDRESS[chainId], keccak256(['bytes'], [pack(['address', 'address'], [tokens[0].address, tokens[1].address])]), INIT_CODE_HASH)
                }
            };
        }
        return PAIR_ADDRESS_CACHE[tokens[0].address][tokens[1].address];
    }
    /**
     * Returns true if the token is either token0 or token1
     * @param token to check
     */
    involvesToken(token) {
        return token.equals(this.token0) || token.equals(this.token1);
    }
    /**
     * Returns the current mid price of the pair in terms of token0, i.e. the ratio of reserve1 to reserve0
     */
    get token0Price() {
        return new Price(this.token0, this.token1, this.tokenAmounts[0].raw, this.tokenAmounts[1].raw);
    }
    /**
     * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
     */
    get token1Price() {
        return new Price(this.token1, this.token0, this.tokenAmounts[1].raw, this.tokenAmounts[0].raw);
    }
    /**
     * Return the price of the given token in terms of the other token in the pair.
     * @param token token to return price of
     */
    priceOf(token) {
        invariant(this.involvesToken(token), 'TOKEN');
        return token.equals(this.token0) ? this.token0Price : this.token1Price;
    }
    /**
     * Returns the chain ID of the tokens in the pair.
     */
    get chainId() {
        return this.token0.chainId;
    }
    get token0() {
        return this.tokenAmounts[0].token;
    }
    get token1() {
        return this.tokenAmounts[1].token;
    }
    get reserve0() {
        return this.tokenAmounts[0];
    }
    get reserve1() {
        return this.tokenAmounts[1];
    }
    reserveOf(token) {
        invariant(this.involvesToken(token), 'TOKEN');
        return token.equals(this.token0) ? this.reserve0 : this.reserve1;
    }
    getOutputAmount(inputAmount, chainId = ChainId.POLYGON) {
        invariant(this.involvesToken(inputAmount.token), 'TOKEN');
        if (JSBI.equal(this.reserve0.raw, ZERO) || JSBI.equal(this.reserve1.raw, ZERO)) {
            throw new InsufficientReservesError();
        }
        const inputReserve = this.reserveOf(inputAmount.token);
        const outputReserve = this.reserveOf(inputAmount.token.equals(this.token0) ? this.token1 : this.token0);
        const inputAmountWithFee = JSBI.multiply(inputAmount.raw, _997);
        const numerator = JSBI.multiply(inputAmountWithFee, outputReserve.raw);
        const denominator = JSBI.add(JSBI.multiply(inputReserve.raw, _1000), inputAmountWithFee);
        const outputAmount = new TokenAmount(inputAmount.token.equals(this.token0) ? this.token1 : this.token0, JSBI.divide(numerator, denominator));
        if (JSBI.equal(outputAmount.raw, ZERO)) {
            throw new InsufficientInputAmountError();
        }
        return [outputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount), chainId)];
    }
    getInputAmount(outputAmount, chainId = ChainId.POLYGON) {
        invariant(this.involvesToken(outputAmount.token), 'TOKEN');
        if (JSBI.equal(this.reserve0.raw, ZERO) ||
            JSBI.equal(this.reserve1.raw, ZERO) ||
            JSBI.greaterThanOrEqual(outputAmount.raw, this.reserveOf(outputAmount.token).raw)) {
            throw new InsufficientReservesError();
        }
        const outputReserve = this.reserveOf(outputAmount.token);
        const inputReserve = this.reserveOf(outputAmount.token.equals(this.token0) ? this.token1 : this.token0);
        const numerator = JSBI.multiply(JSBI.multiply(inputReserve.raw, outputAmount.raw), _1000);
        const denominator = JSBI.multiply(JSBI.subtract(outputReserve.raw, outputAmount.raw), _997);
        const inputAmount = new TokenAmount(outputAmount.token.equals(this.token0) ? this.token1 : this.token0, JSBI.add(JSBI.divide(numerator, denominator), ONE));
        return [inputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount), chainId)];
    }
    getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB) {
        invariant(totalSupply.token.equals(this.liquidityToken), 'LIQUIDITY');
        const tokenAmounts = tokenAmountA.token.sortsBefore(tokenAmountB.token) // does safety checks
            ? [tokenAmountA, tokenAmountB]
            : [tokenAmountB, tokenAmountA];
        invariant(tokenAmounts[0].token.equals(this.token0) && tokenAmounts[1].token.equals(this.token1), 'TOKEN');
        let liquidity;
        if (JSBI.equal(totalSupply.raw, ZERO)) {
            liquidity = JSBI.subtract(sqrt(JSBI.multiply(tokenAmounts[0].raw, tokenAmounts[1].raw)), MINIMUM_LIQUIDITY);
        }
        else {
            const amount0 = JSBI.divide(JSBI.multiply(tokenAmounts[0].raw, totalSupply.raw), this.reserve0.raw);
            const amount1 = JSBI.divide(JSBI.multiply(tokenAmounts[1].raw, totalSupply.raw), this.reserve1.raw);
            liquidity = JSBI.lessThanOrEqual(amount0, amount1) ? amount0 : amount1;
        }
        if (!JSBI.greaterThan(liquidity, ZERO)) {
            throw new InsufficientInputAmountError();
        }
        return new TokenAmount(this.liquidityToken, liquidity);
    }
    getLiquidityValue(token, totalSupply, liquidity, feeOn = false, kLast) {
        invariant(this.involvesToken(token), 'TOKEN');
        invariant(totalSupply.token.equals(this.liquidityToken), 'TOTAL_SUPPLY');
        invariant(liquidity.token.equals(this.liquidityToken), 'LIQUIDITY');
        invariant(JSBI.lessThanOrEqual(liquidity.raw, totalSupply.raw), 'LIQUIDITY');
        let totalSupplyAdjusted;
        if (!feeOn) {
            totalSupplyAdjusted = totalSupply;
        }
        else {
            invariant(!!kLast, 'K_LAST');
            const kLastParsed = parseBigintIsh(kLast);
            if (!JSBI.equal(kLastParsed, ZERO)) {
                const rootK = sqrt(JSBI.multiply(this.reserve0.raw, this.reserve1.raw));
                const rootKLast = sqrt(kLastParsed);
                if (JSBI.greaterThan(rootK, rootKLast)) {
                    const numerator = JSBI.multiply(totalSupply.raw, JSBI.subtract(rootK, rootKLast));
                    const denominator = JSBI.add(JSBI.multiply(rootK, FIVE), rootKLast);
                    const feeLiquidity = JSBI.divide(numerator, denominator);
                    totalSupplyAdjusted = totalSupply.add(new TokenAmount(this.liquidityToken, feeLiquidity));
                }
                else {
                    totalSupplyAdjusted = totalSupply;
                }
            }
            else {
                totalSupplyAdjusted = totalSupply;
            }
        }
        return new TokenAmount(token, JSBI.divide(JSBI.multiply(liquidity.raw, this.reserveOf(token).raw), totalSupplyAdjusted.raw));
    }
}
//# sourceMappingURL=pair.js.map