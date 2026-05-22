import { mockProviders } from "../mock-data/providers";
import {
  mockResourcePriceHistory,
  mockResources
} from "../mock-data/resources";

import { dataSuccess } from "./errors";
import type { DataResult } from "./types";
import type { Proveedor, Recurso, RecursoPrecioHistorial } from "../../types/domain";

export function listMockProviders(): DataResult<Proveedor[]> {
  return dataSuccess(mockProviders);
}

export function listMockResources(): DataResult<Recurso[]> {
  return dataSuccess(mockResources);
}

export function listMockResourcePriceHistory(): DataResult<RecursoPrecioHistorial[]> {
  return dataSuccess(mockResourcePriceHistory);
}
