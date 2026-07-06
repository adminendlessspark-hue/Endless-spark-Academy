import React from 'react';
import DemoOnePager from './DemoOnePager';

export default function AdminDemoCenter() {
  return (
    <div className="min-h-screen bg-slate-50">
      <DemoOnePager isAdminMode={true} />
    </div>
  );
}
