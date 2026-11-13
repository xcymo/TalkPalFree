import { useEffect, useRef } from 'react';
import { History, Lightbulb, Settings2, Speech, type LucideIcon } from 'lucide-react';
import type { Route } from '../hooks/useHashRoute';
import { classNames } from '../lib/utils';

const ITEMS: { route: Route; label: string; icon: LucideIcon }[] = [
  { route: 'today', label: '今日', icon: Lightbulb },
  { route: 'practice', label: '练习', icon: Speech },
  { route: 'history', label: '历史', icon: History },
  { route: 'settings', label: '设置', icon: Settings2 },
];

interface BottomNavProps {
  route: Route;
  navigate: (route: Route) => void;
}

export function BottomNav({ route, navigate }: BottomNavProps) {
  const navRef = useRef<HTMLElement | null>(null);
  const activeIndex = Math.max(
    0,
    ITEMS.findIndex((item) => item.route === route),
  );

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
      <div className="nav-safe mx-auto w-full max-w-[520px] px-2 pt-1.5">
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1 grid grid-cols-4"
          >
            <div
              className="col-start-1 row-start-1 flex h-7 items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            >
              <span key={route} className="h-7 w-12 rounded-full bg-brand-soft animate-tab-shuttle" />
            </div>
          </div>

          <div className="grid grid-cols-4">
            {ITEMS.map((item) => {
              const active = route === item.route;
              const Icon = item.icon;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => navigate(item.route)}
                  aria-current={active ? 'page' : undefined}
                  className="relative z-10 flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 transition active:scale-95"
                >
                  <span
                    className={classNames(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-300',
                      active ? 'text-brand' : 'text-muted',
                    )}
                  >
                    <Icon
                      className={classNames(
                        'size-[18px] transition-transform duration-300',
                        active ? 'scale-105' : 'scale-100',
                      )}
                      strokeWidth={active ? 2.3 : 2}
                    />
                  </span>
                  <span
                    className={classNames(
                      'text-[11px] leading-none transition-colors duration-300',
                      active ? 'font-semibold text-brand' : 'text-muted',
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
