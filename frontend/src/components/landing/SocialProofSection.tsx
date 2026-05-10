import { Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

const testimonials: Testimonial[] = [
  // Empty for now — fill after launch
];

export default function SocialProofSection() {
  if (testimonials.length === 0) {
    return (
      <section className="py-16 bg-slate-900/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400">
            Join the early users tracking{" "}
            <span className="text-white font-semibold">over 10,000 skins</span> on skintrackr.com
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-slate-950">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-4xl font-bold text-white text-center mb-12">What traders say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.author} className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-lg p-6">
              <Quote className="h-8 w-8 text-purple-400 mb-4" />
              <p className="text-slate-300 mb-4">{t.quote}</p>
              <p className="text-white font-semibold">{t.author}</p>
              <p className="text-slate-400 text-sm">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
