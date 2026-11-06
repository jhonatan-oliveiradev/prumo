import {AlertCircle,ArrowUpRight,CalendarClock} from 'lucide-react';
import type {AttentionSummary} from '@/lib/financial-attention';

/** Human-readable alerts derived from existing records, never synthetic advice. */
export function FinanceAttentionCard({summary,format,onView}:{
 summary:AttentionSummary;
 format:(cents:number)=>string;
 onView:()=>void;
}){
 const {overdueCount,overdueAmount,upcomingCount,upcomingAmount}=summary;
 if(overdueCount===0&&upcomingCount===0)return null;
 const urgent=overdueCount>0;
 const Icon=urgent?AlertCircle:CalendarClock;
 return <section className={`finance-attention ${urgent?'is-overdue':''}`} aria-labelledby="finance-attention-title">
  <div className="attention-symbol"><Icon size={22} aria-hidden="true"/></div>
  <div className="attention-copy">
   <h2 id="finance-attention-title">{urgent
    ?`${overdueCount} ${overdueCount===1?'compromisso vencido':'compromissos vencidos'}`
    :`${upcomingCount} ${upcomingCount===1?'vencimento':'vencimentos'} nos próximos 7 dias`}</h2>
   <p>{urgent?`${format(overdueAmount)} em despesas ainda não pagas.`: `${format(upcomingAmount)} em pagamentos previstos.`}
    {urgent&&upcomingCount>0?` Há também ${upcomingCount} ${upcomingCount===1?'vencimento':'vencimentos'} nos próximos 7 dias.`:''}
   </p>
  </div>
  <button type="button" className="secondary" onClick={onView}>Revisar compromissos <ArrowUpRight size={15} aria-hidden="true"/></button>
 </section>;
}
