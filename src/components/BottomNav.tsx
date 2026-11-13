import { useEffect, useRef } from 'react';
import { History, Mic, Settings2, Sparkles } from 'lucide-react';
import type { Route } from '../hooks/useHashRoute';
import { classNames } from '../lib/utils';

const ITEMS: { route: Route; label: string; icon: typeof Mic }[] = [
  { route: 'today', label: '今日', icon: Sparkles },
  { route: 'practice', label: '练习', icon: Mic },
  { route: 'history', label: '历史', icon: History },
  { route: 'settings', label: '设置', icon: Settings2 },
];

interface BottomNavProps {
  route: Route;
  navigate: (route: Route) => void;
}

export function BottomNav({ route, navigate }: BottomNavProps) {
  const navRef = useRef<HTMLElement | null>(null);

  // 把导航实际高度暴露给固定在它上方的输入栏
  useEffect(() => {
    const element = navRef.current;
    if (!element) return;
    const apply = () => {
      document.documentElement.style.setProperty('--nav-h', `${element.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-nav backdrop-blur-xl"
    >
      <div className="nav-safe mx-auto grid w-full max-w-[520px] grid-cols-4 px-2 pt-1.5">
        {ITEMS.map((item) => {
          const active = route === item.route;
          const Icon = item.icon;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              aria-current={active ? 'page' : undefined}
              className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 transition active:scale-95"
            >
              <span
                className={classNames(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                  active ? 'bg-brand-soft text-brand' : 'text-muted',
                )}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.3 : 2} />
              </span>
              <span
                className={classNames(
                  'text-[11px] leading-none',
                  active ? 'font-semibold text-brand' : 'text-muted',
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
