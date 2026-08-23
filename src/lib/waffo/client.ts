import "server-only";
import { WaffoPancake } from "@waffo/pancake-ts";
import {
  getWaffoEnvironment,
  getWaffoMerchantId,
  getWaffoPrivateKey,
} from "./config";

let cached: WaffoPancake | null = null;

export function getWaffoClient(): WaffoPancake {
  cached ??= new WaffoPancake({
    merchantId: getWaffoMerchantId(),
    privateKey: getWaffoPrivateKey(),
    environment: getWaffoEnvironment(),
  });
  return cached;
}
