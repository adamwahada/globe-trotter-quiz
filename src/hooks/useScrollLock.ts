import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;

function applyScrollLock() {
  lockCount += 1;
  if (lockCount > 1) return;

  savedScrollY = window.scrollY;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.documentElement.dataset.scrollLock = 'true';
  document.body.dataset.scrollLock = 'true';
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';

  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function releaseScrollLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  delete document.documentElement.dataset.scrollLock;
  delete document.body.dataset.scrollLock;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.paddingRight = '';

  window.scrollTo(0, savedScrollY);
}

/** Locks page scroll while a modal/overlay is open. Supports nested modals via ref counting. */
export function useScrollLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    applyScrollLock();
    return () => releaseScrollLock();
  }, [enabled]);
}
