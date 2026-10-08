import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import { GitPullRequest, Info, HelpCircle } from 'lucide-react';
import { ReflectBlackHole } from './components/ReflectBlackHole';
import { ScrollToBottomButton } from './components/ScrollToBottomButton';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { FaqPage } from './pages/FaqPage';

function Header() {
  const path = useLocation().pathname;
  const linkClass = (to: string) =>
    `transition-colors flex items-center gap-1.5 ${
      path === to ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-indigo-500/15 bg-[#0a0815]/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/20 shadow-[0_0_14px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform">
            <GitPullRequest className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">HackAaroh</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link to="/about" className={linkClass('/about')}>
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>About</span>
          </Link>
          <Link to="/faq" className={linkClass('/faq')}>
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>FAQ</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col bg-[#06040d] text-[#f5f3ff]">
      <ReflectBlackHole />
      <ScrollToBottomButton />
      <div className="w-full bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-indigo-950/80 border-b border-indigo-500/20 text-xs py-2 px-4 backdrop-blur-md relative z-50 text-center">
        <span className="inline-flex items-center justify-center bg-black/40 px-4 h-6 pt-px leading-none rounded-full border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)] text-[11px] text-zinc-200 font-medium tracking-wide">
          More updates will reach you soon
        </span>
      </div>
      <Header />
      <main className="relative z-10 flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="relative z-20 w-full py-6 border-t border-white/15 text-xs text-zinc-300 bg-white/[0.06] backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_-8px_32px_rgba(0,0,0,0.25)]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© Openverse · HackAaroh</span>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage });
const faqRoute = createRoute({ getParentRoute: () => rootRoute, path: '/faq', component: FaqPage });

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, aboutRoute, faqRoute]),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
