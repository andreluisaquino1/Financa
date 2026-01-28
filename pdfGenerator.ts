
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CoupleInfo, MonthlySummary, Expense, ExpenseType, SavingsGoal } from './types';
import { formatCurrency, isExpenseInMonth, getMonthlyExpenseValue, getInstallmentInfo } from './utils';

const hexToRgb = (hex: string | undefined): [number, number, number] => {
    if (!hex) return [37, 99, 235]; // Default P1 Blue
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [37, 99, 235];
};

export const exportMonthlyPDF = (
    monthKey: string,
    coupleInfo: CoupleInfo,
    summary: MonthlySummary,
    expenses: Expense[],
    goals: SavingsGoal[]
) => {
    const doc = new jsPDF();
    const [year, month] = monthKey.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Primary Colors
    const p1Col = coupleInfo.person1Color ? hexToRgb(coupleInfo.person1Color) : [37, 99, 235];
    const p2Col = coupleInfo.person2Color ? hexToRgb(coupleInfo.person2Color) : [236, 72, 153];
    const darkSlate = [15, 23, 42];

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
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(monthName.toUpperCase(), 145, 24);
    doc.setFontSize(7);
    doc.text(`GERADO EM: ${new Date().toLocaleDateString('pt-BR')}`, 145, 30);

    // --- SUMMARY BOXES ---
    const drawBox = (x: number, y: number, label: string, value: string, color: number[], w = 44) => {
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.roundedRect(x, y, w, 22, 3, 3, 'F');
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(1);
        doc.line(x, y + 21, x + w, y + 21); // Bottom accent line

        doc.setTextColor(100, 116, 139); // Slate 500
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), x + 4, y + 7);

        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.setFontSize(10);
        doc.text(value, x + 4, y + 15);
    };

    const totalOut = (summary.totalFixed || 0) + (summary.totalCommon || 0) + (summary.totalEqual || 0) + (summary.totalReimbursement || 0);
    const totalInc = (summary.person1TotalIncome || 0) + (summary.person2TotalIncome || 0);

    const activeGoals = goals.filter(g => !g.is_completed);
    const totalGoalContribution = activeGoals.reduce((sum, g) =>
        sum + (g.monthly_contribution_p1 || 0) + (g.monthly_contribution_p2 || 0), 0
    );

    const residual = Math.max(0, totalInc - (totalOut + (summary.person1PersonalTotal || 0) + (summary.person2PersonalTotal || 0) + totalGoalContribution));

    drawBox(15, 60, 'Custo da Casa', formatCurrency(totalOut), p1Col);
    drawBox(63, 60, 'Aporte em Sonhos', formatCurrency(totalGoalContribution), [147, 51, 234]); // Purple
    drawBox(111, 60, 'Consumo Pessoal', formatCurrency(summary.person1PersonalTotal + summary.person2PersonalTotal), [150, 150, 150]);
    drawBox(159, 60, 'Sobra de Caixa', formatCurrency(residual), [16, 185, 129]); // Emerald 500

    // --- SETTLEMENT SECTION ---
    doc.setFontSize(12);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('Fechamento do Mês', 15, 95);

    autoTable(doc, {
        startY: 100,
        head: [['Pessoa', 'Sua Responsabilidade no Mês']],
        body: [
            [`Responsabilidade de ${coupleInfo.person1Name}`, formatCurrency(summary.person1Responsibility)],
            [`Responsabilidade de ${coupleInfo.person2Name}`, formatCurrency(summary.person2Responsibility)],
            ['Diferença a Ser Ajustada entre vocês', formatCurrency(summary.transferAmount)],
        ],
        theme: 'striped',
        headStyles: { fillColor: p1Col as [number, number, number] },
        styles: { fontStyle: 'bold', cellPadding: 5 }
    });

    // Result Highlight
    const lastY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.roundedRect(15, lastY, 180, 20, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const resultText = summary.whoTransfers === 'none'
        ? 'As contas estão equilibradas! Ninguém precisa transferir para ninguém.'
        : `RESULTADO: ${summary.whoTransfers === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name} deve transferir ${formatCurrency(summary.transferAmount)} para o parceiro.`;
    doc.text(resultText, 25, lastY + 12);

    // --- GOALS SECTION ---
    if (activeGoals.length > 0) {
        const goalY = (doc as any).lastAutoTable.finalY + 25;
        doc.setFontSize(12);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text('Planejamento de Sonhos (Metas)', 15, goalY);

        const goalsData = activeGoals.map(g => [
            g.title,
            formatCurrency(g.target_value),
            formatCurrency((g.monthly_contribution_p1 || 0) + (g.monthly_contribution_p2 || 0)),
            `${(((g.current_value || 0) + (g.current_savings_p1 || 0) + (g.current_savings_p2 || 0)) / g.target_value * 100).toFixed(0)}%`
        ]);

        autoTable(doc, {
            startY: goalY + 5,
            head: [['Meta / Sonho', 'Valor Alvo', 'Aporte Mensal', 'Progresso']],
            body: goalsData,
            theme: 'grid',
            headStyles: { fillColor: [147, 51, 234] }, // Purple 600
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right', fontStyle: 'bold' },
                3: { halign: 'center' }
            }
        });
    }

    // --- CATEGORY BREAKDOWN ---
    const catY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('Distribuição por Categoria', 15, catY);

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

