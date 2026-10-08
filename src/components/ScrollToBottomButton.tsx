import React, { useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';

export const ScrollToBottomButton: React.FC = () => {
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const update = () => {
      const { scrollY, innerHeight } = window;
      const full = document.documentElement.scrollHeight;
      setAtBottom(scrollY + innerHeight >= full - 40);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to bottom"
      onClick={() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
      }
      className={`fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl backdrop-saturate-150 border border-white/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_24px_rgba(0,0,0,0.35)] scroll-btn hover:bg-white/20 hover:scale-110 hover:-translate-y-1 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_28px_rgba(139,92,246,0.55)] active:scale-95 transition-all duration-300 ${
        atBottom ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100'
      }`}
    >
      <ArrowDown className="w-4 h-4" />
    </button>
  );
};
