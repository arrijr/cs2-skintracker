// frontend/src/components/blog/BlogHero.tsx
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function BlogHero() {
  return (
    <div className="bg-gradient-to-br from-brand-celadon-950 via-brand-celadon-900 to-brand-night-950 text-white py-16 px-4 rounded-lg mb-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-brand-celadon-300">
          CS2 Skin Tracker Blog
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8">
          Market insights, investment guides, and the latest CS2 skin trading strategies
        </p>
        
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="search"
              placeholder="Search articles..."
              className="pl-12 py-6 text-lg bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {['Market Analysis', 'Investment Guides', 'Updates', 'Case Statistics'].map((category) => (
            <a
              key={category}
              href={`/blog?category=${encodeURIComponent(category)}`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
            >
              {category}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
