// /frontend/src/components/ColorPaletteDemo.tsx — [Frontend]
// {/* Color Palette Demo Component for Testing New Design System */}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ColorPaletteDemo() {
  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">CS2 Skin Tracker - New Color Palette</h1>
        <p className="text-muted-foreground">Testing the unified design system with your custom palette</p>
      </div>

      {/* Primary Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Primary Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-lg bg-brand-celadon-400 mb-2"></div>
              <p className="text-sm font-medium">Celadon</p>
              <p className="text-xs text-muted-foreground">#A1E8AF</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-lg bg-brand-celadon-500 mb-2"></div>
              <p className="text-sm font-medium">Celadon Dark</p>
              <p className="text-xs text-muted-foreground">#94C595</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-lg bg-brand-slate-500 mb-2"></div>
              <p className="text-sm font-medium">Slate Gray</p>
              <p className="text-xs text-muted-foreground">#747C92</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-lg bg-brand-midnight mb-2"></div>
              <p className="text-sm font-medium">Midnight Blue</p>
              <p className="text-xs text-muted-foreground">#372772</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-lg bg-brand-purple-500 mb-2"></div>
              <p className="text-sm font-medium">Dark Purple</p>
              <p className="text-xs text-muted-foreground">#3A2449</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Celadon Shades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Celadon Shades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
              <div key={shade} className="text-center">
                <div className={`w-12 h-12 mx-auto rounded bg-brand-celadon-${shade} mb-1`}></div>
                <p className="text-xs">{shade}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Button Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-brand-celadon-500 hover:bg-brand-celadon-600 text-white">
              Primary
            </Button>
            <Button variant="secondary" className="bg-brand-slate-700 hover:bg-brand-slate-600 text-white">
              Secondary
            </Button>
            <Button variant="outline" className="border-brand-slate-500/50 text-brand-slate-300 hover:bg-brand-slate-700/50">
              Outline
            </Button>
            <Button variant="ghost" className="text-brand-slate-400 hover:text-white hover:bg-brand-slate-800">
              Ghost
            </Button>
            <Button className="bg-brand-celadon-500 hover:bg-brand-celadon-600 text-white">
              Success
            </Button>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
              Warning
            </Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white">
              Danger
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Badge Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Badge Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Badge className="border-brand-slate-500/30 text-brand-slate-300 bg-brand-slate-500/10">
              Default
            </Badge>
            <Badge className="border-brand-celadon-500/30 text-brand-celadon-400 bg-brand-celadon-500/10">
              Active
            </Badge>
            <Badge className="border-brand-celadon-500/30 text-brand-celadon-400 bg-brand-celadon-500/10">
              Success
            </Badge>
            <Badge className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
              Warning
            </Badge>
            <Badge className="border-red-500/30 text-red-400 bg-red-500/10">
              Error
            </Badge>
            <Badge className="border-brand-slate-500/30 text-brand-slate-400 bg-brand-slate-500/10">
              Info
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Rarity Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Rarity Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Badge className="text-red-500 bg-red-500/10 border-red-500/30">
              Covert
            </Badge>
            <Badge className="text-pink-500 bg-pink-500/10 border-pink-500/30">
              Classified
            </Badge>
            <Badge className="text-brand-purple-600 bg-brand-purple-600/10 border-brand-purple-600/30">
              Restricted
            </Badge>
            <Badge className="text-brand-slate-500 bg-brand-slate-500/10 border-brand-slate-500/30">
              Mil-Spec
            </Badge>
            <Badge className="text-cyan-500 bg-cyan-500/10 border-cyan-500/30">
              Industrial
            </Badge>
            <Badge className="text-brand-slate-400 bg-brand-slate-400/10 border-brand-slate-400/30">
              Consumer
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Wear Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Wear Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Badge className="text-brand-celadon-500 bg-brand-celadon-500/10 border-brand-celadon-500/30">
              Factory New
            </Badge>
            <Badge className="text-brand-celadon-400 bg-brand-celadon-400/10 border-brand-celadon-400/30">
              Minimal Wear
            </Badge>
            <Badge className="text-yellow-500 bg-yellow-500/10 border-yellow-500/30">
              Field-Tested
            </Badge>
            <Badge className="text-orange-500 bg-orange-500/10 border-orange-500/30">
              Well-Worn
            </Badge>
            <Badge className="text-red-500 bg-red-500/10 border-red-500/30">
              Battle-Scarred
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Price Change Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Price Change Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <span className="text-brand-celadon-500 font-medium">+$15.50 (+5.2%)</span>
            <span className="text-red-500 font-medium">-$8.30 (-2.1%)</span>
            <span className="text-brand-slate-400 font-medium">$0.00 (0.0%)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
