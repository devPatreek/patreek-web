'use client';

import { useEffect, useId } from 'react';

type MonetagSlotProps = {
  zoneId: string;
  className?: string;
  label?: string;
};

const SCRIPT_SRC = 'https://gizokraijaw.net/vignette.min.js';

export default function MonetagSlot({ zoneId, className, label }: MonetagSlotProps) {
  const slotId = useId();

  useEffect(() => {
    const parent = document.body || document.documentElement;
    if (!parent) {
      return;
    }

    const script = document.createElement('script');
    script.dataset.zone = zoneId;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    parent.appendChild(script);

    return () => {
      parent.removeChild(script);
    };
  }, [zoneId]);

  return <div className={className} aria-label={label ?? 'Advertisement'} id={slotId} />;
}
