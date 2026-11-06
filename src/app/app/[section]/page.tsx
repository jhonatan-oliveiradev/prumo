import {notFound} from 'next/navigation';
import {appSectionSlugs,validSectionSlug} from '@/lib/app-navigation';

export function generateStaticParams(){
  return appSectionSlugs.map(section=>({section:section.slug}));
}

/** The shared /app layout hosts the workspace while this page validates the URL. */
export default async function FinanceSectionPage({params}:{params:Promise<{section:string}>}){
  const {section}=await params;
  if(!validSectionSlug(section))notFound();
  return null;
}
