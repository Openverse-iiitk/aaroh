import React, { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { HelpCircle, Search, ChevronDown, ChevronUp, FileQuestion, ArrowRight } from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'general' | 'participation';
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'what-is-hackaaroh',
    category: 'general',
    question: 'What is HackAaroh?',
    answer:
      'HackAaroh is an open-source event organised by Openverse. It is a chance to contribute to real projects, collaborate with other builders, and learn along the way.',
  },
  {
    id: 'who-organises',
    category: 'general',
    question: 'Who is organising it?',
    answer: 'Aaroh is organised by Openverse, a community of developers who love open source.',
  },
  {
    id: 'who-can-join',
    category: 'participation',
    question: 'Who can participate?',
    answer:
      'The event is open to everyone, from first-time contributors to experienced open-source developers.',
  },
];

export const FaqPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ 'what-is-hackaaroh': true });

  const toggleItem = (id: string) => setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQ_DATA.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesQuery =
        !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'general', label: 'General' },
    { id: 'participation', label: 'Participation' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge Base</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          Everything you need to know about HackAaroh.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0e0a22] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
              activeCategory === c.id
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-[#0e0a22] border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-10 rounded-xl border border-white/10 bg-[#0a0815]/70 text-center space-y-2">
            <FileQuestion className="w-6 h-6 text-zinc-500 mx-auto" />
            <p className="text-sm text-zinc-400">No questions match your search.</p>
          </div>
        ) : (
          filteredFaqs.map((item) => {
            const open = !!openItems[item.id];
            return (
              <div key={item.id} className="rounded-card border border-white/10 bg-[#060317] hover:border-indigo-500/30 transition-colors overflow-hidden">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="text-sm sm:text-base font-semibold text-white">{item.question}</span>
                  {open ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>
                {open && (
                  <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{item.answer}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="text-center pt-4">
        <Link to="/about" className="btn-secondary !text-xs !px-4 !py-2">
          <span>Learn more about the event</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
