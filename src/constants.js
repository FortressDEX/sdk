import JSBI from 'jsbi';
export var ChainId;
(function (ChainId) {
    ChainId[ChainId["FUJI"] = 43113] = "FUJI";
    ChainId[ChainId["POLYGON"] = 137] = "POLYGON";
    ChainId[ChainId["WAGMI"] = 11111] = "WAGMI";
})(ChainId || (ChainId = {}));
export var TradeType;
(function (TradeType) {
    TradeType[TradeType["EXACT_INPUT"] = 0] = "EXACT_INPUT";
    TradeType[TradeType["EXACT_OUTPUT"] = 1] = "EXACT_OUTPUT";
})(TradeType || (TradeType = {}));
export var Rounding;
(function (Rounding) {
    Rounding[Rounding["ROUND_DOWN"] = 0] = "ROUND_DOWN";
    Rounding[Rounding["ROUND_HALF_UP"] = 1] = "ROUND_HALF_UP";
    Rounding[Rounding["ROUND_UP"] = 2] = "ROUND_UP";
})(Rounding || (Rounding = {}));
export const FACTORY_ADDRESS = {
    [ChainId.FUJI]: '0xE4A575550C2b460d2307b82dCd7aFe84AD1484dd',
    [ChainId.POLYGON]: '0x2276E7AC85d712ADf4128a5a62D0Fa5F1265fd86',
    [ChainId.WAGMI]: '0xf7D180bE35be07fA5B2EC584aB7bF2B701e6EB45'
};
export const INIT_CODE_HASH = '0x40231f6b438bce0797c9ada29b718a87ea0a5cea3fe9a771abdd76bd41a3e545';
export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000);
// exports for internal consumption
export const ZERO = JSBI.BigInt(0);
export const ONE = JSBI.BigInt(1);
export const TWO = JSBI.BigInt(2);
export const THREE = JSBI.BigInt(3);
export const FIVE = JSBI.BigInt(5);
export const TEN = JSBI.BigInt(10);
export const _100 = JSBI.BigInt(100);
export const _997 = JSBI.BigInt(997);
export const _1000 = JSBI.BigInt(1000);
export var SolidityType;
(function (SolidityType) {
    SolidityType["uint8"] = "uint8";
    SolidityType["uint256"] = "uint256";
})(SolidityType || (SolidityType = {}));
export const SOLIDITY_TYPE_MAXIMA = {
    [SolidityType.uint8]: JSBI.BigInt('0xff'),
    [SolidityType.uint256]: JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
};
//# sourceMappingURL=constants.js.map