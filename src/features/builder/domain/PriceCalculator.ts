import type { SelectedComponents } from "./hardware";

const selectedValues = (selection: SelectedComponents) => [
  selection.cpu,
  selection.gpu,
  selection.motherboard,
  selection.ram,
  selection.storage,
  selection.cooling,
  selection.power_supply,
  selection.case,
];

export const calculateTotalPrice = (selection: SelectedComponents): number =>
  selectedValues(selection).reduce((total, component) => total + (component?.price ?? 0), 0);

export const calculatePowerUsage = (selection: SelectedComponents): number =>
  [
    selection.cpu,
    selection.gpu,
    selection.motherboard,
    selection.ram,
    selection.storage,
    selection.cooling,
    selection.case,
  ].reduce((total, component) => total + (component?.power ?? 0), 0);

export const calculateRecommendedPsuWattage = (powerUsage: number): number =>
  Math.ceil((powerUsage * 1.2) / 50) * 50;
