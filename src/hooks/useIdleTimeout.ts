import { useEffect, useRef } from 'react';

export function useIdleTimeout(onIdle: () => void, idleTimeInMinutes: number = 15) {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    const resetTimeout = () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      timeoutId.current = setTimeout(() => {
        onIdleRef.current();
      }, idleTimeInMinutes * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    // Initialize timeout
    resetTimeout();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [idleTimeInMinutes]);
}
