import { currencyEquals } from '../token';
import { CAVAX } from '../currency';
import invariant from 'tiny-invariant';
import JSBI from 'jsbi';
import _Big from 'big.js';
import toFormat from 'toformat';
import { Rounding, TEN, SolidityType, ChainId } from '../../constants';
import { parseBigintIsh, validateSolidityTypeInstance } from '../../utils';
import { Fraction } from './fraction';
const Big = toFormat(_Big);
export class CurrencyAmount extends Fraction {
    // amount _must_ be raw, i.e. in the native representation
    constructor(currency, amount) {
        const parsedAmount = parseBigintIsh(amount);
        validateSolidityTypeInstance(parsedAmount, SolidityType.uint256);
        super(parsedAmount, JSBI.exponentiate(TEN, JSBI.BigInt(currency.decimals)));
        this.currency = currency;
    }
    /**
     * Helper that calls the constructor with the ETHER currency
     * @param amount ether amount in wei
     * @param chainId
     */
    static ether(amount, chainId = ChainId.POLYGON) {
        return new CurrencyAmount(CAVAX[chainId], amount);
    }
    get raw() {
        return this.numerator;
    }
    add(other) {
        invariant(currencyEquals(this.currency, other.currency), 'TOKEN');
        return new CurrencyAmount(this.currency, JSBI.add(this.raw, other.raw));
    }
    subtract(other) {
        invariant(currencyEquals(this.currency, other.currency), 'TOKEN');
        return new CurrencyAmount(this.currency, JSBI.subtract(this.raw, other.raw));
    }
    toSignificant(significantDigits = 6, format, rounding = Rounding.ROUND_DOWN) {
        return super.toSignificant(significantDigits, format, rounding);
    }
    toFixed(decimalPlaces = this.currency.decimals, format, rounding = Rounding.ROUND_DOWN) {
        invariant(decimalPlaces <= this.currency.decimals, 'DECIMALS');
        return super.toFixed(decimalPlaces, format, rounding);
    }
    toExact(format = { groupSeparator: '' }) {
        Big.DP = this.currency.decimals;
        return new Big(this.numerator.toString()).div(this.denominator.toString()).toFormat(format);
    }
}
//# sourceMappingURL=currencyAmount.js.map