'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {useRef, useState, type FormEvent} from 'react';
import {applyCsv, importBatches, inspectCsv, validCsvMapping, maxCsvBytes, parseCsv, previewCsv, undoImportBatch, type CsvColumnMapping, type CsvInspection, type CsvPreviewRow, type ImportTarget} from '@/lib/csv-import';
import {money, type FinanceData} from '@/lib/finance';
import {useConfirm} from './confirmation-provider';
import {AppSelect} from './form-controls';
import '@/app/import.css';

type Preview = {
  target: ImportTarget;
  rows: CsvPreviewRow[];
  invalidLines: number[];
  destination: string;
};
type PendingMapping = {
  target: ImportTarget;
  text: string;
  fileName: string;
  destination: string;
  inspection: CsvInspection;
};

const dateLabel = (date: string) => date.split('-').reverse().join('/');
const batchDate = new Intl.DateTimeFormat('pt-BR', {dateStyle: 'short', timeStyle: 'short'});

export function CsvImportDialog({kind, data, month, space, onChange, onClose, restoreFocus}: {
  kind: ImportTarget['kind'];
  data: FinanceData;
  month: string;
  space: string;
  onChange: (data: FinanceData) => boolean;
  onClose: () => void;
  restoreFocus: () => void;
}) {
  const confirm = useConfirm();
  const latest = useRef(data);
  latest.current = data;
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pendingMapping, setPendingMapping] = useState<PendingMapping | null>(null);
  const [mapping, setMapping] = useState<CsvColumnMapping>({date: -1, description: -1, amount: -1});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const card = kind === 'card';
  const destinations = card ? data.creditCards ?? [] : data.accounts;
  const batches = importBatches(data).filter(batch => batch.kind === kind);

  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const file = form.get('file');
      if (!(file instanceof File) || !file.size) throw Error('Escolha um arquivo CSV.');
      if (file.size > maxCsvBytes) throw Error('Escolha um CSV de até 256 KB.');
      const id = String(form.get('destination'));
      const target: ImportTarget = card
        ? {kind, cardId: id, cycle: String(form.get('cycle'))}
        : {kind, accountId: id, space: form.get('space') === 'work' ? 'work' : 'personal'};
      const text = await file.text();
      const inspection = inspectCsv(text);
      const destination = destinations.find(item => item.id === id)?.name ?? '';
      if (!validCsvMapping(inspection.suggested, inspection.headers.length)) {
        // Unknown column names are never guessed or silently discarded.
        setMapping(inspection.suggested);
        setPendingMapping({target, text, fileName: file.name, destination, inspection});
        return;
      }
      const {rows, invalidLines} = parseCsv(text, inspection.suggested);
      const results = await previewCsv(rows, latest.current, target);
      setSelected(new Set(results.filter(row => !row.issue).map(row => row.key)));
      setPendingMapping(null);
      setPreview({target, rows: results, invalidLines, destination});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível ler o arquivo.');
    } finally {
      setBusy(false);
    }
  }

  async function reviewMapped(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingMapping || busy) return;
    setError('');
    if (!validCsvMapping(mapping, pendingMapping.inspection.headers.length)) {
      setError('Escolha três colunas diferentes para data, descrição e valor.');
      return;
    }
    setBusy(true);
    try {
      const {rows, invalidLines} = parseCsv(pendingMapping.text, mapping);
      const results = await previewCsv(rows, latest.current, pendingMapping.target);
      setSelected(new Set(results.filter(row => !row.issue).map(row => row.key)));
      setPreview({target: pendingMapping.target, rows: results, invalidLines, destination: pendingMapping.destination});
      setPendingMapping(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível interpretar as colunas selecionadas.');
    } finally {
      setBusy(false);
    }
  }

  function changeColumn(field: keyof CsvColumnMapping, value: string) {
    setMapping(current => ({...current, [field]: Number(value)}));
    setError('');
  }

  const selectedRows = preview?.rows.filter(row => selected.has(row.key)) ?? [];
  const blockedRows = preview?.rows.filter(row => row.blocked).length ?? 0;
  const spendingTotal = selectedRows.filter(row => row.amount < 0 || preview?.target.kind === 'card')
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const incomeTotal = selectedRows.filter(row => row.amount > 0 && preview?.target.kind === 'bank')
    .reduce((sum, row) => sum + row.amount, 0);

  function commit() {
    if (!preview) return;
    try {
      const next = applyCsv(latest.current, preview.target, preview.rows.filter(row => selected.has(row.key)),
        crypto.randomUUID(), new Date().toISOString(), () => crypto.randomUUID());
      if (!onChange(next)) throw Error('Não foi possível salvar o lote. Verifique o estado dos seus dados e tente novamente.');
      onClose();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  async function remove(id: string) {
    setError('');
    try {
      undoImportBatch(latest.current, id);
      if (!await confirm('Os lançamentos deste lote serão removidos. Revise o saldo ou a fatura após desfazer.', {
        title: 'Desfazer importação?', action: 'Remover lote', destructive: true,
      })) return;
      if (!onChange(undoImportBatch(latest.current, id))) throw Error('Não foi possível remover o lote.');
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="dialog csv-dialog" onCloseAutoFocus={event => {event.preventDefault(); restoreFocus();}}>
          <Dialog.Title>{card ? 'Importar fatura CSV' : 'Importar extrato CSV'}</Dialog.Title>
          <Dialog.Description className="muted">Revise os lançamentos antes de salvar.</Dialog.Description>
          <Dialog.Close className="close icon-button" aria-label="Fechar importação"><X size={20} /></Dialog.Close>
          {preview ? <>
            <div className="csv-summary" role="status">
              <strong>{preview.destination}{preview.target.kind === 'card' && ' · Fechamento ' + preview.target.cycle.split('-').reverse().join('/')}</strong>
              <span>{selected.size} de {preview.rows.length} selecionados · {blockedRows} bloqueados · {preview.rows.filter(row=>selected.has(row.key)&&row.suggestedCategory).length} categorizados por regra</span>
            </div>
            <div className="csv-review-metrics" aria-label="Resumo do lote selecionado">
              <span><small>{card ? 'Compras a importar' : 'Saídas'}</small><strong>{money(spendingTotal)}</strong></span>
              {!card && <span><small>Entradas</small><strong>{money(incomeTotal)}</strong></span>}
              <span><small>Selecionados</small><strong>{selected.size}</strong></span>
            </div>
            {preview.invalidLines.length > 0 && <p className="installment-note">
              Linhas ignoradas por formato inválido: {preview.invalidLines.slice(0, 12).join(', ')}
              {preview.invalidLines.length > 12 && ' e mais ' + (preview.invalidLines.length - 12)}.
            </p>}
            {preview.rows.length > 0 && <div className="csv-bulk-actions">
              <span>Lançamentos do arquivo</span>
              <div><button type="button" className="text-button" onClick={() => setSelected(new Set(preview.rows.filter(row => !row.issue).map(row => row.key)))}>Selecionar sem avisos</button>
                <button type="button" className="text-button" onClick={() => setSelected(new Set())}>Limpar seleção</button></div>
            </div>}
            {preview.rows.length > 0 ? <ul className="csv-rows" aria-label="Lançamentos do arquivo">
              {preview.rows.map(row => <li key={row.key}><label className="csv-row">
                <input type="checkbox" disabled={row.blocked} checked={selected.has(row.key)} onChange={event => {
                  const checked = event.target.checked;
                  setSelected(current => {
                    const next = new Set(current);
                    if (checked) next.add(row.key);
                    else next.delete(row.key);
                    return next;
                  });
                }} />
                <span><strong>{row.description}</strong><small>{dateLabel(row.date)}{row.issue && ' · ' + row.issue}{row.suggestedCategory && ' · Categoria sugerida: ' + row.suggestedCategory}</small></span>
                <span className="csv-amount">{money(row.amount)}</span>
              </label></li>)}
            </ul> : <p className="muted">O arquivo não tem lançamentos válidos.</p>}
            <div className="csv-actions">
              <button type="button" className="secondary" onClick={() => {setPreview(null); setPendingMapping(null); setError('');}}>Escolher outro arquivo</button>
              <button type="button" className="primary" disabled={!selected.size} onClick={commit}>Importar selecionados</button>
            </div>
          </> : pendingMapping ? <>
            <div className="csv-mapping-intro">
              <strong>Identifique as colunas do arquivo</strong>
              <p>Os títulos deste extrato não seguem um padrão reconhecido. Escolha qual coluna corresponde à data, à descrição e ao valor. O Prumo não altera o arquivo original.</p>
              <small>{pendingMapping.fileName} · {pendingMapping.inspection.rowCount} linhas · separador {pendingMapping.inspection.delimiter === '\t' ? 'tabulação' : pendingMapping.inspection.delimiter}</small>
            </div>
            <form onSubmit={reviewMapped} className="csv-mapping-form">
              {([
                ['date', 'Data'],
                ['description', 'Descrição'],
                ['amount', 'Valor'],
              ] as const).map(([field, label]) => <label key={field}>{label}
                <AppSelect value={String(mapping[field])} onChange={event => changeColumn(field, event.target.value)} aria-label={`Coluna de ${label.toLowerCase()}`}>
                  <option value="-1">Escolher coluna</option>
                  {pendingMapping.inspection.headers.map((header, index) => <option key={index} value={String(index)}>{index + 1}. {header || 'Sem título'}</option>)}
                </AppSelect>
              </label>)}
              <section className="csv-mapping-sample" aria-label="Exemplo das linhas do arquivo">
                <h3>Prévia do arquivo</h3>
                <div className="csv-mapping-scroll"><table>
                  <thead><tr>{pendingMapping.inspection.headers.map((header, index) => <th scope="col" key={index}>{header || `Coluna ${index + 1}`}</th>)}</tr></thead>
                  <tbody>{pendingMapping.inspection.sample.map((cells, index) => <tr key={index}>{pendingMapping.inspection.headers.map((_, column) => <td key={column}>{cells[column] ?? ''}</td>)}</tr>)}</tbody>
                </table></div>
              </section>
              <div className="csv-actions">
                <button type="button" className="secondary" onClick={() => {setPendingMapping(null);setError('');}}>Voltar ao arquivo</button>
                <button type="submit" className="primary" disabled={busy || !validCsvMapping(mapping, pendingMapping.inspection.headers.length)}>{busy ? 'Analisando…' : 'Revisar lançamentos'}</button>
              </div>
            </form>
          </> : <>
            {destinations.length > 0 ? <form onSubmit={review}>
              <label>{card ? 'Cartão' : 'Conta'}<AppSelect name="destination" required>
                {destinations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </AppSelect></label>
              {card ? <label>Mês de fechamento<input name="cycle" type="month" defaultValue={month} min="2000-01" max="2099-12" required /></label>
                : <label>Espaço<AppSelect name="space" defaultValue={space === 'work' ? 'work' : 'personal'}>
                  <option value="personal">Pessoal</option><option value="work">Trabalho</option>
                </AppSelect></label>}
              <label>Arquivo CSV<input name="file" type="file" accept=".csv,text/csv" required /></label>
              <p className="muted csv-help">CSV com até 500 linhas. Se os títulos das colunas forem diferentes, você poderá indicar data, descrição e valor na etapa seguinte. {card
                ? 'Inclua o valor de cada parcela nesta fatura. Compras entram no mês selecionado.'
                : 'Use valores negativos para despesas. Os lançamentos entram como pagos ou recebidos.'}</p>
              <button className="primary" disabled={busy}>{busy ? 'Lendo arquivo…' : 'Revisar lançamentos'}</button>
            </form> : <p className="muted">{card ? 'Cadastre um cartão para importar a fatura.' : 'Adicione uma conta para importar o extrato.'}</p>}
            {batches.length > 0 && <section className="csv-history" aria-label="Importações anteriores">
              <h3>Importações anteriores</h3>
              <ul>{batches.map(batch => <li key={batch.id}>
                <span>{batchDate.format(new Date(batch.at))}<small>{batch.count} {batch.count === 1 ? 'lançamento' : 'lançamentos'}</small></span>
                <button className="secondary" type="button" onClick={() => remove(batch.id)}>Desfazer lote</button>
              </li>)}</ul>
            </section>}
          </>}
          {error && <p role="alert" className="error">{error}</p>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
