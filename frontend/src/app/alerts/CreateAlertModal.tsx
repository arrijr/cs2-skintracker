"use client";
import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Bell, AlarmClock } from "lucide-react";
import { Alert } from "@/hooks/useAlerts";
import { apiUrl, swrFetcher } from "@/lib/api";

type RangeKey = "1M" | "3M" | "6M" | "1J";
const RANGE_DAYS: Record<RangeKey, number> = { "1M": 30, "3M": 90, "6M": 180, "1J": 365 };

interface PriceHistoryResponse {
  data?: Array<{ date: string; price: number }>;
  history?: Array<{ date: string; price: number }>;
}

interface CreateAlertModalProps {
  onCreate: (data: Partial<Alert>) => Promise<void>;
  /** Pre-fill skin id (hides skin input, locks type to price_threshold). */
  defaultSkinId?: number;
  /** Display-only label for the locked skin. */
  defaultSkinName?: string;
  /** Pre-fill price (used as default for price_threshold target). */
  defaultPrice?: number;
  /** 90-day low for this skin — anchors the realism slider. */
  defaultPriceMin?: number | null;
  /** Controlled mode — when provided, modal is opened/closed via props. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When true (default), render the built-in "+ New alert" trigger. */
  showTrigger?: boolean;
}

export function CreateAlertModal({
  onCreate,
  defaultSkinId,
  defaultSkinName,
  defaultPrice,
  defaultPriceMin,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: CreateAlertModalProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (o: boolean) => {
    if (isControlled) onOpenChange?.(o);
    else setUncontrolledOpen(o);
  };

  const hasDefaultSkin = defaultSkinId != null;
  // When a skin is pre-bound, default to "below current price" pattern (90% of current).
  const initialPrice = defaultPrice != null && defaultPrice > 0
    ? (defaultPrice * 0.9).toFixed(2)
    : '';

  const [type, setType] = useState<Alert['type']>('price_threshold');
  const [range, setRange] = useState<RangeKey>("3M");
  const [skinId, setSkinId] = useState(hasDefaultSkin ? String(defaultSkinId) : '');
  const [caseId, setCaseId] = useState('');
  const [emailChannel, setEmailChannel] = useState(true);
  const [inAppChannel, setInAppChannel] = useState(true);
  const [direction, setDirection] = useState<'above' | 'below'>(hasDefaultSkin ? 'below' : 'above');
  const [price, setPrice] = useState(initialPrice);
  const [thresholdPercent, setThresholdPercent] = useState('5');
  const [tier, setTier] = useState('FN');
  const [maxPrice, setMaxPrice] = useState('');
  const [evMarginPercent, setEvMarginPercent] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Price history (only when skin-scoped + modal open)
  const days = RANGE_DAYS[range];
  const shouldFetchHistory = hasDefaultSkin && open && defaultSkinId != null;
  const { data: historyResp, isLoading: historyLoading } = useSWR<PriceHistoryResponse>(
    shouldFetchHistory
      ? apiUrl(`/api/v1/skins/${defaultSkinId}/history?days=${days}`)
      : null,
    (key: string) => swrFetcher(key) as Promise<PriceHistoryResponse>,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const historyData = useMemo(() => {
    const raw = historyResp?.history ?? historyResp?.data ?? [];
    return raw.map((d) => ({ date: d.date, price: Number(d.price) }));
  }, [historyResp]);

  const currentPrice = defaultPrice ?? 0;
  const targetNum = parseFloat(price);
  const validTarget = Number.isFinite(targetNum) && targetNum > 0;

  // Realism: anchored on 90-day low (priceMin).
  // target >= current        => 1.0 (far right, very realistic — fires now)
  // target in [min90, curr]  => 0.5..1.0 (linear; reached in last 90d)
  // target < min90           => 0..0.5 (would need a new low)
  const realismPosition = useMemo(() => {
    const current = currentPrice;
    const min90 = defaultPriceMin ?? current * 0.7;
    if (current <= 0 || !validTarget || targetNum <= 0) return 0.5;
    if (targetNum >= current) return 1.0;
    if (targetNum >= min90) {
      return 0.5 + 0.5 * (targetNum - min90) / (current - min90);
    }
    const floor = min90 * 0.5;
    if (min90 - floor <= 0) return 0;
    return Math.max(0, 0.5 * (targetNum - floor) / (min90 - floor));
  }, [targetNum, currentPrice, defaultPriceMin, validTarget]);

  function reset() {
    setType('price_threshold');
    setSkinId(hasDefaultSkin ? String(defaultSkinId) : '');
    setCaseId('');
    setEmailChannel(true);
    setInAppChannel(true);
    setDirection(hasDefaultSkin ? 'below' : 'above');
    setPrice(initialPrice);
    setThresholdPercent('5');
    setTier('FN');
    setMaxPrice('');
    setEvMarginPercent('10');
    setError(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const channels: string[] = [];
      if (emailChannel) channels.push('email');
      if (inAppChannel) channels.push('in_app');
      if (channels.length === 0) throw new Error('At least one channel required');

      let config: Record<string, any> = {};
      if (type === 'price_threshold') config = { direction, price: parseFloat(price) };
      if (type === 'volatility') config = { thresholdPercent: parseFloat(thresholdPercent), windowHours: 24 };
      if (type === 'float_tier') config = { tier, maxPrice: parseFloat(maxPrice) };
      if (type === 'case_ev') config = { evMarginPercent: parseFloat(evMarginPercent) };

      await onCreate({
        type,
        skinId: type === 'case_ev' ? null : (skinId ? parseInt(skinId, 10) : null),
        caseId: type === 'case_ev' ? (caseId ? parseInt(caseId, 10) : null) : null,
        config,
        channels,
      });
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); setOpen(o); }}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2">
            <Plus className="h-4 w-4" />
            New alert
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className={`bg-slate-950 border-slate-800 text-white max-h-[90vh] overflow-y-auto ${
          hasDefaultSkin ? "sm:max-w-2xl" : "max-w-md"
        }`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            {hasDefaultSkin
              ? `Price Alert${defaultSkinName ? ` — ${defaultSkinName}` : ""}`
              : "Create alert"}
          </DialogTitle>
        </DialogHeader>

        {hasDefaultSkin ? (
          <div className="space-y-5 pt-2">
            {/* Time-range tabs */}
            <div className="flex items-center gap-1.5">
              {(Object.keys(RANGE_DAYS) as RangeKey[]).map((r) => {
                const active = r === range;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={
                      active
                        ? "px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm"
                        : "px-3 py-1 rounded-full text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            {/* Chart */}
            <div className="relative h-56 w-full rounded-xl bg-slate-900/50 border border-slate-800 p-3">
              {historyLoading ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  Loading price history…
                </div>
              ) : historyData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  Price history not available yet
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={historyData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="alertChartFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="alertChartStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#475569"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        tickFormatter={(d: string) => {
                          const date = new Date(d);
                          return `${String(date.getDate()).padStart(2, "0")}.${String(
                            date.getMonth() + 1
                          ).padStart(2, "0")}.`;
                        }}
                        interval="preserveStartEnd"
                        minTickGap={40}
                      />
                      <YAxis
                        stroke="#475569"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        tickFormatter={(v: number) => `€${v.toFixed(0)}`}
                        width={48}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid #334155",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#94a3b8" }}
                        formatter={(v: number) => [`€${v.toFixed(2)}`, "Price"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="url(#alertChartStroke)"
                        strokeWidth={2}
                        fill="url(#alertChartFill)"
                      />
                      {validTarget && (
                        <ReferenceLine
                          y={targetNum}
                          stroke="#f59e0b"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: `Target €${targetNum.toFixed(2)}`,
                            position: "insideTopLeft",
                            fill: "#f59e0b",
                            fontSize: 10,
                            offset: 8,
                          }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                  {validTarget && (
                    <AlarmClock className="absolute left-4 top-3 h-4 w-4 text-amber-400 drop-shadow" />
                  )}
                </>
              )}
            </div>

            {/* Current + Target price row */}
            <div className="flex items-end justify-between gap-4 pt-1">
              <div>
                <div className="text-3xl font-semibold tabular-nums text-white">
                  €{currentPrice.toFixed(2)}
                </div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">
                  Current price
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-amber-500/5 border-amber-500/40 focus-visible:ring-amber-500/40 text-amber-300 text-2xl font-semibold tabular-nums text-right w-40 h-12 pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-300 text-lg font-semibold pointer-events-none">
                    €
                  </span>
                </div>
                <div className="text-xs uppercase tracking-wider text-amber-400/80 mt-1">
                  Target price
                </div>
              </div>
            </div>

            {/* Realism slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
                <span>Unrealistic</span>
                <span>Realistic</span>
              </div>
              <div className="relative h-3 rounded-full bg-gradient-to-r from-red-500/70 via-amber-500/80 to-emerald-500/80 overflow-visible">
                <div
                  className="absolute -top-1.5 -translate-x-1/2 transition-[left] duration-200"
                  style={{ left: `${realismPosition * 100}%` }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 border-2 border-amber-400 shadow-lg shadow-amber-500/30">
                    <AlarmClock className="h-3 w-3 text-amber-300" />
                  </div>
                </div>
              </div>
              {defaultPriceMin != null && currentPrice > 0 && (
                <p className="text-[11px] text-slate-500 pt-0.5 leading-relaxed">
                  Target in [€{defaultPriceMin.toFixed(2)}, €{currentPrice.toFixed(2)}] = realistic
                  (reached in last 90 days). Below €{defaultPriceMin.toFixed(2)} = unrealistic
                  (new low needed).
                </p>
              )}
              <p className="text-xs text-slate-500 pt-1">
                {validTarget && currentPrice > 0
                  ? targetNum >= currentPrice
                    ? "Target is at or above current price — alert fires immediately."
                    : `Alert fires when price drops to €${targetNum.toFixed(2)} (${(
                        (1 - targetNum / currentPrice) * 100
                      ).toFixed(0)}% below current).`
                  : "Set a target price below the current price."}
              </p>
            </div>

            {/* Channels */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs uppercase tracking-wider text-slate-500">
                Delivery channels
              </Label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={emailChannel}
                    onCheckedChange={(c) => setEmailChannel(c === true)}
                    id="ch-email-skin"
                  />
                  <Label htmlFor="ch-email-skin" className="cursor-pointer text-sm">
                    Email
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={inAppChannel}
                    onCheckedChange={(c) => setInAppChannel(c === true)}
                    id="ch-inapp-skin"
                  />
                  <Label htmlFor="ch-inapp-skin" className="cursor-pointer text-sm">
                    In-app notification
                  </Label>
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={submitting || !validTarget}
              className="w-full h-12 text-base bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white font-semibold shadow-lg shadow-pink-500/20"
            >
              {submitting ? "Creating…" : "Set Price Alert"}
            </Button>
          </div>
        ) : (
        <div className="space-y-4">
          {!hasDefaultSkin && (
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as Alert['type'])}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="price_threshold">Price threshold</SelectItem>
                  <SelectItem value="volatility">Volatility spike</SelectItem>
                  <SelectItem value="float_tier">Float tier</SelectItem>
                  <SelectItem value="case_ev">Case-EV inversion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!hasDefaultSkin && type !== 'case_ev' && (
            <div>
              <Label>Skin ID</Label>
              <Input className="bg-slate-800 border-slate-700" type="number" value={skinId} onChange={e => setSkinId(e.target.value)} placeholder="e.g. 42" />
            </div>
          )}
          {type === 'case_ev' && (
            <div>
              <Label>Case ID</Label>
              <Input className="bg-slate-800 border-slate-700" type="number" value={caseId} onChange={e => setCaseId(e.target.value)} placeholder="e.g. 7" />
            </div>
          )}

          {type === 'price_threshold' && (
            <>
              <div>
                <Label>Direction</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as 'above' | 'below')}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price (€)</Label>
                <Input className="bg-slate-800 border-slate-700" type="number" value={price} onChange={e => setPrice(e.target.value)} step="0.01" />
              </div>
            </>
          )}

          {type === 'volatility' && (
            <div>
              <Label>Threshold % (24h)</Label>
              <Input className="bg-slate-800 border-slate-700" type="number" value={thresholdPercent} onChange={e => setThresholdPercent(e.target.value)} step="0.1" />
            </div>
          )}

          {type === 'float_tier' && (
            <>
              <div>
                <Label>Tier</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="FN">Factory New</SelectItem>
                    <SelectItem value="MW">Minimal Wear</SelectItem>
                    <SelectItem value="FT">Field-Tested</SelectItem>
                    <SelectItem value="WW">Well-Worn</SelectItem>
                    <SelectItem value="BS">Battle-Scarred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max price (€)</Label>
                <Input className="bg-slate-800 border-slate-700" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} step="0.01" />
              </div>
            </>
          )}

          {type === 'case_ev' && (
            <div>
              <Label>EV margin %</Label>
              <Input className="bg-slate-800 border-slate-700" type="number" value={evMarginPercent} onChange={e => setEvMarginPercent(e.target.value)} step="0.1" />
              <p className="text-xs text-slate-500 mt-1">Trigger when case price is at least this % below expected drop value.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Delivery channels</Label>
            <div className="flex items-center gap-2">
              <Checkbox checked={emailChannel} onCheckedChange={(c) => setEmailChannel(c === true)} id="ch-email" />
              <Label htmlFor="ch-email" className="cursor-pointer">Email</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={inAppChannel} onCheckedChange={(c) => setInAppChannel(c === true)} id="ch-inapp" />
              <Label htmlFor="ch-inapp" className="cursor-pointer">In-app notification</Label>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            {submitting ? 'Creating...' : 'Create alert'}
          </Button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
