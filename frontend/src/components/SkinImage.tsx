"use client"

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SkinImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  onClick?: () => void;
  children?: React.ReactNode;
}

/**
 * SkinImage Component
 * 
 * A specialized image component for CS2 skins with beautiful gradient backgrounds
 * that match the skin's rarity and weapon type. Replaces boring gray backgrounds
 * with dynamic, colorful gradients.
 * 
 * Features:
 * - Dynamic gradient backgrounds based on rarity
 * - Weapon-specific color schemes
 * - Hover effects and animations
 * - Consistent styling across the app
 */

export default function SkinImage({
  src,
  alt,
  className,
  fill = false,
  sizes,
  priority = false,
  quality = 90,
  onClick,
  children,
  ...props
}: SkinImageProps) {
  // Extract rarity from alt text or skin name
  const getRarityFromAlt = (altText: string) => {
    const lowerAlt = altText.toLowerCase();
    if (lowerAlt.includes('covert')) return 'covert';
    if (lowerAlt.includes('classified')) return 'classified';
    if (lowerAlt.includes('restricted')) return 'restricted';
    if (lowerAlt.includes('mil-spec')) return 'mil-spec';
    if (lowerAlt.includes('consumer')) return 'consumer';
    return 'common';
  };

  // Extract weapon type from alt text
  const getWeaponTypeFromAlt = (altText: string) => {
    const lowerAlt = altText.toLowerCase();
    if (lowerAlt.includes('knife') || lowerAlt.includes('bayonet') || lowerAlt.includes('karambit') || lowerAlt.includes('m9') || lowerAlt.includes('flip') || lowerAlt.includes('gut') || lowerAlt.includes('huntsman') || lowerAlt.includes('falchion') || lowerAlt.includes('bowie') || lowerAlt.includes('butterfly') || lowerAlt.includes('shadow') || lowerAlt.includes('ursus') || lowerAlt.includes('navaja') || lowerAlt.includes('stiletto') || lowerAlt.includes('talon') || lowerAlt.includes('classic') || lowerAlt.includes('paracord') || lowerAlt.includes('survival') || lowerAlt.includes('nomad') || lowerAlt.includes('skeleton')) return 'knife';
    if (lowerAlt.includes('ak-47') || lowerAlt.includes('m4a4') || lowerAlt.includes('m4a1') || lowerAlt.includes('awp') || lowerAlt.includes('ak47')) return 'rifle';
    if (lowerAlt.includes('glock') || lowerAlt.includes('usp') || lowerAlt.includes('p250') || lowerAlt.includes('tec-9') || lowerAlt.includes('five-seven') || lowerAlt.includes('cz75') || lowerAlt.includes('p2000') || lowerAlt.includes('dual') || lowerAlt.includes('r8') || lowerAlt.includes('deagle') || lowerAlt.includes('p250')) return 'pistol';
    if (lowerAlt.includes('awp') || lowerAlt.includes('ssg') || lowerAlt.includes('scar-20') || lowerAlt.includes('g3sg1')) return 'sniper';
    if (lowerAlt.includes('mac-10') || lowerAlt.includes('mp9') || lowerAlt.includes('mp7') || lowerAlt.includes('ump') || lowerAlt.includes('p90') || lowerAlt.includes('pp-bizon') || lowerAlt.includes('mp5')) return 'smg';
    if (lowerAlt.includes('nova') || lowerAlt.includes('xm1014') || lowerAlt.includes('sawed-off') || lowerAlt.includes('mag-7')) return 'shotgun';
    if (lowerAlt.includes('m249') || lowerAlt.includes('negev')) return 'machinegun';
    return 'weapon';
  };

  const rarity = getRarityFromAlt(alt);
  const weaponType = getWeaponTypeFromAlt(alt);

  // Define gradient backgrounds based on rarity and weapon type
  const getGradientBackground = () => {
    const baseGradients = {
      covert: 'from-red-500/20 via-red-400/10 to-red-600/20',
      classified: 'from-purple-500/20 via-purple-400/10 to-purple-600/20',
      restricted: 'from-pink-500/20 via-pink-400/10 to-pink-600/20',
      'mil-spec': 'from-blue-500/20 via-blue-400/10 to-blue-600/20',
      consumer: 'from-gray-500/20 via-gray-400/10 to-gray-600/20',
      common: 'from-gray-400/20 via-gray-300/10 to-gray-500/20'
    };

    const weaponAccents = {
      knife: 'via-yellow-400/15 to-orange-500/20',
      rifle: 'via-green-400/15 to-emerald-500/20',
      pistol: 'via-blue-400/15 to-cyan-500/20',
      sniper: 'via-purple-400/15 to-violet-500/20',
      smg: 'via-orange-400/15 to-red-500/20',
      shotgun: 'via-indigo-400/15 to-blue-500/20',
      machinegun: 'via-red-400/15 to-pink-500/20',
      weapon: 'via-gray-400/15 to-slate-500/20'
    };

    const baseGradient = baseGradients[rarity as keyof typeof baseGradients] || baseGradients.common;
    const weaponAccent = weaponAccents[weaponType as keyof typeof weaponAccents] || weaponAccents.weapon;

    return `bg-gradient-to-br ${baseGradient} ${weaponAccent}`;
  };

  const gradientBackground = getGradientBackground();

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-lg group',
        gradientBackground,
        'hover:shadow-xl transition-all duration-300',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]" />
      </div>

      {/* Main image */}
      <div className="relative z-10">
        <Image
          src={src}
          alt={alt}
          fill={fill}
          sizes={sizes}
          priority={priority}
          quality={quality}
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Overlay content (badges, etc.) */}
      {children && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {children}
        </div>
      )}

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
