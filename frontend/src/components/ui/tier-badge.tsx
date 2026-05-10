"use client";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Zap } from "lucide-react";
import { tokens } from "@/lib/design-tokens";

interface TierBadgeProps {
  tier: 'free' | 'lite' | 'pro';
  showIcon?: boolean;
}

export function TierBadge({ tier, showIcon = true }: TierBadgeProps) {
  const config = {
    free: { label: 'Free', icon: Sparkles, className: tokens.badge.free },
    lite: { label: 'Lite', icon: Zap, className: tokens.badge.lite },
    pro: { label: 'Pro', icon: Crown, className: tokens.badge.pro },
  };
  const { label, icon: Icon, className } = config[tier];
  return (
    <Badge className={`${className} px-3 py-1 gap-1`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}
