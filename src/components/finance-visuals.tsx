import { ArrowDownLeft, ArrowUpRight, ChartNoAxesCombined, Coffee, HeartPulse, House, PawPrint, ShoppingBag, Sparkles, Wallet } from 'lucide-react';
import { summary, type FinanceData } from '@/lib/finance';
export const categoryIcons: Record<string, typeof Wallet> = {Alimentação:ShoppingBag,Moradia:House,Pets:PawPrint,Saúde:HeartPulse,Lazer:Sparkles,Assinaturas:Coffee};
export function MetricStrip({items}:{items:{label:string;value:string;caption:string}[]}) {
 return <div className="metrics">{items.map(item=><section className="card metric" key={item.label}><p className="muted">{item.label}</p><strong>{item.value}</strong><small>{item.caption}</small></section>)}</div>;
}
export function CashFlow({data,month,format}:{data:FinanceData;month:string;format:(n:number)=>string}) {
 const months=Array.from({length:6},(_,i)=>{const date=new Date(Number(month.slice(0,4)),Number(month.slice(5))-6+i,1);const id=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;return {...summary(data,id),id,label:date.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')};});
 const max=Math.max(1,...months.flatMap(m=>[m.income,m.expense]));
 const hasData=months.some(m=>m.income||m.expense);
 return <section className="card cash-flow"><div className="section-title"><div><h3>Fluxo do seu dinheiro</h3><p className="muted">Receitas e despesas · últimos 6 meses</p></div><ChartNoAxesCombined size={19} className="muted"/></div><div className="legend"><span><i/>Entradas</span><span><i/>Saídas</span></div>{hasData?<div className="chart" role="img" aria-label={months.map(m=>`${m.label}: entradas ${format(m.income)}, saídas ${format(m.expense)}`).join('; ')}><div className="chart-axis" aria-hidden="true"><span>{format(max)}</span><span>{format(Math.round(max/2))}</span><span>{format(0)}</span></div><div className="chart-plot">{months.map(m=><div className="bar-group" key={m.id}><div className="bars"><div title={`Entradas: ${format(m.income)}`} style={{height:`${m.income/max*100}%`}}/><div title={`Saídas: ${format(m.expense)}`} style={{height:`${m.expense/max*100}%`}}/></div><small>{m.label}</small></div>)}</div></div>:<div className="chart-empty"><ChartNoAxesCombined size={30}/><strong>Seu histórico começa aqui</strong><p>Ao registrar receitas e despesas, você verá como seu dinheiro se movimenta.</p></div>}</section>;
}
export function FlowDirection({income}:{income:boolean}){return income?<ArrowUpRight size={18}/>:<ArrowDownLeft size={18}/>}
