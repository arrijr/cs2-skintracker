"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, Trash2, Mail, MessageSquare } from "lucide-react";
import { Alert } from "@/hooks/useAlerts";

const TYPE_LABELS: Record<Alert['type'], string> = {
  price_threshold: 'Price Threshold',
  volatility: 'Volatility Spike',
  float_tier: 'Float Tier',
  case_ev: 'Case-EV Inversion',
};

const TYPE_COLORS: Record<Alert['type'], string> = {
  price_threshold: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  volatility: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  float_tier: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  case_ev: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
};

interface AlertCardProps {
  alert: Alert;
  onToggle: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}

export function AlertCard({ alert, onToggle, onDelete }: AlertCardProps) {
  const target = alert.skin?.name || alert.case?.name || 'Portfolio';
  return (
    <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 hover:border-slate-600/60 transition-colors rounded-2xl">
      <CardContent className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={TYPE_COLORS[alert.type]}>
                {TYPE_LABELS[alert.type]}
              </Badge>
              <span className="text-white font-medium truncate">{target}</span>
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {summarizeConfig(alert)}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
              {alert.channels.includes('email') && (
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> email</span>
              )}
              {alert.channels.includes('discord') && (
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Discord</span>
              )}
              {alert.lastTriggeredAt && (
                <span>last fired {new Date(alert.lastTriggeredAt).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Switch
            checked={alert.isActive}
            onCheckedChange={(checked) => onToggle(alert.id, checked)}
            aria-label={`Toggle alert ${alert.id}`}
          />
          <Button variant="ghost" size="sm" onClick={() => onDelete(alert.id)} aria-label="Delete alert" className="text-red-400 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function summarizeConfig(alert: Alert): string {
  switch (alert.type) {
    case 'price_threshold':
      return `Trigger when price ${alert.config.direction} €${alert.config.price}`;
    case 'volatility':
      return `Trigger when ${alert.config.windowHours ?? 24}h change ≥ ${alert.config.thresholdPercent}%`;
    case 'float_tier':
      return `Trigger when ${alert.config.tier} float listed below €${alert.config.maxPrice}`;
    case 'case_ev':
      return `Trigger when case price ≥ ${alert.config.evMarginPercent}% below EV`;
    default:
      return '';
  }
}
