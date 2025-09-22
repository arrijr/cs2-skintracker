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
  showText = false,
  size = 'md'
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <Link href="/" className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Image */}
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        <Image
          src="/logo.png"
          alt="SKINTRACKR Logo"
          width={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
          height={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {/* Logo Text - Only show if explicitly requested */}
      {showText && (
        <span className={`font-bold text-white ${textSizeClasses[size]}`}>
          SKIN<span className="text-brand-green">TRACKR</span>
        </span>
      )}
    </Link>
  );
}
