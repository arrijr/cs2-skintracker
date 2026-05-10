"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { Alert } from "@/hooks/useAlerts";

interface CreateAlertModalProps {
  onCreate: (data: Partial<Alert>) => Promise<void>;
}

export function CreateAlertModal({ onCreate }: CreateAlertModalProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Alert['type']>('price_threshold');
  const [skinId, setSkinId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [emailChannel, setEmailChannel] = useState(true);
  const [discordChannel, setDiscordChannel] = useState(false);
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [price, setPrice] = useState('');
  const [thresholdPercent, setThresholdPercent] = useState('5');
  const [tier, setTier] = useState('FN');
  const [maxPrice, setMaxPrice] = useState('');
  const [evMarginPercent, setEvMarginPercent] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setType('price_threshold');
    setSkinId('');
    setCaseId('');
    setEmailChannel(true);
    setDiscordChannel(false);
    setDirection('above');
    setPrice('');
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
      if (discordChannel) channels.push('discord');
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
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          New alert
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create alert</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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

          {type !== 'case_ev' && (
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
              <Checkbox checked={discordChannel} onCheckedChange={(c) => setDiscordChannel(c === true)} id="ch-discord" />
              <Label htmlFor="ch-discord" className="cursor-pointer">Discord</Label>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            {submitting ? 'Creating...' : 'Create alert'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
