import {
  type HardwareSearchCategory,
  type HardwareSearchFilters,
  type HardwareSearchSort,
  hardwareSearchCategories,
  hardwareSearchSorts,
} from "@/features/builder/api/HardwareApiClient";

const positiveNumber = (value: string | null): number | undefined => {
  if (value === null || value.trim() === "") {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
};

const positiveInteger = (value: string | null, fallback: number): number => {
  const parsed = positiveNumber(value);
  return parsed === undefined ? fallback : Math.max(1, Math.trunc(parsed));
};

export const readHardwareSearch = (params: URLSearchParams): HardwareSearchFilters => {
  const categoryValue = params.get("category");
  const sortValue = params.get("sort");
  const category = hardwareSearchCategories.find((candidate) => candidate === categoryValue);
  const sort = hardwareSearchSorts.find((candidate) => candidate === sortValue);
  const brands = params
    .getAll("brand")
    .map((brand) => brand.trim())
    .filter(Boolean);
  const keyword = params.get("q")?.trim();
  const minPrice = positiveNumber(params.get("minPrice"));
  const maxPrice = positiveNumber(params.get("maxPrice"));
  const minPerformance = positiveNumber(params.get("minPerformance"));
  const maxPower = positiveNumber(params.get("maxPower"));
  return {
    ...(keyword ? { keyword } : {}),
    ...(category === undefined ? {} : { category: category as HardwareSearchCategory }),
    ...(brands.length > 0 ? { brands } : {}),
    ...(minPrice === undefined ? {} : { minPrice }),
    ...(maxPrice === undefined ? {} : { maxPrice }),
    ...(minPerformance === undefined ? {} : { minPerformance }),
    ...(maxPower === undefined ? {} : { maxPower }),
    page: positiveInteger(params.get("page"), 1),
    size: 24,
    sort: (sort as HardwareSearchSort | undefined) ?? "relevance",
  };
};

export const writeHardwareSearch = (filters: HardwareSearchFilters): URLSearchParams => {
  const params = new URLSearchParams();
  const set = (key: string, value: string | number | undefined): void => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  };
  set("q", filters.keyword?.trim());
  set("category", filters.category);
  filters.brands?.forEach((brand) => {
    if (brand.trim() !== "") {
      params.append("brand", brand.trim());
    }
  });
  set("minPrice", filters.minPrice);
  set("maxPrice", filters.maxPrice);
  set("minPerformance", filters.minPerformance);
  set("maxPower", filters.maxPower);
  if ((filters.page ?? 1) > 1) {
    set("page", filters.page);
  }
  if (filters.sort !== undefined && filters.sort !== "relevance") {
    set("sort", filters.sort);
  }
  return params;
};
