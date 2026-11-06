import {categories,type FinanceData} from '@/lib/finance';
import {isGoalCover} from '@/lib/goal-covers';
import {isCardColor} from '@/lib/credit';
import type {CsvOrigin} from '@/lib/import-origin';
import {prisma} from './prisma';
export class RevisionConflict extends Error {}
const workspaceId=(userId:string)=>`personal:${userId}`;
const entityId=(workspace:string,kind:string,id:string)=>`${workspace}:${kind}:${id}`;
const csvSource='prumo-csv';
const csvBatchPrefix=(workspace:string)=>entityId(workspace,'csv-batch','');
const dateOnly=(date:string)=>new Date(`${date}T12:00:00Z`);
const categoryId=(workspace:string,type:string,name:string)=>entityId(workspace,'category',`${type}:${name}`);
const signedMovement=(kind:string,amount:bigint)=>['CONTRIBUTION','ADJUSTMENT_IN'].includes(kind)?amount:-amount;

export async function readWorkspace(userId:string){
 const workspace=await prisma.workspace.findFirst({where:{id:workspaceId(userId),members:{some:{user:{authSubject:userId}}}},include:{reconciliations:true,transfers:true,importBatches:{where:{source:csvSource}},creditCards:{include:{purchases:true}},accounts:true,categories:true,transactions:true,recurringRules:true,budgets:{include:{lines:{include:{category:true}}}},goals:{include:{movements:true}}}});
 if(!workspace||workspace.revision===0)return null;
 const batchPrefix=csvBatchPrefix(workspace.id);
 const batchDates=new Map(workspace.importBatches.map(batch=>[batch.id,batch.createdAt.toISOString()]));
 function importFields(id:string|null,key:string|null){
  const importedAt=id?batchDates.get(id):undefined;
  return id?.startsWith(batchPrefix)&&key&&importedAt?{imported:{batchId:id.slice(batchPrefix.length),key,importedAt}}:{};
 }
 const cardsById=new Map(workspace.creditCards.map(card=>[card.id,card.clientId]));
 const creditCards:NonNullable<FinanceData['creditCards']>=workspace.creditCards.map(card=>({
  id:card.clientId,name:card.name,color:isCardColor(card.color)?card.color:'forest',limit:Number(card.limitMinor),
  closingDay:card.closingDay,dueDay:card.dueDay,space:card.space==='work'?'work':'personal',
 }));
 const creditPurchases=workspace.creditCards.flatMap(card=>card.purchases.map(purchase=>({
  ...importFields(purchase.importBatchId,purchase.importExternalId),
  ...(purchase.statementCycle?{statementCycle:purchase.statementCycle}:{}),
  id:purchase.clientId,cardId:card.clientId,description:purchase.description,amount:Number(purchase.amountMinor),
  date:purchase.purchasedOn.toISOString().slice(0,10),category:purchase.category,installments:purchase.installments,
 })));
 const transferPrefix=entityId(workspace.id,'transfer','');
 const transfers:NonNullable<FinanceData['transfers']>=workspace.transfers
  .filter(row=>row.id.startsWith(transferPrefix))
  .map(row=>({
   id:row.id.slice(transferPrefix.length),
   sourceAccountId:workspace.accounts.find(a=>a.id===row.sourceAccountId)!.clientId,
   targetAccountId:workspace.accounts.find(a=>a.id===row.targetAccountId)!.clientId,
   amount:Number(row.amountMinor),date:row.occurredOn.toISOString().slice(0,10),
   ...(row.note?{note:row.note}:{}),
  }));
 const reconciliationPrefix=entityId(workspace.id,'reconciliation','');
 const reconciliations:NonNullable<FinanceData['reconciliations']>=workspace.reconciliations
  .filter(row=>row.id.startsWith(reconciliationPrefix))
  .map(row=>({
   id:row.id.slice(reconciliationPrefix.length),
   accountId:workspace.accounts.find(a=>a.id===row.accountId)!.clientId,
   date:row.occurredOn.toISOString().slice(0,10),
   balanceBefore:Number(row.balanceBeforeMinor),
   balanceAfter:Number(row.balanceAfterMinor),
   delta:Number(row.deltaMinor),
   note:row.note,
  }));
 const data:FinanceData={reconciliations,transfers,creditCards,creditPurchases,recurringRules:workspace.recurringRules.filter(r=>r.clientId&&r.interval!=='DAILY').map(r=>({id:r.clientId!,description:r.title,amount:Number(r.amountMinor),type:r.kind==='INCOME'?'income':'expense',category:workspace.categories.find(c=>c.id===r.categoryId)?.name??'Outros',accountId:workspace.accounts.find(a=>a.id===r.accountId)!.clientId,space:r.space==='work'?'work':'personal',frequency:r.interval==='WEEKLY'?'weekly':r.interval==='YEARLY'?'yearly':'monthly',status:r.status==='ACTIVE'?'active':'paused',startsOn:r.startsOn.toISOString().slice(0,10),...(r.endsOn?{endsOn:r.endsOn.toISOString().slice(0,10)}:{}),...(r.generatedThroughOn?{generatedThrough:r.generatedThroughOn.toISOString().slice(0,10)}:{})})),version:1,name:workspace.displayName??'',accounts:workspace.accounts.filter(a=>!a.isArchived).map(a=>({id:a.clientId,name:a.name,openingBalance:Number(a.openingBalanceMinor)})),transactions:workspace.transactions.filter(t=>t.kind==='INCOME'||t.kind==='EXPENSE').filter(t=>t.status!=='VOID').map(t=>({...(t.importSource===csvSource?importFields(t.importBatchId,t.importExternalId):{}),...(t.creditCardId&&t.creditInvoiceCycle?{creditInvoice:{cardId:cardsById.get(t.creditCardId)!,cycle:t.creditInvoiceCycle}}:{}),...(t.recurringRuleId&&t.recurringScheduledOn?{recurrence:{ruleId:workspace.recurringRules.find(r=>r.id===t.recurringRuleId)!.clientId!,scheduledOn:t.recurringScheduledOn.toISOString().slice(0,10)}}:{}),...(t.installmentGroupId&&t.installmentNumber&&t.installmentCount?{installment:{groupId:t.installmentGroupId,number:t.installmentNumber,count:t.installmentCount}}:{}),id:t.clientId,description:t.title,amount:Number(t.amountMinor),type:t.kind==='INCOME'?'income':'expense',category:workspace.categories.find(c=>c.id===t.categoryId)?.name??'Outros',date:t.occurredOn.toISOString().slice(0,10),accountId:workspace.accounts.find(a=>a.id===t.accountId)!.clientId,status:t.status==='CLEARED'?'paid':'pending',space:t.space==='work'?'work':'personal'})),budgets:workspace.budgets.filter(b=>b.status==='ACTIVE').flatMap(b=>b.lines.map(l=>({id:b.clientId,category:l.category.name,limit:Number(l.limitMinor)}))),goals:workspace.goals.filter(g=>g.status!=='ARCHIVED').map(g=>({id:g.clientId,name:g.name,target:Number(g.targetAmountMinor),...(isGoalCover(g.cover)?{cover:g.cover}:{}),...(g.featured?{featured:true}:{}),saved:Number(g.movements.reduce((sum,m)=>sum+signedMovement(m.kind,m.amountMinor),0n))}))};
 return {data,revision:workspace.revision,updatedAt:workspace.updatedAt.toISOString()};
}

export async function writeWorkspace(user:{id:string;name:string},data:FinanceData,revision:number){
 const id=workspaceId(user.id);
 return prisma.$transaction(async tx=>{
  const profile=await tx.appUser.upsert({where:{authSubject:user.id},create:{authSubject:user.id,displayName:user.name},update:{}});
  if(revision===0){
   const created=await tx.workspace.createMany({data:{id,name:'Meu espaço',displayName:data.name,revision:1},skipDuplicates:true});
   if(created.count!==1)throw new RevisionConflict();
   await tx.workspaceMember.create({data:{workspaceId:id,userId:profile.id,role:'OWNER'}});
  }else{
   const result=await tx.workspace.updateMany({where:{id,revision,members:{some:{user:{authSubject:user.id},role:{in:['OWNER','EDITOR']}}}},data:{revision:{increment:1},displayName:data.name}});
   if(result.count!==1)throw new RevisionConflict();
  }
  for(const name of categories){
   for(const type of ['INCOME','EXPENSE'] as const){const cid=categoryId(id,type,name);await tx.category.upsert({where:{id:cid},create:{id:cid,workspaceId:id,name,type},update:{}});}
  }
  for(const account of data.accounts){const aid=entityId(id,'account',account.id);await tx.account.upsert({where:{id:aid},create:{id:aid,workspaceId:id,clientId:account.id,name:account.name,openingBalanceMinor:BigInt(account.openingBalance)},update:{name:account.name,openingBalanceMinor:BigInt(account.openingBalance)}});}
  // Atomic zero-sum records: deletions and upserts share the same workspace revision.
  // A legacy client without this field must never erase transfers created by a newer client.
  // Other transfer types in the domain are not owned by the Prumo local-first editor.
  if(data.transfers!==undefined){
   const prefix=entityId(id,'transfer','');
   await tx.transfer.deleteMany({where:{workspaceId:id,id:{
    startsWith:prefix,notIn:data.transfers.map(t=>entityId(id,'transfer',t.id)),
   }}});
  }
  for(const transfer of data.transfers??[]){
   const tid=entityId(id,'transfer',transfer.id);
   const fields={
    sourceAccountId:entityId(id,'account',transfer.sourceAccountId),
    targetAccountId:entityId(id,'account',transfer.targetAccountId),
    amountMinor:BigInt(transfer.amount),
    occurredOn:dateOnly(transfer.date),
    note:transfer.note??null,
   };
   await tx.transfer.upsert({where:{id:tid},create:{id:tid,workspaceId:id,...fields},update:fields});
  }

  // An older client must never remove reconciliation history it cannot represent.
  if(data.reconciliations!==undefined){
   const prefix=entityId(id,'reconciliation','');
   await tx.accountBalanceReconciliation.deleteMany({where:{workspaceId:id,id:{
    startsWith:prefix,notIn:data.reconciliations.map(r=>entityId(id,'reconciliation',r.id)),
   }}});
  }
  for(const item of data.reconciliations??[]){
   const rid=entityId(id,'reconciliation',item.id);
   const fields={
    accountId:entityId(id,'account',item.accountId),
    occurredOn:dateOnly(item.date),
    deltaMinor:BigInt(item.delta),
    balanceBeforeMinor:BigInt(item.balanceBefore),
    balanceAfterMinor:BigInt(item.balanceAfter),
    note:item.note,
   };
   // Preserve the historical correction: never rewrite a previously stored event.
   await tx.accountBalanceReconciliation.createMany({data:[{id:rid,workspaceId:id,...fields}],skipDuplicates:true});
  }
  for(const r of data.recurringRules??[]){const rid=entityId(id,'recurring',r.id);const fields={title:r.description,amountMinor:BigInt(r.amount),kind:r.type==='income'?'INCOME' as const:'EXPENSE' as const,categoryId:categoryId(id,r.type==='income'?'INCOME':'EXPENSE',r.category),accountId:entityId(id,'account',r.accountId),space:r.space,interval:r.frequency==='weekly'?'WEEKLY' as const:r.frequency==='yearly'?'YEARLY' as const:'MONTHLY' as const,status:r.status==='active'?'ACTIVE' as const:'PAUSED' as const,startsOn:dateOnly(r.startsOn),endsOn:r.endsOn?dateOnly(r.endsOn):null,generatedThroughOn:r.generatedThrough?dateOnly(r.generatedThrough):null};await tx.recurringRule.upsert({where:{id:rid},create:{id:rid,workspaceId:id,clientId:r.id,...fields},update:fields});}
  const cardIds=(data.creditCards??[]).map(card=>entityId(id,'credit-card',card.id));
  for(const card of data.creditCards??[]){
   const cid=entityId(id,'credit-card',card.id);
   const fields={name:card.name,color:card.color,limitMinor:BigInt(card.limit),closingDay:card.closingDay,dueDay:card.dueDay,space:card.space};
   await tx.creditCard.upsert({where:{id:cid},create:{id:cid,workspaceId:id,clientId:card.id,...fields},update:fields});
  }
  const purchases=data.creditPurchases??[];
  const prefix=csvBatchPrefix(id);
  const batches=new Map<string,Date>();
  for(const row of [...data.transactions,...purchases]){
   if(row.imported)batches.set(prefix+row.imported.batchId,new Date(row.imported.importedAt));
  }
  if(batches.size)await tx.importBatch.createMany({
   data:[...batches].map(([batchId,date])=>({id:batchId,workspaceId:id,source:csvSource,status:'COMPLETED',createdAt:date,completedAt:date})),
   skipDuplicates:true,
  });
  const importColumns=(origin:CsvOrigin|undefined)=>({
   importBatchId:origin?prefix+origin.batchId:null,importExternalId:origin?.key??null,
  });
  await tx.creditPurchase.deleteMany({where:{card:{workspaceId:id},id:{notIn:purchases.map(p=>entityId(id,'credit-purchase',p.id))}}});
  for(const purchase of purchases){
   const pid=entityId(id,'credit-purchase',purchase.id);
   const fields={...importColumns(purchase.imported),statementCycle:purchase.statementCycle??null,cardId:entityId(id,'credit-card',purchase.cardId),description:purchase.description,amountMinor:BigInt(purchase.amount),purchasedOn:dateOnly(purchase.date),category:purchase.category,installments:purchase.installments};
   await tx.creditPurchase.upsert({where:{id:pid},create:{id:pid,clientId:purchase.id,...fields},update:fields});
  }
  const transactionIds=data.transactions.map(t=>entityId(id,'transaction',t.id));
  await tx.transaction.deleteMany({where:{workspaceId:id,id:{notIn:transactionIds}}});
  for(const t of data.transactions){const tid=entityId(id,'transaction',t.id);const old=await tx.transaction.findUnique({where:{id:tid},select:{clearedAt:true,importSource:true}});const fields={...(t.imported||old?.importSource===csvSource?{...importColumns(t.imported),importSource:t.imported?csvSource:null}:{}),creditCardId:t.creditInvoice?entityId(id,'credit-card',t.creditInvoice.cardId):null,creditInvoiceCycle:t.creditInvoice?.cycle??null,recurringRuleId:t.recurrence?entityId(id,'recurring',t.recurrence.ruleId):null,recurringScheduledOn:t.recurrence?dateOnly(t.recurrence.scheduledOn):null,installmentGroupId:t.installment?.groupId??null,installmentNumber:t.installment?.number??null,installmentCount:t.installment?.count??null,accountId:entityId(id,'account',t.accountId),categoryId:categoryId(id,t.type==='income'?'INCOME':'EXPENSE',t.category),title:t.description,amountMinor:BigInt(t.amount),kind:t.type==='income'?'INCOME' as const:'EXPENSE' as const,status:t.status==='paid'?'CLEARED' as const:'PENDING' as const,space:t.space,occurredOn:dateOnly(t.date),clearedAt:t.status==='paid'?(old?.clearedAt??new Date()):null};await tx.transaction.upsert({where:{id:tid},create:{id:tid,clientId:t.id,workspaceId:id,...fields},update:fields});}
  await tx.importBatch.deleteMany({where:{workspaceId:id,source:csvSource,id:{notIn:[...batches.keys()]}}});
  await tx.creditCard.deleteMany({where:{workspaceId:id,id:{notIn:cardIds}}});
  await tx.budgetLine.deleteMany({where:{budget:{workspaceId:id}}});
  await tx.budget.deleteMany({where:{workspaceId:id,id:{notIn:data.budgets.map(b=>entityId(id,'budget',b.id))}}});
  for(const b of data.budgets){const bid=entityId(id,'budget',b.id);await tx.budget.upsert({where:{id:bid},create:{id:bid,clientId:b.id,workspaceId:id,name:b.category,startOn:dateOnly('1970-01-01'),endOn:dateOnly('9999-12-31')},update:{name:b.category}});await tx.budgetLine.create({data:{budgetId:bid,categoryId:categoryId(id,'EXPENSE',b.category),limitMinor:BigInt(b.limit)}});}
  await tx.goal.deleteMany({where:{workspaceId:id,id:{notIn:data.goals.map(g=>entityId(id,'goal',g.id))}}});
  for(const g of data.goals){const gid=entityId(id,'goal',g.id);await tx.goal.upsert({where:{id:gid},create:{id:gid,clientId:g.id,workspaceId:id,name:g.name,targetAmountMinor:BigInt(g.target),cover:g.cover??null,featured:g.featured??false},update:{name:g.name,targetAmountMinor:BigInt(g.target),cover:g.cover??null,featured:g.featured??false}});const movements=await tx.goalMovement.findMany({where:{goalId:gid}});const saved=movements.reduce((sum,m)=>sum+signedMovement(m.kind,m.amountMinor),0n);const difference=BigInt(g.saved)-saved;if(difference!==0n)await tx.goalMovement.create({data:{workspaceId:id,goalId:gid,kind:difference>0n?'ADJUSTMENT_IN':'ADJUSTMENT_OUT',amountMinor:difference>0n?difference:-difference,occurredOn:new Date(),note:'Ajuste do valor reservado no aplicativo'}});}
  await tx.account.deleteMany({where:{workspaceId:id,id:{notIn:data.accounts.map(a=>entityId(id,'account',a.id))}}});
  await tx.auditLog.create({data:{workspaceId:id,actorId:profile.id,action:'workspace.sync',entityType:'Workspace',entityId:id,metadata:{revision:revision+1}}});
  return {revision:revision+1,updatedAt:new Date().toISOString()};
 },{maxWait:10000,timeout:60000});
}
