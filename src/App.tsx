import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Check,
  Info,
  Link as LinkIcon,
  Zap,
} from "lucide-react";
import {
  PRICING,
  QUANT_BYTES,
  QUANT_LABEL,
  recommendTiers,
  type ConfigResult,
  type Pattern,
  type Quant,
  type Vendor,
  type RecommendResult,
} from "./engine";
import { useUrlState } from "./useUrlState";

// =============================================================================
// FORMATTING
// =============================================================================

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtCurrency = (n: number) => `$${fmt(n, 2)}`;
const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

// =============================================================================
// TINY UI BITS
// =============================================================================

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  hint?: string;
  step?: number;
  min?: number;
}

/** Number input that allows transient empty/partial typing without snapping to 0. */
function NumberInput({ label, value, onChange, suffix, hint, step = 1, min = 0 }: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? String(value);
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={display}
          step={step}
          min={min}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            const n = parseFloat(raw);
            if (Number.isFinite(n)) onChange(n);
          }}
          onBlur={() => {
            if (draft === null) return;
            const n = parseFloat(draft);
            if (!Number.isFinite(n)) onChange(min);
            setDraft(null);
          }}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="text-xs text-slate-500 mt-1">{hint}</span>}
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="More info"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-slate-400 hover:text-slate-600 focus:text-slate-700 focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-64 max-w-[80vw] px-3 py-2 bg-slate-800 text-white text-xs rounded-md shadow-lg z-20 whitespace-normal leading-relaxed"
        >
          {text}
        </span>
      )}
    </span>
  );
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
  tooltip?: string;
}

function Select<T extends string>({ label, value, onChange, options, hint, tooltip }: SelectProps<T>) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="text-xs text-slate-500 mt-1">{hint}</span>}
    </div>
  );
}

function Expander({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center gap-2 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span className="font-medium text-slate-700">{title}</span>
      </button>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

// =============================================================================
// TIER CARD
// =============================================================================

function TierCard({
  tier,
  apiCost,
  badge,
}: {
  tier: ConfigResult;
  apiCost: number;
  badge?: { label: string; color: "indigo" | "green" } | null;
}) {
  const weekly = tier.weekly_cost_with_ft ?? tier.weekly_cost;
  const savings = apiCost - weekly;
  const savings_pct = apiCost > 0 ? (savings / apiCost) * 100 : 0;
  const named = tier.nearest_named;
  const ringClass =
    badge?.color === "green"
      ? "border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-200"
      : badge?.color === "indigo"
      ? "border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-200"
      : "border-slate-200 bg-white";
  const badgeText =
    badge?.color === "green" ? "text-emerald-700" : "text-indigo-700";

  return (
    <div className={`border rounded-lg p-4 ${ringClass}`}>
      {badge && (
        <div className={`flex items-center gap-1 text-xs font-semibold mb-2 uppercase tracking-wide ${badgeText}`}>
          <Check className="w-3 h-3" /> {badge.label}
        </div>
      )}
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="text-xl font-semibold text-slate-900">
            ~{tier.params_b}B {tier.arch === "moe" ? "MoE" : "dense"}
            {tier.arch === "moe" && (
              <span className="text-sm font-normal text-slate-500 ml-1">
                ({tier.active_params_b}B active)
              </span>
            )}
          </div>
          {named && (
            <div className="text-sm text-slate-600">
              similar to <span className="font-medium">{named.name}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">
            {fmtCurrency(weekly)}
            <span className="text-sm font-normal text-slate-500">/wk</span>
          </div>
          <div className="text-sm text-emerald-700 font-medium">
            saves {fmtCurrency(savings)} ({fmt(savings_pct, 0)}%)
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <span className="text-slate-500">Hardware:</span>{" "}
          <span className="font-medium text-slate-800">{tier.gpu}</span>
          {tier.replicas_needed > 1 && (
            <span className="ml-1 text-amber-700 font-medium">× {tier.replicas_needed}</span>
          )}
        </div>
        <div>
          <span className="text-slate-500">Quant:</span>{" "}
          <span className="font-medium text-slate-800">{QUANT_LABEL[tier.quant]}</span>
        </div>
        <div className="col-span-2">
          <span className="text-slate-500">Billing:</span>{" "}
          <span className="font-medium text-slate-800">{tier.billing_label}</span>
        </div>
        <div className="col-span-2">
          <span className="text-slate-500">GPU billed:</span>{" "}
          <span className="font-medium text-slate-800">
            {fmt(tier.billed_hours, 1)} hr/wk @ {fmtCurrency(tier.gpu_price_per_hr)}/hr
          </span>
        </div>
        {tier.ft_weekly !== undefined && tier.ft_weekly > 0 && (
          <div className="col-span-2 text-slate-500">
            includes {fmtCurrency(tier.ft_weekly)}/wk fine-tuning amortization
          </div>
        )}
      </div>

      {tier.saturated && (
        <div className="mt-3 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
          <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Peak hour exceeds one GPU's throughput at this active-param size — costs
            assume <strong>{tier.replicas_needed} parallel replicas</strong>. Consider
            larger GPUs, lower-precision quant, or a smaller model.
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DERIVATION
// =============================================================================

function Derivation({
  inputs,
  result,
  effectiveApi,
}: {
  inputs: { queries_per_week: number; input_tokens: number; output_tokens: number; overhead_gb: number };
  result: RecommendResult;
  effectiveApi: { input_per_1m: number; output_per_1m: number };
}) {
  const top = result.largest;
  if (!top) return null;
  const weekly = top.weekly_cost_with_ft ?? top.weekly_cost;
  return (
    <div className="text-sm text-slate-700 space-y-1.5 font-mono leading-relaxed">
      <div>
        1. API cost per query = ({fmtInt(inputs.input_tokens)} in × {fmtCurrency(effectiveApi.input_per_1m)}/M +{" "}
        {fmtInt(inputs.output_tokens)} out × {fmtCurrency(effectiveApi.output_per_1m)}/M) / 1M ={" "}
        <span className="font-semibold">
          {fmtCurrency(
            (inputs.input_tokens * effectiveApi.input_per_1m +
              inputs.output_tokens * effectiveApi.output_per_1m) /
              1_000_000
          )}
        </span>
      </div>
      <div>
        2. Weekly API budget = {fmtInt(inputs.queries_per_week)} queries × cost/query ={" "}
        <span className="font-semibold">{fmtCurrency(result.api_cost)}</span>
      </div>
      <div>3. Target: largest model whose weekly self-host cost ≤ this budget.</div>
      <div>
        4. Top tier: <span className="font-semibold">~{top.params_b}B {top.arch}</span> at{" "}
        <span className="font-semibold">{QUANT_LABEL[top.quant]}</span>
      </div>
      <div>
        5. VRAM required = {top.params_b}B × {QUANT_BYTES[top.quant]} B/param + {inputs.overhead_gb} GB overhead ={" "}
        <span className="font-semibold">{fmt(top.vram_needed_gb, 1)} GB</span>
      </div>
      <div>
        6. Cheapest GPU with ≥ {fmt(top.vram_needed_gb, 1)} GB VRAM ={" "}
        <span className="font-semibold">{top.gpu}</span> ({top.vram_available_gb} GB) @{" "}
        {fmtCurrency(top.gpu_price_per_hr)}/hr
        {top.replicas_needed > 1 && <> × {top.replicas_needed} replicas (saturation)</>}
      </div>
      <div>
        7. Cheapest billing mode for this traffic shape ={" "}
        <span className="font-semibold">{top.billing_label}</span>, {fmt(top.billed_hours, 1)} hr/wk billed
      </div>
      <div>
        8. Weekly self-host cost = {fmtCurrency(top.gpu_price_per_hr)}/hr × {fmt(top.billed_hours, 1)} hr ={" "}
        <span className="font-semibold">{fmtCurrency(top.weekly_cost)}</span>
        {top.ft_weekly !== undefined && top.ft_weekly > 0 && (
          <>
            {" "}+ {fmtCurrency(top.ft_weekly)} fine-tuning ={" "}
            <span className="font-semibold">{fmtCurrency(weekly)}</span>
          </>
        )}
      </div>
      <div className="pt-1">
        9. Savings vs API = {fmtCurrency(result.api_cost)} − {fmtCurrency(weekly)} ={" "}
        <span className="font-semibold text-emerald-700">{fmtCurrency(result.api_cost - weekly)}</span>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN APP
// =============================================================================

export default function App() {
  const [queries_per_week, setQpw] = useUrlState<number>("qpw", 500_000);
  const [input_tokens, setInTok] = useUrlState<number>("in", 1500);
  const [output_tokens, setOutTok] = useUrlState<number>("out", 400);
  const [api_key, setApiKey] = useUrlState<string>("api", "openai_gpt5");
  const [api_input_override, setApiInputOverride] = useUrlState<number>("ai", 1.0);
  const [api_output_override, setApiOutputOverride] = useUrlState<number>("ao", 3.0);
  const [pattern, setPattern] = useUrlState<Pattern>("pat", "business");
  const [quant_pref, setQuantPref] = useUrlState<Quant>("q", "fp16");
  const [vendor, setVendor] = useUrlState<Vendor>("v", "runpod");
  const [show_all_tiers, setShowAllTiers] = useState(false);

  // Advanced
  const [overhead_gb, setOverheadGb] = useUrlState<number>("oh", 4);
  const [cold_start_sec, setColdStartSec] = useUrlState<number>("cs", 30);
  const [min_params_b, setMinParamsB] = useUrlState<number>("mp", 0);
  const [ft_cost, setFtCost] = useUrlState<number>("ft", 0);
  const [ft_weeks, setFtWeeks] = useUrlState<number>("fw", 52);

  const apiOverride = api_key === "custom"
    ? { input_per_1m: api_input_override, output_per_1m: api_output_override }
    : undefined;

  const result = useMemo(
    () =>
      recommendTiers({
        pricing: PRICING,
        queries_per_week,
        input_tokens,
        output_tokens,
        api_key,
        api_override: apiOverride,
        pattern,
        vendor,
        quant_pref,
        min_params_b,
        overhead_gb,
        cold_start_sec,
        ft_cost,
        ft_weeks,
      }),
    [
      queries_per_week,
      input_tokens,
      output_tokens,
      api_key,
      api_input_override,
      api_output_override,
      pattern,
      vendor,
      quant_pref,
      min_params_b,
      overhead_gb,
      cold_start_sec,
      ft_cost,
      ft_weeks,
    ]
  );

  const apiOptions = useMemo(
    () =>
      Object.entries(PRICING.apis).map(([k, v]) => {
        const isActiveCustom = k === "custom" && api_key === "custom";
        const inP = isActiveCustom ? api_input_override : v.input_per_1m;
        const outP = isActiveCustom ? api_output_override : v.output_per_1m;
        return {
          value: k,
          label:
            k === "custom" && api_key !== "custom"
              ? v.label
              : `${v.label} ($${inP}/M in, $${outP}/M out)`,
        };
      }),
    [api_key, api_input_override, api_output_override]
  );

  const effectiveApiRates =
    api_key === "custom"
      ? { input_per_1m: api_input_override, output_per_1m: api_output_override }
      : PRICING.apis[api_key];

  const largest = result.largest;
  const cheapest = result.cheapest;
  const showCheapestSeparately =
    cheapest && largest && cheapest.params_b !== largest.params_b;

  const otherTiers = result.tiers.filter(
    (t) =>
      !(largest && t.params_b === largest.params_b && t.arch === largest.arch) &&
      !(showCheapestSeparately && cheapest && t.params_b === cheapest.params_b && t.arch === cheapest.arch)
  );

  const copyShareLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // ignore — older browsers
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              API vs Self-Host LLM Cost Calculator
            </h1>
            <p className="text-slate-600 mt-1 max-w-3xl">
              Given your traffic and the API price you'd pay, find the largest open-weight model
              you can self-host for the same cost or less.
            </p>
          </div>
          <button
            onClick={copyShareLink}
            className="text-sm flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-md hover:bg-white text-slate-700"
            title="Copy a link with all your inputs encoded"
          >
            <LinkIcon className="w-4 h-4" /> Copy share link
          </button>
        </header>

        {/* Inputs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Your workload
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <NumberInput label="Queries per week" value={queries_per_week} onChange={setQpw} step={1000} hint="Total LLM calls/week" />
            <NumberInput label="Avg input tokens" value={input_tokens} onChange={setInTok} step={100} hint="Per query (prompt + context)" />
            <NumberInput label="Avg output tokens" value={output_tokens} onChange={setOutTok} step={50} hint="Per query (response)" />
            <div className="flex flex-col">
              <Select
                label="Comparing against (API)"
                value={api_key}
                onChange={setApiKey}
                options={apiOptions}
              />
              <span className="text-xs text-slate-500 mt-1">
                Rates last updated <span className="font-mono">{PRICING.last_updated}</span>. Out of date? Pick{" "}
                <span className="font-medium">Custom</span>, or edit{" "}
                <code className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">src/pricing.json</code>.
              </span>
            </div>
            <Select<Pattern>
              label="Traffic pattern"
              value={pattern}
              onChange={setPattern}
              tooltip="How traffic is distributed over the week. Uniform = even 24/7. Business hours = Mon-Fri 9-6. Bursty = spiky weekday peaks. Cold-start-per-query = traffic so sparse every request pays a cold boot. Always-warm = treat as continuous so the GPU never spins down."
              options={[
                { value: "uniform", label: "Uniform (24/7 even)" },
                { value: "business", label: "Business hours (Mon-Fri 9-6)" },
                { value: "bursty", label: "Bursty (spiky peaks)" },
                { value: "cold_per_query", label: "Cold start on every query (very sparse)" },
                { value: "always_warm", label: "Always warm (no scale-down)" },
              ]}
            />
            <Select<Quant>
              label="Quantization"
              value={quant_pref}
              onChange={setQuantPref}
              options={[
                { value: "fp16", label: "FP16 (best quality, biggest)" },
                { value: "int8", label: "INT8 (balanced)" },
                { value: "int4", label: "INT4 (smallest, some quality loss)" },
              ]}
              hint="Lower precision = fits bigger model on same GPU"
            />
          </div>

          {api_key === "custom" && (
            <div className="mt-4 grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-md border border-slate-200">
              <NumberInput label="Input price ($/M tokens)" value={api_input_override} onChange={setApiInputOverride} step={0.1} />
              <NumberInput label="Output price ($/M tokens)" value={api_output_override} onChange={setApiOutputOverride} step={0.1} />
            </div>
          )}
        </div>

        {/* Advanced */}
        <div className="mb-5 space-y-2">
          <Expander title="Advanced settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select<Vendor>
                label="Cloud GPU vendor"
                value={vendor}
                onChange={setVendor}
                options={[
                  { value: "runpod", label: "Runpod (cheapest)" },
                  { value: "lambda", label: "Lambda Labs" },
                  { value: "modal", label: "Modal" },
                ]}
              />
              <NumberInput label="VRAM overhead (GB)" value={overhead_gb} onChange={setOverheadGb} step={1} hint="KV cache + activations buffer" />
              <NumberInput label="Cold-start penalty (sec)" value={cold_start_sec} onChange={setColdStartSec} step={5} hint="For scale-to-zero mode" />
              <NumberInput label="Min model size (B params)" value={min_params_b} onChange={setMinParamsB} step={1} hint="Filter out tiny models even if cheaper. 0 = no floor." />
              <NumberInput label="One-time fine-tuning cost ($)" value={ft_cost} onChange={setFtCost} step={100} hint="Added amortized to weekly cost" />
              <NumberInput label="Amortize over (weeks)" value={ft_weeks} onChange={setFtWeeks} step={1} min={1} hint="How long the fine-tune is in service" />
            </div>
          </Expander>
        </div>

        {/* Results */}
        {result.tiers.length === 0 ? (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900">Stick with the API</h3>
                <p className="text-amber-800 mt-1">
                  At this volume ({fmtInt(queries_per_week)} queries/week, {fmtCurrency(result.api_cost)}/wk on
                  the API), no self-host config beats the API price — even the smallest models on the cheapest
                  GPUs cost more than you'd pay the API directly.
                </p>
                <p className="text-amber-800 mt-2 text-sm">
                  Self-hosting starts winning at higher volumes. Try increasing queries/week or output tokens
                  to see the crossover.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-5">
              <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {result.tiers.length} self-host {result.tiers.length === 1 ? "option" : "options"} fit under
                  your API budget
                </h2>
                <div className="text-sm text-slate-600">
                  API cost: <span className="font-semibold text-slate-900">{fmtCurrency(result.api_cost)}/wk</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2 flex items-start gap-1.5">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                <span>
                  We highlight the <strong>largest</strong> model that still fits the budget (best quality you
                  can afford to host) and, separately, the <strong>cheapest</strong> tier (lowest weekly cost).
                  All listed tiers cost ≤ the API.
                </span>
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
                <strong>Note:</strong> Inference costs only. Engineering time (serving infra, evals, monitoring,
                on-call) and any fine-tuning compute beyond what you enter in Advanced are not included. GPU
                hourly rates are approximate — verify with your vendor before quoting.
              </p>

              <div className="space-y-3">
                {largest && (
                  <TierCard
                    tier={largest}
                    apiCost={result.api_cost}
                    badge={{ label: "Largest that fits", color: "indigo" }}
                  />
                )}
                {showCheapestSeparately && cheapest && (
                  <TierCard
                    tier={cheapest}
                    apiCost={result.api_cost}
                    badge={{ label: "Cheapest tier", color: "green" }}
                  />
                )}
                {(show_all_tiers ? otherTiers : otherTiers.slice(0, 2)).map((tier) => (
                  <TierCard key={`${tier.arch}-${tier.params_b}`} tier={tier} apiCost={result.api_cost} badge={null} />
                ))}
              </div>
              {otherTiers.length > 2 && (
                <button
                  onClick={() => setShowAllTiers(!show_all_tiers)}
                  className="mt-3 w-full px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors flex items-center justify-center gap-1.5"
                >
                  {show_all_tiers ? (
                    <>Show fewer <ChevronDown className="w-4 h-4 rotate-180" /></>
                  ) : (
                    <>Show all {result.tiers.length} options that fit <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>

            <Expander title="Show the math (derivation)">
              <Derivation
                inputs={{ queries_per_week, input_tokens, output_tokens, overhead_gb }}
                result={result}
                effectiveApi={effectiveApiRates}
              />
            </Expander>
          </>
        )}

        <footer className="mt-6 text-center text-xs text-slate-500">
          Pricing data last updated:{" "}
          <span className="font-mono">{PRICING.last_updated}</span> · edit{" "}
          <code className="px-1 py-0.5 bg-slate-200 rounded">src/pricing.json</code> to refresh.{" "}
          <a
            className="underline hover:text-slate-700"
            href="https://github.com/artvandelay/llm-api-vs-selfhost-calculator"
            target="_blank"
            rel="noreferrer"
          >
            Source on GitHub
          </a>
          .
        </footer>
      </div>
    </div>
  );
}
