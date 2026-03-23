// ============================================
// SipSpot — FilterSection
// Collapsible section wrapper for filter panels
// ============================================

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterSectionProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export default function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-stone-100 py-4">
            <button
                onClick={() => setOpen(prev => !prev)}
                className="flex items-center justify-between w-full text-left"
            >
                <span className="text-stone-700" style={{ fontSize: '0.83rem', fontWeight: 600 }}>{title}</span>
                <ChevronDown
                    className={`w-4 h-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && <div>{children}</div>}
        </div>
    );
}
