import { CurrencyAmount } from './currencyAmount';
import invariant from 'tiny-invariant';
import JSBI from 'jsbi';
export class TokenAmount extends CurrencyAmount {
    // amount _must_ be raw, i.e. in the native representation
    constructor(token, amount) {
        super(token, amount);
        this.token = token;
    }
    add(other) {
        invariant(this.token.equals(other.token), 'TOKEN');
        return new TokenAmount(this.token, JSBI.add(this.raw, other.raw));
    }
    subtract(other) {
        invariant(this.token.equals(other.token), 'TOKEN');
        return new TokenAmount(this.token, JSBI.subtract(this.raw, other.raw));
    }
}
//# sourceMappingURL=tokenAmount.js.map