import { useState, useEffect } from 'react';
import { setToastFn } from '../utils/toast';

export function Toast() {
  const [toasts, setToasts] = useState([]);
  
  useEffect(() => {
    setToastFn((msg, type = 'success') => {
      const id = Date.now();
      setToasts(p => [...p, { id, msg, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    });
  }, []);
  
  return (
    <div className="toast-wrap">
      {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
    </div>
  );
}