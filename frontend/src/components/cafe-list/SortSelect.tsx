// ============================================
// SipSpot — SortSelect (Radix Select)
// ============================================
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@components/ui/select';

interface Option {
    value: string;
    label: string;
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    options: readonly Option[];
}

export default function SortSelect({ value, onChange, options }: Props) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="border border-stone-200 bg-white text-stone-700 rounded-xl px-3 py-2 w-44" style={{ fontSize: '0.83rem' }}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} style={{ fontSize: '0.83rem' }}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
