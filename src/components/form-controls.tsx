'use client';
import {Children,isValidElement,useId,useRef,useState,type ReactNode} from 'react';
import * as Select from '@radix-ui/react-select';
import * as Popover from '@radix-ui/react-popover';
import {Check,ChevronDown,CalendarDays} from 'lucide-react';
import {DayPicker} from 'react-day-picker';
import {ptBR} from 'react-day-picker/locale';
import {dateFromInput,dateLabel,isAllowedDate} from '@/lib/date-input';
type OptionProps={value?:string;children:ReactNode;disabled?:boolean};
export function AppSelect({children,value,defaultValue,onChange,name,id,disabled,required,...rest}:{children:ReactNode;value?:string;defaultValue?:string;name?:string;id?:string;disabled?:boolean;required?:boolean;onChange?:(event:{target:{value:string}})=>void;'aria-label'?:string}){
 const autoId=useId();
 const options=Children.toArray(children).filter(isValidElement).map(child=>(child as React.ReactElement<OptionProps>).props);
 return <Select.Root name={name} value={value} defaultValue={defaultValue??(options[0]?String(options[0].value??options[0].children):undefined)} onValueChange={v=>onChange?.({target:{value:v}})} disabled={disabled} required={required}>
  <Select.Trigger {...rest} id={id??autoId} className="select-trigger"><Select.Value/><Select.Icon><ChevronDown size={16}/></Select.Icon></Select.Trigger>
  <Select.Portal><Select.Content className="select-content" position="popper" sideOffset={6} collisionPadding={12}><Select.ScrollUpButton className="select-scroll">⌃</Select.ScrollUpButton><Select.Viewport>{options.map(o=>{const v=String(o.value??o.children);return <Select.Item className="select-item" key={v} value={v} disabled={o.disabled}><Select.ItemText>{o.children}</Select.ItemText><Select.ItemIndicator><Check size={15}/></Select.ItemIndicator></Select.Item>})}</Select.Viewport><Select.ScrollDownButton className="select-scroll">⌄</Select.ScrollDownButton></Select.Content></Select.Portal>
 </Select.Root>;
}
export function DateField({name,defaultValue='',value,onChange,min,required,id,...rest}:{name?:string;defaultValue?:string;value?:string;onChange?:(event:{target:{value:string}})=>void;min?:string;required?:boolean;id?:string;'aria-label'?:string}){
 const [local,setLocal]=useState(defaultValue),[open,setOpen]=useState(false),[draft,setDraft]=useState<string|null>(null);
 const inputRef=useRef<HTMLInputElement>(null);
 const current=value??local;
 function update(next:string){inputRef.current?.setCustomValidity('');setLocal(next);setDraft(null);onChange?.({target:{value:next}});}
 return <div className="date-field"><input type="hidden" name={name} value={current}/><input ref={inputRef} {...rest} id={id} type="text" inputMode="numeric" placeholder="dd/mm/aaaa" required={required} value={draft??dateLabel(current)} onChange={e=>{const typed=e.target.value;setDraft(typed);const next=dateFromInput(typed);const valid=typed===''?!required:Boolean(next)&&isAllowedDate(next,min);e.target.setCustomValidity(valid?'':'Informe uma data válida'+(min?' a partir de '+dateLabel(min):'')+'.');setLocal(valid?next:'');onChange?.({target:{value:valid?next:''}});}}/><Popover.Root open={open} onOpenChange={setOpen}><Popover.Trigger asChild><button type="button" className="date-trigger icon-button" aria-label="Abrir calendário"><CalendarDays size={17}/></button></Popover.Trigger><Popover.Portal><Popover.Content className="calendar-popover" sideOffset={8} collisionPadding={16}><DayPicker autoFocus mode="single" locale={ptBR} selected={current?new Date(current+'T12:00:00'):undefined} defaultMonth={current?new Date(current+'T12:00:00'):undefined} disabled={min?{before:new Date(min+'T00:00:00')}:undefined} onSelect={date=>{if(!date)return;const next=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;update(next);setOpen(false);}}/><div className="calendar-footer"><button type="button" className="text-button" onClick={()=>{update(new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}));setOpen(false);}} disabled={Boolean(min&&min>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}))}>Hoje</button>{!required&&<button type="button" className="text-button" onClick={()=>{update('');setOpen(false);}}>Limpar</button>}</div></Popover.Content></Popover.Portal></Popover.Root></div>;
}
export function MonthField({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const [year,month]=value.split('-');const yearNumber=Number(year);
 return <div className="month-field" aria-label="Mês de referência"><AppSelect aria-label="Mês" value={month} onChange={e=>onChange(`${year}-${e.target.value}`)}>{Array.from({length:12},(_,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{new Date(2026,i,1).toLocaleDateString('pt-BR',{month:'long'})}</option>)}</AppSelect><AppSelect aria-label="Ano" value={year} onChange={e=>onChange(`${e.target.value}-${month}`)}>{Array.from({length:Math.max(2100,yearNumber)-Math.min(2000,yearNumber)+1},(_,i)=>{const y=Math.min(2000,yearNumber)+i;return <option key={y} value={String(y)}>{y}</option>})}</AppSelect></div>;
}
