export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export const getMonthYearKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const formatAsBRL = (val: string): string => {
    if (!val) return '';
    const clean = val.replace(/\D/g, '');
    if (!clean) return '';
    const numberValue = parseInt(clean) / 100;
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue);
};

export const parseBRL = (val: string | number): number => {
    if (typeof val === 'number') return Math.abs(val);
    if (!val) return 0;
    // Remove tudo que não é número ou vírgula
    const clean = val.toString().replace(/[^\d]/g, '');
    const cents = parseInt(clean || '0');
    return Math.abs(cents / 100) || 0;
};

export const parseSafeDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day || 1);
};
