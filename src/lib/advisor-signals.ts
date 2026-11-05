import type {buildAdvisorContext} from './advisor';
export type AdvisorDestination='Transações'|'Compromissos'|'Orçamentos'|'Metas';
export type AdvisorSignal={tone:'positive'|'warning'|'negative'|'info';title:string;detail:string;action:string;destination:AdvisorDestination};
/** Local, deterministic indicators. Color is always accompanied by a label and icon. */
export function advisorSignals(c:ReturnType<typeof buildAdvisorContext>):AdvisorSignal[]{
 return [
  c.freeBalance==='negative'?{tone:'negative',title:'Saldo comprometido',detail:'Os compromissos superam o saldo disponível.',action:'Revisar compromissos',destination:'Compromissos'}:c.freeBalance==='positive'?{tone:'positive',title:'Saldo disponível positivo',detail:'Confira as pendências antes de assumir novos gastos.',action:'Ver compromissos',destination:'Compromissos'}:{tone:'warning',title:'Sem folga no saldo',detail:'Revise os próximos pagamentos e recebimentos.',action:'Ver compromissos',destination:'Compromissos'},
  !c.hasRecordedIncome?{tone:'info',title:'Renda ainda não registrada',detail:'Registre os recebimentos para dar contexto aos gastos.',action:'Ver transações',destination:'Transações'}:c.budgetPressure!=='none'||c.spendingPressure==='above_income'?{tone:'negative',title:'Gastos pedem revisão',detail:'Há limites ultrapassados ou despesas acima da renda registrada.',action:'Revisar orçamentos',destination:'Orçamentos'}:{tone:'info',title:'Acompanhe seus limites',detail:'Compare os gastos de cada categoria com seu planejamento.',action:'Ver orçamentos',destination:'Orçamentos'},
  c.futureDeficit?{tone:'warning',title:'Atenção aos próximos meses',detail:'A projeção conservadora indica risco de saldo negativo.',action:'Revisar compromissos',destination:'Compromissos'}:{tone:'info',title:'Planeje seu próximo objetivo',detail:'Defina uma meta compatível com seus compromissos.',action:'Ver metas',destination:'Metas'},
 ];
}
