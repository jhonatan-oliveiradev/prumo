'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowUpRight, CreditCard as CardIcon, Pencil, Plus, Trash2, X} from 'lucide-react';
import {addCreditPurchase, cardColors, creditInvoices, invoiceKey, isCardColor, payCreditInvoice, type CreditCard, type CreditInvoice, type CreditInvoiceRef, type CreditPurchase} from '@/lib/credit';
import {isFinanceData, toCents, validDate, type FinanceData} from '@/lib/finance';
import {AppSelect, DateField} from './form-controls';
import {categoryCatalog} from '@/lib/category-settings';
import {useConfirm} from './confirmation-provider';

const shortDate = (date: string) => date.split('-').reverse().slice(0, 2).join('/');
const invoiceStatus = (invoice: CreditInvoice, today: string) =>
  invoice.payment ? 'Paga' : invoice.dueOn < today ? 'Vencida' : invoice.closesOn <= today ? 'Fechada' : 'Aberta';

export function CreditCardFace({card, invoice, available, format}: {
  card: CreditCard;
  invoice?: CreditInvoice;
  available: number;
  format: (amount: number) => string;
}) {
  return (
    <div className="credit-face" data-card-color={card.color}>
      <div className="credit-face-header"><CardIcon size={21} strokeWidth={1.5} /><span>{card.space === 'work' ? 'Trabalho' : 'Pessoal'}</span></div>
      <div><h3>{card.name}</h3><p>{invoice ? `Vence em ${shortDate(invoice.dueOn)}` : 'Nenhuma fatura em aberto'}</p></div>
      <div className="credit-face-values"><div><small>Próxima fatura</small><strong>{format(invoice?.amount ?? 0)}</strong></div><div><small>{available < 0 ? 'Acima do limite' : 'Limite disponível'}</small><span>{format(Math.abs(available))}</span></div></div>
    </div>
  );
}

export function CreditDueList({invoices, today, format, onOpen}: {
  invoices: CreditInvoice[];
  today: string;
  format: (amount: number) => string;
  onOpen: (ref: CreditInvoiceRef) => void;
}) {
  return <section className="card credit-due">
    <div className="section-title"><h3>Faturas em aberto</h3></div>
    {invoices.map(invoice => (
      <button key={invoiceKey(invoice)} className="credit-due-row" onClick={() => onOpen(invoice)}>
        <span className="category-icon"><CardIcon size={17} /></span>
        <span><strong>{invoice.card.name}</strong><small>{invoiceStatus(invoice, today)} · {shortDate(invoice.dueOn)}</small></span>
        <b>{format(invoice.amount)}</b><ArrowUpRight size={15} />
      </button>
    ))}
  </section>;
}

type Editor =
  | {kind: 'card'; card?: CreditCard}
  | {kind: 'purchase'; purchase?: CreditPurchase}
  | {kind: 'payment'; invoice: CreditInvoice};

export function CreditWallet({data, today, format, initialInvoice, onChange, onAccounts, onImport}: {
  data: FinanceData;
  today: string;
  format: (amount: number) => string;
  initialInvoice: CreditInvoiceRef | null;
  onChange: (data: FinanceData) => boolean;
  onAccounts: () => void;
  onImport: () => void;
}) {
  const confirm = useConfirm();
  const latest = useRef(data);
  useEffect(() => { latest.current = data; }, [data]);
  const [activeId, setActiveId] = useState(initialInvoice?.cardId ?? '');
  const [activeCycle, setActiveCycle] = useState(initialInvoice?.cycle ?? '');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState('');
  const cards = data.creditCards ?? [];
  const card = cards.find(item => item.id === activeId) ?? cards[0];
  const allInvoices = useMemo(() => creditInvoices(data), [data]);
  const invoices = allInvoices.filter(invoice => invoice.cardId === card?.id);
  const open = invoices.filter(invoice => !invoice.payment);
  const active = invoices.find(invoice => invoice.cycle === activeCycle) ?? open[0] ?? invoices.at(-1);
  const available = (card?.limit ?? 0) - open.reduce((sum, invoice) => sum + invoice.amount, 0);
  const hasPurchases = (id: string) => (data.creditPurchases ?? []).some(p => p.cardId === id);
  const settledPurchases = new Set(invoices.filter(invoice => invoice.payment).flatMap(invoice => invoice.items.map(item => item.purchase.id)));
  const title = editor?.kind === 'card' ? (editor.card ? 'Editar cartão' : 'Adicionar cartão') :
    editor?.kind === 'purchase' ? (editor.purchase ? 'Editar compra' : 'Registrar compra') : 'Registrar pagamento';

  function show(next: Editor) {
    setError('');
    setEditor(next);
  }

  function commit(next: FinanceData) {
    if (!isFinanceData(next)) {
      setError('Revise os valores e as datas. Os dados informados não puderam ser salvos.');
      return false;
    }
    if (!onChange(next)) {
      setError('Não foi possível salvar neste dispositivo. Verifique o armazenamento e tente novamente.');
      return false;
    }
    latest.current = next;
    return true;
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const fields = new FormData(event.currentTarget);
    const field = (name: string) => String(fields.get(name) ?? '').trim();
    const current = latest.current;
    try {
      let next: FinanceData;
      let nextCardId: string | undefined;
      if (editor.kind === 'card') {
        const existing = editor.card && current.creditCards?.find(item => item.id === editor.card?.id);
        if (editor.card && !existing) throw Error('Este cartão foi removido. Feche o formulário e atualize a carteira.');
        const locked = existing && current.creditPurchases?.some(p => p.cardId === existing.id);
        const color = field('color');
        if (!isCardColor(color)) throw Error('Escolha uma cor para o cartão.');
        const updated: CreditCard = {
          id: existing?.id ?? crypto.randomUUID(),
          name: field('name'), color, limit: toCents(field('limit')),
          closingDay: locked ? existing.closingDay : Number(field('closingDay')),
          dueDay: locked ? existing.dueDay : Number(field('dueDay')),
          space: locked ? existing.space : field('space') === 'work' ? 'work' : 'personal',
        };
        next = {...current, creditCards: existing ? current.creditCards?.map(item => item.id === updated.id ? updated : item) : [...(current.creditCards ?? []), updated]};
        nextCardId = updated.id;
      } else if (editor.kind === 'purchase') {
        const existing = editor.purchase;
        const date = field('date');
        if (!card || !validDate(date) || date > today) throw Error('Informe a data em que a compra foi feita.');
        if (existing && (!current.creditPurchases?.some(p => p.id === existing.id) ||
          creditInvoices(current).some(invoice => invoice.payment && invoice.items.some(item => item.purchase.id === existing.id)))) {
          throw Error('Esta compra foi alterada ou faz parte de uma fatura paga.');
        }
        const amount = toCents(field('amount'));
        const installments = existing?.statementCycle ? 1 : Number(field('installments'));
        if (!Number.isInteger(installments) || installments < 1 || installments > 60 || amount < installments) {
          throw Error('Escolha de 1 a 60 parcelas de pelo menos R$ 0,01.');
        }
        const draft = {...current, creditPurchases: (current.creditPurchases ?? []).filter(p => p.id !== existing?.id)};
        next = addCreditPurchase(draft, {
          ...existing, id: existing?.id ?? crypto.randomUUID(), cardId: existing?.cardId ?? card.id,
          description: field('description'), amount, date, category: field('category'), installments,
        });
      } else {
        const date = field('date');
        if (!validDate(date) || date > today) throw Error('Informe a data em que o pagamento foi feito.');
        const refreshed = creditInvoices(current).find(invoice => invoiceKey(invoice) === invoiceKey(editor.invoice));
        if (!refreshed || refreshed.payment || refreshed.amount !== editor.invoice.amount) {
          throw Error('A fatura mudou. Feche o formulário e confira o valor atualizado.');
        }
        next = payCreditInvoice(current, editor.invoice, field('account'), date, crypto.randomUUID());
      }
      if (commit(next)) {
        if (nextCardId) setActiveId(nextCardId);
        setEditor(null);
      }
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  async function removePurchase(purchase: CreditPurchase) {
    const accepted = await confirm(`A compra “${purchase.description}” e todas as suas parcelas serão removidas das faturas.`, {
      title: 'Excluir compra?', action: 'Excluir compra', destructive: true,
    });
    if (!accepted) return;
    const current = latest.current;
    if (creditInvoices(current).some(invoice => invoice.payment && invoice.items.some(item => item.purchase.id === purchase.id))) {
      setError('A compra faz parte de uma fatura paga.');
      return;
    }
    commit({...current, creditPurchases: current.creditPurchases?.filter(item => item.id !== purchase.id)});
  }

  async function removeCard(target: CreditCard) {
    if (!await confirm(`O cartão “${target.name}” será removido da carteira.`, {title: 'Excluir cartão?', action: 'Excluir cartão', destructive: true})) return;
    const current = latest.current;
    if (current.creditPurchases?.some(p => p.cardId === target.id)) {
      setError('Exclua as compras em aberto antes de remover o cartão.');
      return;
    }
    commit({...current, creditCards: current.creditCards?.filter(item => item.id !== target.id)});
  }

  async function undoPayment(invoice: CreditInvoice) {
    if (!invoice.payment || !await confirm('A fatura voltará a ficar em aberto e o valor do pagamento será devolvido ao saldo registrado da conta.', {
      title: 'Desfazer registro de pagamento?', action: 'Desfazer pagamento', destructive: true,
    })) return;
    const current = latest.current;
    commit({...current, transactions: current.transactions.filter(t => t.id !== invoice.payment?.id)});
  }

  const editingCard = editor?.kind === 'card' ? editor.card : undefined;
  const editingPurchase = editor?.kind === 'purchase' ? editor.purchase : undefined;
  const locked = Boolean(editingCard && hasPurchases(editingCard.id));
  return <>
    <div className="credit-toolbar">
      <p className="muted">Cadastre seus cartões e registre as compras e os pagamentos que fizer.</p>
      <div className="csv-actions"><button className="secondary" onClick={onImport}>Importar fatura CSV</button><button className="primary" onClick={() => show({kind: 'card'})}><Plus size={17} />Adicionar cartão</button></div>
    </div>
    {!editor && error && <p className="error" role="alert">{error}</p>}
    {card ? <div className="credit-layout">
      <section aria-label="Carteira de cartões" className="credit-wallet-column">
        <div className="credit-card-list" aria-label="Escolher cartão">
          {cards.map(item => <button className="secondary" key={item.id} aria-pressed={item.id === card.id}
            onClick={() => { setActiveId(item.id); setActiveCycle(''); setError(''); }}>{item.name}</button>)}
        </div>
        <CreditCardFace card={card} invoice={open[0]} available={available} format={format} />
        <div className="credit-wallet-actions">
          <button className="primary" onClick={() => show({kind: 'purchase'})}><Plus size={16} />Registrar compra</button>
          <button className="secondary" onClick={() => show({kind: 'card', card})}><Pencil size={15} />Editar cartão</button>
          {!hasPurchases(card.id) && <button className="icon-button" aria-label={`Excluir cartão ${card.name}`} onClick={() => void removeCard(card)}><Trash2 size={16} /></button>}
        </div>
      </section>
      <section className="card credit-invoices" aria-label={`Faturas de ${card.name}`}>
        <div className="section-title"><h2>Faturas</h2></div>
        {active ? <>
          <label>Selecione uma fatura<AppSelect value={active.cycle} onChange={e => setActiveCycle(e.target.value)}>
            {invoices.map(invoice => <option key={invoice.cycle} value={invoice.cycle}>{invoice.dueOn.split('-').reverse().join('/')} · {invoiceStatus(invoice, today)}</option>)}
          </AppSelect></label>
          <div className="credit-invoice-summary">
            <div><span className="muted">{invoiceStatus(active, today)}</span><strong>{format(active.amount)}</strong></div>
            <div><span>{active.closesOn<=today?'Fechou em':'Fecha em'} {shortDate(active.closesOn)}</span><span>{active.dueOn<today?'Venceu em':'Vence em'} {shortDate(active.dueOn)}</span></div>
          </div>
          <div className="credit-items">{active.items.map(({purchase, amount, number}) => (
            <div className="credit-item" key={purchase.id}>
              <div><strong>{purchase.description}</strong><small>{purchase.category} · {shortDate(purchase.date)}{purchase.installments > 1 && ` · ${number}/${purchase.installments}`}</small></div>
              <b>{format(amount)}</b>
              {!settledPurchases.has(purchase.id) && <div className="credit-item-actions">
                <button className="icon-button" aria-label={`Editar compra ${purchase.description}`} onClick={() => show({kind: 'purchase', purchase})}><Pencil size={15} /></button>
                <button className="icon-button" aria-label={`Excluir compra ${purchase.description}`} onClick={() => void removePurchase(purchase)}><Trash2 size={15} /></button>
              </div>}
            </div>
          ))}</div>
          {active.payment ? <button className="text-button" onClick={() => void undoPayment(active)}>Desfazer pagamento registrado</button>
            : active.closesOn > today ? <p className="muted">O pagamento pode ser registrado após o fechamento.</p>
            : data.accounts.length ? <button className="primary" onClick={() => show({kind: 'payment', invoice: active})}>Registrar pagamento</button>
            : <button className="secondary" onClick={onAccounts}>Adicionar conta para registrar pagamento</button>}
        </> : <div className="empty"><CardIcon size={26} /><h3>Nenhuma fatura</h3><p>Registre uma compra para acompanhar o vencimento.</p></div>}
      </section>
    </div> : <section className="card empty"><CardIcon size={30} /><h2>Nenhum cartão cadastrado</h2><p>Adicione um cartão para acompanhar compras, parcelas e faturas.</p></section>}
    <Dialog.Root open={editor !== null} onOpenChange={value => { if (!value) setEditor(null); }}>
      <Dialog.Portal><Dialog.Overlay className="overlay" /><Dialog.Content className="dialog">
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description className="muted">{editor?.kind === 'card' ? 'Use o limite e as datas do seu cartão.' : editor?.kind === 'purchase' ? 'Informe o valor total. O Prumo distribui as parcelas pelas próximas faturas.' : 'Registre aqui o pagamento integral feito no seu banco.'}</Dialog.Description>
        <Dialog.Close className="close icon-button" aria-label="Fechar"><X size={20} /></Dialog.Close>
        <form onSubmit={submit} key={editor?.kind}>
          {editor?.kind === 'card' && <>
            <label>Nome do cartão<input name="name" maxLength={60} required defaultValue={editingCard?.name} placeholder="Ex.: Cartão principal" /></label>
            <label>Limite total (R$)<input name="limit" inputMode="decimal" required defaultValue={editingCard ? (editingCard.limit / 100).toFixed(2) : undefined} /></label>
            <label>Cor<AppSelect name="color" defaultValue={editingCard?.color ?? 'forest'}>{Object.entries(cardColors).map(([id,label]) => <option value={id} key={id}>{label}</option>)}</AppSelect></label>
            <div className="form-grid">
              <label>Dia do fechamento<input name="closingDay" type="number" min="1" max="31" required defaultValue={editingCard?.closingDay ?? 7} disabled={locked} /></label>
              <label>Dia do vencimento<input name="dueDay" type="number" min="1" max="31" required defaultValue={editingCard?.dueDay ?? 15} disabled={locked} /></label>
            </div>
            <label>Espaço<AppSelect name="space" defaultValue={editingCard?.space ?? 'personal'} disabled={locked}><option value="personal">Pessoal</option><option value="work">Trabalho</option></AppSelect></label>
            <small>{locked ? 'As datas e o espaço ficam fixos após a primeira compra para preservar o histórico.' : 'Compras feitas no dia do fechamento entram na fatura seguinte.'}</small>
          </>}
          {editor?.kind === 'purchase' && <>
            <label>Descrição<input name="description" maxLength={100} required defaultValue={editingPurchase?.description} /></label>
            <label>Valor total (R$)<input name="amount" inputMode="decimal" required defaultValue={editingPurchase ? (editingPurchase.amount / 100).toFixed(2) : undefined} /></label>
            <div className="form-grid">
              <label>Data da compra<DateField name="date" required defaultValue={editingPurchase?.date ?? today} /></label>
              <label>Número de parcelas<input name="installments" type="number" min="1" max="60" required defaultValue={editingPurchase?.installments ?? 1} disabled={Boolean(editingPurchase?.statementCycle)} /></label>
            </div>
            <label>Categoria<AppSelect name="category" defaultValue={editingPurchase?.category ?? 'Outros'}>{categoryCatalog(data).map(category => <option key={category}>{category}</option>)}</AppSelect></label>
          </>}
          {editor?.kind === 'payment' && <>
            <p>Valor da fatura <strong>{format(editor.invoice.amount)}</strong></p>
            <label>Conta usada no pagamento<AppSelect name="account" required>{data.accounts.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</AppSelect></label>
            <label>Data do pagamento<DateField name="date" min={editor.invoice.closesOn} required defaultValue={today} /></label>
          </>}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary submit">{editor?.kind === 'card' ? 'Salvar cartão' : editor?.kind === 'purchase' ? 'Salvar compra' : 'Confirmar pagamento registrado'}</button>
        </form>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </>;
}
