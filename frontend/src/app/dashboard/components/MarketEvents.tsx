// /frontend/src/app/dashboard/components/MarketEvents.tsx — [Frontend]
// {/* Market Events - CS2 Updates, Operations, Tournaments */}
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  ExternalLink, 
  RefreshCw,
  Gamepad2,
  Trophy,
  Zap
} from "lucide-react";

interface MarketEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'update' | 'operation' | 'tournament';
  impact: 'high' | 'medium' | 'low';
  url?: string;
}

interface MarketEventsProps {
  lastUpdated?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Mock events data - replace with real API
const getEventsData = (): MarketEvent[] => [
  {
    id: '1',
    date: '2024-09-20',
    title: 'CS2 Major Update 1.2.1',
    description: 'New weapon skins, map updates, and performance improvements',
    type: 'update',
    impact: 'high',
    url: 'https://counter-strike.net/news'
  },
  {
    id: '2', 
    date: '2024-09-15',
    title: 'Operation Shattered Web 2',
    description: 'New operation with exclusive cases and missions',
    type: 'operation',
    impact: 'high',
    url: 'https://counter-strike.net/operations'
  },
  {
    id: '3',
    date: '2024-09-10',
    title: 'IEM Cologne 2024',
    description: 'Major tournament affecting skin prices and market activity',
    type: 'tournament',
    impact: 'medium',
    url: 'https://liquipedia.net/counterstrike/IEM_Cologne/2024'
  }
];

const getEventIcon = (type: MarketEvent['type']) => {
  switch (type) {
    case 'update': return <Zap className="h-4 w-4" />;
    case 'operation': return <Gamepad2 className="h-4 w-4" />;
    case 'tournament': return <Trophy className="h-4 w-4" />;
    default: return <Calendar className="h-4 w-4" />;
  }
};

const getEventColor = (type: MarketEvent['type']) => {
  switch (type) {
    case 'update': return 'text-blue-400';
    case 'operation': return 'text-purple-400';
    case 'tournament': return 'text-yellow-400';
    default: return 'text-muted-foreground';
  }
};

const getImpactColor = (impact: MarketEvent['impact']) => {
  switch (impact) {
    case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return 'bg-muted/20 text-muted-foreground border-muted/30';
  }
};

export default function MarketEvents({ 
  lastUpdated, 
  onRefresh, 
  isLoading = false 
}: MarketEventsProps) {
  const events = getEventsData();

  if (isLoading) {
    return (
      <Card className="card-brand">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-blue" />
              Market Events
            </CardTitle>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-brand card-enhanced hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-blue" />
              Market Events
            </CardTitle>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all duration-200 hover-scale">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-0.5 ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{event.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getImpactColor(event.impact)}`}
                        >
                          {event.impact}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {event.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <a 
                        href={event.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground space-y-3">
            <div className="space-y-2">
              <Calendar className="h-10 w-10 mx-auto opacity-50" />
              <h4 className="font-medium">No Recent Events</h4>
              <p className="text-sm max-w-xs">
                Market events and updates will appear here when available.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
