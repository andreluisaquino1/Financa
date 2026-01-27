
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CoupleInfo, MonthlySummary, Expense, ExpenseType } from './types';
import { formatCurrency, isExpenseInMonth, getMonthlyExpenseValue, getInstallmentInfo } from './utils';

export const exportMonthlyPDF = (
    monthKey: string,
    coupleInfo: CoupleInfo,
    summary: MonthlySummary,
    expenses: Expense[]
) => {
    const doc = new jsPDF();
    const [year, month] = monthKey.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Primary Colors
    const primaryBlue = [37, 99, 235]; // #2563eb
    const primaryPink = [236, 72, 153]; // #ec4899
    const darkSlate = [15, 23, 42]; // #0f172a

    // -- PAGE 1: COVER & SUMMARY --

    // Header Bar
    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.rect(0, 0, 210, 50, 'F');

    // Logo / Brand
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Finanças em Casal', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RELATÓRIO MENSAL DE PERFORMANCE FINANCEIRA', 20, 32);

    // Month Info Box (Right)
    doc.setFillColor(255, 255, 255, 0.1);
    doc.rect(140, 15, 55, 20, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(monthName.toUpperCase(), 145, 24);
    doc.setFontSize(8);
    doc.text(`GERADO EM: ${new Date().toLocaleDateString('pt-BR')}`, 145, 30);

    // --- SUMMARY BOXES ---
    const drawBox = (x: number, y: number, label: string, value: string, color: number[]) => {
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.roundedRect(x, y, 55, 25, 3, 3, 'F');
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.line(x, y + 23, x + 55, y + 23); // Bottom accent line

        doc.setTextColor(100, 116, 139); // Slate 500
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), x + 5, y + 8);

        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.setFontSize(12);
        doc.text(value, x + 5, y + 18);
    };

    const totalOut = summary.totalFixed + summary.totalCommon + summary.totalEqual;
    drawBox(15, 65, 'Total de Gastos', formatCurrency(totalOut), primaryPink);
    drawBox(77, 65, `Renda ${coupleInfo.person1Name.split(' ')[0]}`, formatCurrency(coupleInfo.salary1), primaryBlue);
    drawBox(140, 65, `Renda ${coupleInfo.person2Name.split(' ')[0]}`, formatCurrency(coupleInfo.salary2), primaryBlue);

    // --- SETTLEMENT SECTION ---
    doc.setFontSize(14);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('Fechamento do Mês', 15, 110);

    autoTable(doc, {
        startY: 115,
        head: [['Divisão de Responsabilidades', 'Valor']],
        body: [
            [`Responsabilidade de ${coupleInfo.person1Name}`, formatCurrency(summary.person1Responsibility)],
            [`Responsabilidade de ${coupleInfo.person2Name}`, formatCurrency(summary.person2Responsibility)],
            ['Diferença a Ajustar', formatCurrency(summary.transferAmount)],
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryBlue as [number, number, number] },
        styles: { fontStyle: 'bold', cellPadding: 5 }
    });

    // Result Highlight
    const lastY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, lastY, 180, 20, 2, 2, 'F');
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFontSize(11);
    const resultText = summary.whoTransfers === 'none'
        ? 'As contas estão equilibradas! Ninguém precisa transferir para ninguém.'
        : `RESULTADO: ${summary.whoTransfers === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name} deve transferir ${formatCurrency(summary.transferAmount)} para o parceiro.`;
    doc.text(resultText, 25, lastY + 13);

    // --- CATEGORY BREAKDOWN ---
    const catY = lastY + 45;
    doc.setFontSize(14);
    doc.text('Maiores Gastos por Categoria', 15, catY);

    const categoryData = Object.entries(summary.categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, val]) => [cat, formatCurrency(val)]);

    autoTable(doc, {
        startY: catY + 5,
        head: [['Categoria', 'Total Investido / Gasto']],
        body: categoryData,
        theme: 'grid',
        headStyles: { fillColor: darkSlate as [number, number, number] },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });

    // -- PAGE 2: DETAILED LOG --
    doc.addPage();

    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('EXTRATO DETALHADO DE TRANSAÇÕES', 20, 13);

    const expenseData = expenses
        .filter(e => isExpenseInMonth(e, monthKey))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(e => {
            const inst = getInstallmentInfo(e, monthKey);
            const desc = inst ? `${e.description} (${inst.current}/${inst.total})` : e.description;
            return [
                new Date(e.date).toLocaleDateString('pt-BR'),
                desc,
                e.category,
                e.type === ExpenseType.FIXED ? 'Fixo' : e.type === ExpenseType.COMMON ? 'Prop.' : e.type === ExpenseType.EQUAL ? '50/50' : (e.type === ExpenseType.REIMBURSEMENT ? 'Reemb.' : 'Indiv.'),
                e.paidBy === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name,
                formatCurrency(getMonthlyExpenseValue(e, monthKey))
            ];
        });

    autoTable(doc, {
        startY: 30,
        head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Pago por', 'Valor']],
        body: expenseData,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [71, 85, 105] }, // Slate 600
        columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } }
    });

    // Footer on every page (optional, but professional)
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Gerado pelo App Finanças em Casal PRO - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`Relatorio_Financas_${monthKey}.pdf`);
};

