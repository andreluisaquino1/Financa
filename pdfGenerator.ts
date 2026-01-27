
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CoupleInfo, MonthlySummary, Expense, ExpenseType } from './types';
import { formatCurrency } from './utils';

export const exportMonthlyPDF = (
    monthKey: string,
    coupleInfo: CoupleInfo,
    summary: MonthlySummary,
    expenses: Expense[]
) => {
    const doc = new jsPDF();
    const [year, month] = monthKey.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Header Visual
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Mensal de Finanças', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${monthName.toUpperCase()}`, 15, 30);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 15, 35);

    // Summary Table
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 15, 55);

    autoTable(doc, {
        startY: 60,
        head: [['Descrição', 'Valor']],
        body: [
            ['Total Gastos Fixos', formatCurrency(summary.totalFixed)],
            ['Total Gastos Proporcionais', formatCurrency(summary.totalCommon)],
            ['Total Gastos 50/50', formatCurrency(summary.totalEqual)],
            ['Total Reembolsos', formatCurrency(summary.totalReimbursement)],
            ['', ''],
            [`Responsabilidade ${coupleInfo.person1Name}`, formatCurrency(summary.person1Responsibility)],
            [`Responsabilidade ${coupleInfo.person2Name}`, formatCurrency(summary.person2Responsibility)],
            ['', ''],
            ['ACERTO FINAL', summary.whoTransfers === 'none' ? 'Contas Equilibradas' : `${summary.whoTransfers === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name} transfere ${formatCurrency(summary.transferAmount)}`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }, // Blue 600
        styles: { fontSize: 10 }
    });

    // Category Table
    const lastY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Gastos por Categoria', 15, lastY);

    const categoryData = Object.entries(summary.categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, val]) => [cat, formatCurrency(val)]);

    autoTable(doc, {
        startY: lastY + 5,
        head: [['Categoria', 'Total']],
        body: categoryData,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] }
    });

    // Full Expenses Table (New Page if needed)
    doc.addPage();
    doc.text('Detalhamento de Transações', 15, 20);

    const expenseData = expenses
        .filter(e => e.date.startsWith(monthKey))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(e => [
            new Date(e.date).toLocaleDateString('pt-BR'),
            e.description,
            e.category,
            e.type === ExpenseType.FIXED ? 'Fixo' : e.type === ExpenseType.COMMON ? 'Prop.' : e.type === ExpenseType.EQUAL ? '50/50' : 'Reemb.',
            e.paidBy === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name,
            formatCurrency(e.totalValue)
        ]);

    autoTable(doc, {
        startY: 25,
        head: [['Data', 'Descrição', 'Cat.', 'Tipo', 'Pago por', 'Valor']],
        body: expenseData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 85, 105] }
    });

    doc.save(`Finanças_${monthKey}_${coupleInfo.person1Name}_${coupleInfo.person2Name}.pdf`);
};
