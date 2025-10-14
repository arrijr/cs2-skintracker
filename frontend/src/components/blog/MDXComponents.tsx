// frontend/src/components/blog/MDXComponents.tsx
import { SkinCard } from './SkinCard';
import { Callout } from './Callout';

const MDXComponents = {
  // Custom components
  SkinCard,
  Callout,
  
  // Override default HTML elements with custom styling
  h1: (props: any) => (
    <h1 className="text-3xl font-bold text-foreground mt-8 mb-4" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="text-xl font-semibold text-foreground mt-5 mb-2" {...props} />
  ),
  h4: (props: any) => (
    <h4 className="text-lg font-semibold text-foreground mt-4 mb-2" {...props} />
  ),
  p: (props: any) => (
    <p className="text-foreground mb-4 leading-relaxed" {...props} />
  ),
  a: (props: any) => (
    <a 
      className="text-brand-celadon hover:text-brand-celadon-dark underline" 
      {...props} 
    />
  ),
  ul: (props: any) => (
    <ul className="list-disc list-inside text-foreground mb-4 space-y-2" {...props} />
  ),
  ol: (props: any) => (
    <ol className="list-decimal list-inside text-foreground mb-4 space-y-2" {...props} />
  ),
  li: (props: any) => (
    <li className="text-foreground" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote 
      className="border-l-4 border-brand-celadon pl-4 italic text-muted-foreground my-4" 
      {...props} 
    />
  ),
  code: (props: any) => (
    <code 
      className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground" 
      {...props} 
    />
  ),
  pre: (props: any) => (
    <pre 
      className="bg-muted p-4 rounded-lg overflow-x-auto my-4" 
      {...props} 
    />
  ),
  img: (props: any) => (
    <img 
      className="rounded-lg my-4 max-w-full h-auto" 
      {...props} 
    />
  ),
  table: (props: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-border rounded-lg" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th 
      className="border border-border px-4 py-2 bg-muted text-left font-semibold text-foreground" 
      {...props} 
    />
  ),
  td: (props: any) => (
    <td 
      className="border border-border px-4 py-2 text-foreground" 
      {...props} 
    />
  ),
};

export default MDXComponents;
