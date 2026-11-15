import table from "../../data/typical-prices.json";
import type { TypicalPrice } from "./compute/cost";

/**
 * "Typical price if you buy it yourself": one general table, estimated, used
 * for every space that lists no price of its own for a kind of material.
 * These are not any space's prices, and no space is known to sell at them.
 */
export const TYPICAL_PRICES = table.items as TypicalPrice[];
export const TYPICAL_PRICES_LABEL = table.label;
export const TYPICAL_PRICES_BASIS = table.basis;
