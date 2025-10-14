// frontend/src/components/blog/TableOfContents.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from the page
    const headings = Array.from(document.querySelectorAll('h2, h3, h4')).map(
      (heading) => ({
        id: heading.id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1)),
      })
    );

    setToc(headings);

    // Set up intersection observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -80% 0%' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  if (toc.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-4">Table of Contents</h3>
      <nav className="space-y-2">
        {toc.map((item) => (
          <Link
            key={item.id}
            href={`#${item.id}`}
            className={`block text-sm transition-colors ${
              item.level === 2
                ? 'pl-0'
                : item.level === 3
                ? 'pl-4'
                : 'pl-8'
            } ${
              activeId === item.id
                ? 'text-brand-celadon font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.text}
          </Link>
        ))}
      </nav>
    </div>
  );
}
