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
    sm: 'h-24 w-24',
    md: 'h-28 w-28',
    lg: 'h-32 w-32'
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
          width={size === 'sm' ? 96 : size === 'md' ? 112 : 128}
          height={size === 'sm' ? 96 : size === 'md' ? 112 : 128}
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
