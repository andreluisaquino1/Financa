// Test file to verify calculations
import { calculateSummary } from './utils';
import { CoupleInfo, Expense, ExpenseType } from './types';

// Test data
const coupleInfo: CoupleInfo = {
    person1Name: 'André',
    person2Name: 'Luciana',
    salary1: 8000,
    salary2: 4000,
    andreCreditCardValue: 500,
    andrePersonalExpenses: 0
};

const expenses: Expense[] = [
    {
        id: '1',
        date: '2026-01-15',
        type: ExpenseType.FIXED,
        category: 'Moradia',
        description: 'Aluguel',
        totalValue: 1200,
        installments: 1,
        paidBy: 'person1',
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: '2',
        date: '2026-01-10',
        type: ExpenseType.COMMON,
        category: 'Alimentação',
        description: 'Supermercado',
        totalValue: 600,
        installments: 1,
        paidBy: 'person2',
        createdAt: '2026-01-02T00:00:00Z'
    },
    {
        id: '3',
        date: '2026-01-05',
        type: ExpenseType.EQUAL,
        category: 'Lazer',
        description: 'Cinema',
        totalValue: 100,
        installments: 1,
        paidBy: 'person1',
        createdAt: '2026-01-03T00:00:00Z'
    }
];

const monthKey = '2026-01';

// Run test
const summary = calculateSummary(expenses, coupleInfo, monthKey);

console.log('=== TESTE DE CÁLCULOS ===');
console.log('');
console.log('Dados de Entrada:');
console.log(`  Salário André: R$ ${coupleInfo.salary1}`);
console.log(`  Salário Luciana: R$ ${coupleInfo.salary2}`);
console.log(`  Cartão André: R$ ${coupleInfo.andreCreditCardValue}`);
console.log(`  Proporção: ${(coupleInfo.salary1 / (coupleInfo.salary1 + coupleInfo.salary2) * 100).toFixed(1)}% / ${(coupleInfo.salary2 / (coupleInfo.salary1 + coupleInfo.salary2) * 100).toFixed(1)}%`);
console.log('');
console.log('Gastos:');
expenses.forEach(e => console.log(`  - ${e.description}: R$ ${e.totalValue} (${e.type}, pago por ${e.paidBy})`));
console.log('');
console.log('Resultado do Cálculo:');
console.log(`  Total Fixos: R$ ${summary.totalFixed}`);
console.log(`  Total Comum: R$ ${summary.totalCommon}`);
console.log(`  Total 50/50: R$ ${summary.totalEqual}`);
console.log(`  Total Reembolsos: R$ ${summary.totalReimbursement}`);
console.log('');
console.log(`  André pagou: R$ ${summary.person1Paid}`);
console.log(`  Luciana pagou: R$ ${summary.person2Paid}`);
console.log('');
console.log(`  Responsabilidade André: R$ ${summary.person1Responsibility.toFixed(2)}`);
console.log(`  Responsabilidade Luciana: R$ ${summary.person2Responsibility.toFixed(2)}`);
console.log('');
console.log(`  Quem transfere: ${summary.whoTransfers === 'person1' ? 'André' : summary.whoTransfers === 'person2' ? 'Luciana' : 'Ninguém'}`);
console.log(`  Valor a transferir: R$ ${summary.transferAmount.toFixed(2)}`);
console.log('');

// Expected calculations:
// Total salary: 12000, ratio: 66.67% / 33.33%
// Aluguel (1200): André deve 800, Luciana deve 400
// Supermercado (600): André deve 400, Luciana deve 200
// Cinema 50/50 (100): André deve 50, Luciana deve 50
// Cartão André (500): André deve 500 (Luciana pagou)

// Responsabilidade André: 800 + 400 + 50 + 500 = 1750
// Responsabilidade Luciana: 400 + 200 + 50 = 650

// André pagou: 1200 (aluguel) + 100 (cinema) = 1300
// Luciana pagou: 600 (super) + 500 (cartão) = 1100

// Balance André: 1750 - 1300 = 450 (André deve)
// Balance Luciana: 650 - 1100 = -450 (Luciana recebe)

console.log('=== VERIFICAÇÃO ESPERADA ===');
console.log('  André deveria: R$ 1750.00');
console.log('  Luciana deveria: R$ 650.00');
console.log('  André pagou: R$ 1300');
console.log('  Luciana pagou: R$ 1100');
console.log('  André deveria transferir: R$ 450.00');
console.log('');

const passedResp1 = Math.abs(summary.person1Responsibility - 1750) < 0.01;
const passedResp2 = Math.abs(summary.person2Responsibility - 650) < 0.01;
const passedTransfer = Math.abs(summary.transferAmount - 450) < 0.01;
const passedWho = summary.whoTransfers === 'person1';

console.log('=== RESULTADO DOS TESTES ===');
console.log(`  Responsabilidade André: ${passedResp1 ? '✅ PASSOU' : '❌ FALHOU'}`);
console.log(`  Responsabilidade Luciana: ${passedResp2 ? '✅ PASSOU' : '❌ FALHOU'}`);
console.log(`  Valor transferência: ${passedTransfer ? '✅ PASSOU' : '❌ FALHOU'}`);
console.log(`  Quem transfere: ${passedWho ? '✅ PASSOU' : '❌ FALHOU'}`);
console.log('');

if (passedResp1 && passedResp2 && passedTransfer && passedWho) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
} else {
    console.log('⚠️ ALGUNS TESTES FALHARAM');
}
