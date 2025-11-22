'use client';

import { useEffect, useRef } from 'react';

type AdsterraVariant = 'iframe300x250' | 'native';

type Props = {
  variant: AdsterraVariant;
  className?: string;
};

export default function AdsterraSlot({ variant, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double injection on re-renders
    if (containerRef.current.dataset.adInjected === 'true') {
      return;
    }

    containerRef.current.dataset.adInjected = 'true';

    if (variant === 'iframe300x250') {
      // Adsterra 300x250 iframe banner
      (window as any).atOptions = {
        key: '7ac921c83230b7bec27cd77e5976bdfa',
        format: 'iframe',
        height: 250,
        width: 300,
        params: {},
      };
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://www.highperformanceformat.com/7ac921c83230b7bec27cd77e5976bdfa/invoke.js';
      script.async = true;
      containerRef.current.appendChild(script);

      return () => {
        containerRef.current?.replaceChildren();
        delete (window as any).atOptions;
      };
    }

    if (variant === 'native') {
      // Adsterra native widget
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl28102082.effectivegatecpm.com/e43b9924b35e5d713560143434db77a3/invoke.js';
      containerRef.current.appendChild(script);

      return () => {
        containerRef.current?.replaceChildren();
      };
    }
  }, [variant]);

  return (
    <div
      className={className}
      style={{
        width: variant === 'iframe300x250' ? 300 : '100%',
        minHeight: variant === 'iframe300x250' ? 250 : 0,
      }}
    >
      <div
        id={variant === 'native' ? 'container-e43b9924b35e5d713560143434db77a3' : undefined}
        ref={containerRef}
        style={{ width: '100%', minHeight: variant === 'iframe300x250' ? 250 : 0 }}
      />
    </div>
  );
}
