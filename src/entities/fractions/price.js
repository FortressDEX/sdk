import { Token } from '../token';
import { TokenAmount } from './tokenAmount';
import { currencyEquals } from '../token';
import invariant from 'tiny-invariant';
import JSBI from 'jsbi';
import { TEN, ChainId } from '../../constants';
import { Fraction } from './fraction';
import { CurrencyAmount } from './currencyAmount';
export class Price extends Fraction {
    // denominator and numerator _must_ be raw, i.e. in the native representation
    constructor(baseCurrency, quoteCurrency, denominator, numerator) {
        super(numerator, denominator);
        this.baseCurrency = baseCurrency;
        this.quoteCurrency = quoteCurrency;
        this.scalar = new Fraction(JSBI.exponentiate(TEN, JSBI.BigInt(baseCurrency.decimals)), JSBI.exponentiate(TEN, JSBI.BigInt(quoteCurrency.decimals)));
    }
    static fromRoute(route) {
        const prices = [];
        for (const [i, pair] of route.pairs.entries()) {
            prices.push(route.path[i].equals(pair.token0)
                ? new Price(pair.reserve0.currency, pair.reserve1.currency, pair.reserve0.raw, pair.reserve1.raw)
                : new Price(pair.reserve1.currency, pair.reserve0.currency, pair.reserve1.raw, pair.reserve0.raw));
        }
        return prices.slice(1).reduce((accumulator, currentValue) => accumulator.multiply(currentValue), prices[0]);
    }
    get raw() {
        return new Fraction(this.numerator, this.denominator);
    }
    get adjusted() {
        return super.multiply(this.scalar);
    }
    invert() {
        return new Price(this.quoteCurrency, this.baseCurrency, this.numerator, this.denominator);
    }
    multiply(other) {
        invariant(currencyEquals(this.quoteCurrency, other.baseCurrency), 'TOKEN');
        const fraction = super.multiply(other);
        return new Price(this.baseCurrency, other.quoteCurrency, fraction.denominator, fraction.numerator);
    }
    // performs floor division on overflow
    quote(currencyAmount, chainId = ChainId.POLYGON) {
        invariant(currencyEquals(currencyAmount.currency, this.baseCurrency), 'TOKEN');
        if (this.quoteCurrency instanceof Token) {
            return new TokenAmount(this.quoteCurrency, super.multiply(currencyAmount.raw).quotient);
        }
        return CurrencyAmount.ether(super.multiply(currencyAmount.raw).quotient, chainId);
    }
    toSignificant(significantDigits = 6, format, rounding) {
        return this.adjusted.toSignificant(significantDigits, format, rounding);
    }
    toFixed(decimalPlaces = 4, format, rounding) {
        return this.adjusted.toFixed(decimalPlaces, format, rounding);
    }
}
//# sourceMappingURL=price.js.map