import type { HardwareId } from "@/features/builder/domain/hardware";
import type { PriceRange } from "../domain/price";
import { usePriceComparisonData } from "./usePriceComparison";

type PriceComparisonTestHarnessProps = {
  readonly hardwareId: HardwareId;
  readonly range: PriceRange;
};

export default function PriceComparisonTestHarness({
  hardwareId,
  range,
}: PriceComparisonTestHarnessProps) {
  const state = usePriceComparisonData(hardwareId, true, range);

  return (
    <section>
      <h2>{hardwareId}</h2>
      <output aria-label="请求签名">
        {hardwareId}:{range}
      </output>
      {state.comparison ? <div>{state.comparison.hardwareName}</div> : null}
      {state.history ? <svg aria-label={`${state.history.range} 价格趋势`} /> : null}
      {state.error ? <div role="alert">{state.error}</div> : null}
    </section>
  );
}
