// /frontend/src/components/Logo.tsx — [Frontend]
// {/* Custom Logo Component */}
"use client";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ 
  className = "", 
  showText = true, 
  size = 'md' 
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <Link href="/" className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Image with Fallback */}
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        <div className="w-full h-full bg-gradient-to-br from-brand-green to-brand-blue rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">CS</span>
        </div>
        {/* TODO: Replace with actual logo image when available */}
        {/* 
        <Image
          src="/logo.png"
          alt="SKINTRACKR Logo"
          width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          className="w-full h-full object-contain"
          priority
        />
        */}
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`font-bold text-white ${textSizeClasses[size]}`}>
          SKIN<span className="text-brand-green">TRACKR</span>
        </span>
      )}
    </Link>
  );
}
