
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

export const exportMonthlyPDF = async (
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
    const darkSlate = [15, 23, 42];

    // -- HEADER & LOGO --
    // Header Bar (Smaller)
    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.rect(0, 0, 210, 30, 'F');

    // Attempt to load logo (asynchronous)
    try {
        const logoUrl = '/logo.png';
        const img = new Image();
        img.src = logoUrl;
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        doc.addImage(img, 'PNG', 15, 7, 16, 16);
    } catch (e) {
        console.warn('Could not load logo for PDF', e);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Finanças em Casal', 35, 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const monthInfo = `${monthName.toUpperCase()}  |  GERADO EM: ${new Date().toLocaleDateString('pt-BR')}`;
    doc.text(monthInfo, 35, 23);

    // --- SUMMARY BOXES ---
    const drawBox = (x: number, y: number, label: string, value: string, color: number[], w = 44) => {
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.roundedRect(x, y, w, 18, 2, 2, 'F');
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.5);
        doc.line(x, y + 17, x + w, y + 17);

        doc.setTextColor(100, 116, 139); // Slate 500
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), x + 3, y + 5);

        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.setFontSize(9);
        doc.text(value, x + 3, y + 13);
    };

    const totalOut = (summary.totalFixed || 0) + (summary.totalCommon || 0) + (summary.totalEqual || 0) + (summary.totalReimbursement || 0);
    const totalInc = (summary.person1TotalIncome || 0) + (summary.person2TotalIncome || 0);

    const activeGoals = goals.filter(g => !g.is_completed);
    const totalGoalContribution = activeGoals.reduce((sum, g) =>
        sum + (g.monthly_contribution_p1 || 0) + (g.monthly_contribution_p2 || 0), 0
    );

    const residual = Math.max(0, totalInc - (totalOut + (summary.person1PersonalTotal || 0) + (summary.person2PersonalTotal || 0) + totalGoalContribution));

    drawBox(15, 40, 'Custo da Casa', formatCurrency(totalOut), p1Col);
    drawBox(63, 40, 'Aporte Sonhos', formatCurrency(totalGoalContribution), [147, 51, 234]);
    drawBox(111, 40, 'Consumo Pessoal', formatCurrency(summary.person1PersonalTotal + summary.person2PersonalTotal), [150, 150, 150]);
    drawBox(159, 40, 'Sobra de Caixa', formatCurrency(residual), [16, 185, 129]);

    // --- DETAILED CLOSING SPREADSHEET ---
    let currentY = 70;
    doc.setFontSize(10);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('Planilha de Fechamento Detalhada', 15, currentY);

    // Step 1: Origem dos Gastos
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('01 | ORIGEM DOS GASTOS COMPARTILHADOS', 15, currentY + 6);

    const totalSharedPlusReimb = (summary.totalFixed || 0) + (summary.totalCommon || 0) + (summary.totalEqual || 0) + (summary.totalReimbursement || 0);

    autoTable(doc, {
        startY: currentY + 8,
        head: [['Fixos', 'Variáveis', 'Iguais', 'Reembolsos', 'Total Movimentado']],
        body: [[
            formatCurrency(summary.totalFixed || 0),
            formatCurrency(summary.totalCommon || 0),
            formatCurrency(summary.totalEqual || 0),
            formatCurrency(summary.totalReimbursement || 0),
            formatCurrency(totalSharedPlusReimb)
        ]],
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105], fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
        margin: { left: 15, right: 15 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Step 2: Detalhamento por Pessoa
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('02 | DETALHAMENTO POR PESSOA', 15, currentY);

    const p1Diff = summary.person1Responsibility - summary.person1Paid;
    const p2Diff = summary.person2Responsibility - summary.person2Paid;

    autoTable(doc, {
        startY: currentY + 2,
        head: [['Item', coupleInfo.person1Name, coupleInfo.person2Name]],
        body: [
            ['Renda Bruta', formatCurrency(summary.person1TotalIncome), formatCurrency(summary.person2TotalIncome)],
            ['Responsabilidade', formatCurrency(summary.person1Responsibility), formatCurrency(summary.person2Responsibility)],
            ['Valor Pago', formatCurrency(summary.person1Paid), formatCurrency(summary.person2Paid)],
            ['Diferença (Acerto)',
                `${p1Diff > 0 ? 'Pagar' : 'Receber'}: ${formatCurrency(Math.abs(p1Diff))}`,
                `${p2Diff > 0 ? 'Pagar' : 'Receber'}: ${formatCurrency(Math.abs(p2Diff))}`
            ],
        ],
        theme: 'striped',
        headStyles: { fillColor: p1Col as [number, number, number], fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { halign: 'right' } },
        margin: { left: 15, right: 15 }
    });

    const lastY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.roundedRect(15, lastY, 180, 10, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    const resultText = summary.whoTransfers === 'none'
        ? 'As contas estão equilibradas! Ninguém precisa transferir para ninguém.'
        : `RESULTADO: ${summary.whoTransfers === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name} deve transferir ${formatCurrency(summary.transferAmount)} para o parceiro.`;
    doc.text(resultText, 20, lastY + 6);

    // --- CATEGORY CHART SECTION ---
    const chartY = lastY + 18;
    doc.setFontSize(10);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('Distribuição por Categoria (Top 6)', 15, chartY);

    const sortedCategories = Object.entries(summary.categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    const maxVal = Math.max(...sortedCategories.map(c => c[1]), 1);
    currentY = chartY + 5;

    sortedCategories.forEach(([category, value]) => {
        const barWidth = (value / maxVal) * 120; // Max width 120mm
        doc.setFillColor(241, 245, 249); // Background bar
        doc.rect(15, currentY, 120, 4, 'F');
        doc.setFillColor(p1Col[0], p1Col[1], p1Col[2]); // Foreground bar
        doc.rect(15, currentY, barWidth, 4, 'F');

        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.setFontSize(7);
        doc.text(`${category}: ${formatCurrency(value)}`, 140, currentY + 3);
        currentY += 6;
    });

    // --- GOALS SECTION (Compact) ---
    if (activeGoals.length > 0) {
        const goalY = currentY + 10;
        doc.setFontSize(10);
        doc.text('Planejamento de Sonhos (Metas)', 15, goalY);

        const goalsData = activeGoals.slice(0, 4).map(g => [
            g.title,
            formatCurrency((g.monthly_contribution_p1 || 0) + (g.monthly_contribution_p2 || 0)),
            `${(((g.current_value || 0) + (g.current_savings_p1 || 0) + (g.current_savings_p2 || 0)) / g.target_value * 100).toFixed(0)}%`
        ]);

        autoTable(doc, {
            startY: goalY + 3,
            head: [['Meta / Sonho', 'Aporte Mensal', 'Progresso']],
            body: goalsData,
            theme: 'grid',
            headStyles: { fillColor: [147, 51, 234], fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: 15, right: 15 }
        });
    }

    // Footer
    const finalPageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= finalPageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Finanças em Casal PRO - Relatório Mensal Autenticado - Página ${i}/${finalPageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`Relatorio_Financas_${monthKey}.pdf`);
};

