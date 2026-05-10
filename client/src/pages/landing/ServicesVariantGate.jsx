// Selects between the V2 grid Services and the V3 horizontal pinned Services.
// Kept separate from the switcher so we don't mount both at once.

import { useVariant } from "./lib/useVariant";
import ServicesGrid from "./Services.jsx";
import ServicesHorizontal from "./ServicesHorizontal.jsx";

export default function ServicesVariantGate() {
  const { variant } = useVariant();
  if (variant === "v3") return <ServicesHorizontal />;
  return <ServicesGrid />;
}
