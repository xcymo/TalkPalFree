import { useEffect, useRef } from 'react';

/**
 * 置顶栏随页面下滚逐渐从两侧留白过渡到通栏：
 * scrollY 为 0 时两侧各留 16px，滚动到 threshold 后占满整个容器宽度。
 * 直接改 DOM style，避免滚动时触发整页重渲染。
 */
export function useStickyBleed<T extends HTMLElement>(threshold = 100) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;
      const progress = Math.min(1, Math.max(0, window.scrollY / threshold));
      const padding = 16 * (1 - progress);
      element.style.paddingLeft = `${padding}px`;
      element.style.paddingRight = `${padding}px`;
      // 宽度铺满的同时把圆角收掉，避免四个角露出底色
      element.style.setProperty('--sticky-radius', `${padding}px`);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return ref;
}
