export function dateLabel(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)?value.split('-').reverse().join('/'):'';}
export function dateFromInput(value:string){
 const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);if(!match)return '';
 const [,day,month,year]=match;const iso=`${year}-${month}-${day}`;const date=new Date(iso+'T12:00:00Z');
 return Number(year)>=1900&&Number(year)<=9999&&!Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:'';
}
export function isAllowedDate(value:string,min?:string){return Boolean(value)&&(!min||value>=min);}
