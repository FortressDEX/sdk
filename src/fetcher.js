import { Contract } from '@ethersproject/contracts';
import { getNetwork } from '@ethersproject/networks';
import { getDefaultProvider } from '@ethersproject/providers';
import { TokenAmount } from './entities/fractions/tokenAmount';
import { Pair } from './entities/pair';
import IPangolinPair from '@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/PangolinPair.sol/PangolinPair.json';
import invariant from 'tiny-invariant';
import ERC20 from './abis/ERC20.json';
import { ChainId } from './constants';
import { Token } from './entities/token';
let TOKEN_DECIMALS_CACHE = {};
/**
 * Contains methods for constructing instances of pairs and tokens from on-chain data.
 */
export class Fetcher {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    /**
     * Fetch information for a given token on the given chain, using the given ethers provider.
     * @param chainId chain of the token
     * @param address address of the token on the chain
     * @param provider provider used to fetch the token
     * @param symbol optional symbol of the token
     * @param name optional name of the token
     */
    static async fetchTokenData(chainId = ChainId.POLYGON, address, provider = getDefaultProvider(getNetwork(chainId)), symbol, name) {
        var _a;
        const parsedDecimals = typeof ((_a = TOKEN_DECIMALS_CACHE === null || TOKEN_DECIMALS_CACHE === void 0 ? void 0 : TOKEN_DECIMALS_CACHE[chainId]) === null || _a === void 0 ? void 0 : _a[address]) === 'number'
            ? TOKEN_DECIMALS_CACHE[chainId][address]
            : await new Contract(address, ERC20, provider).decimals().then((decimals) => {
                TOKEN_DECIMALS_CACHE = {
                    ...TOKEN_DECIMALS_CACHE,
                    [chainId]: {
                        ...TOKEN_DECIMALS_CACHE === null || TOKEN_DECIMALS_CACHE === void 0 ? void 0 : TOKEN_DECIMALS_CACHE[chainId],
                        [address]: decimals
                    }
                };
                return decimals;
            });
        return new Token(chainId, address, parsedDecimals, symbol, name);
    }
    /**
     * Fetches information about a pair and constructs a pair from the given two tokens.
     * @param tokenA first token
     * @param tokenB second token
     * @param provider the provider to use to fetch the data
     */
    static async fetchPairData(tokenA, tokenB, provider = getDefaultProvider(getNetwork(tokenA.chainId))) {
        invariant(tokenA.chainId === tokenB.chainId, 'CHAIN_ID');
        const address = Pair.getAddress(tokenA, tokenB, tokenA.chainId);
        const [reserves0, reserves1] = await new Contract(address, IPangolinPair.abi, provider).getReserves();
        const balances = tokenA.sortsBefore(tokenB) ? [reserves0, reserves1] : [reserves1, reserves0];
        return new Pair(new TokenAmount(tokenA, balances[0]), new TokenAmount(tokenB, balances[1]), tokenA.chainId);
    }
}
//# sourceMappingURL=fetcher.js.map