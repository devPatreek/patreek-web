'use client';

import { useEffect } from 'react';

const MULTITAG_SRC = 'https://fpyf8.com/88/tag.min.js';
const MULTITAG_ZONE = '185398';

let scriptAttached = false;

export default function MonetagMultiTag() {
  useEffect(() => {
    if (scriptAttached) {
      return;
    }

    const script = document.createElement('script');
    script.src = MULTITAG_SRC;
    script.dataset.zone = MULTITAG_ZONE;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    document.body.appendChild(script);
    scriptAttached = true;

    return () => {
      if (scriptAttached && script.parentNode) {
        script.parentNode.removeChild(script);
        scriptAttached = false;
      }
    };
  }, []);

  return null;
}
