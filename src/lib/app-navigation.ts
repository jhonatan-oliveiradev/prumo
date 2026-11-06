/** One source of truth for deep links, sidebar and browser history. */
export const appSections = [
  {label:'Visão geral',slug:''},
  {label:'Transações',slug:'transacoes'},
  {label:'Compromissos',slug:'compromissos'},
  {label:'Recorrências',slug:'recorrencias'},
  {label:'Conselheiro',slug:'conselheiro'},
  {label:'Contas',slug:'contas'},
  {label:'Cartões',slug:'cartoes'},
  {label:'Orçamentos',slug:'orcamentos'},
  {label:'Metas',slug:'metas'},
  {label:'Relatórios',slug:'relatorios'},
  {label:'Configurações',slug:'configuracoes'},
] as const;

export type AppSection = (typeof appSections)[number]['label'];
export const appSectionSlugs = appSections.filter(section=>section.slug!=='');

export function sectionPath(label: string):string {
  const section=appSections.find(item=>item.label===label);
  return section && section.slug ? `/app/${section.slug}` : '/app';
}

export function sectionFromPath(pathname:string):AppSection|null {
  const path=pathname.replace(/\/+$/,'')||'/';
  if(path==='/app')return 'Visão geral';
  const match=appSectionSlugs.find(item=>path===`/app/${item.slug}`);
  return match?.label??null;
}

export function validSectionSlug(slug:string):boolean {
  return appSectionSlugs.some(item=>item.slug===slug);
}
