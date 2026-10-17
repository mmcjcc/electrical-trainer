/**
 * Settings (/settings): the NEC edition, codebook hints, calculator keys, exam-simulator hints, the
 * Test-me timer, the exam date, export/import of progress (merge or replace), reset (with a confirm)
 * and, behind the platform's sign-in, a Sign out link.
 */
import { useId, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { InlineConfirm } from '@/components/question/InlineConfirm'
import { btnDanger, btnPrimary, btnSecondary, card, link, PageHeader, RadioGroup, Switch } from '@/components/question/ui'
import type { NecEdition } from '@/shared/types'
import { dayKey, relativeDays, useStore, type ImportMode } from '@/store'
import { A2HSCard } from './Home'

/**
 * The platform's sign-out URL (public/config.js, written by the container). It points at the auth
 * host, so it is a plain link, never a form (the CSP's form-action is 'self'). Only http(s) URLs and
 * site paths are used, so a bad config cannot plant a script URL.
 */
function signOutUrl(): string {
  const url = typeof window === 'undefined' ? '' : (window.__ET_CONFIG__?.signOutUrl ?? '').trim()
  return /^(https?:\/\/|\/(?![/\\]))/i.test(url) ? url : ''
}

export default function Settings() {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const storageOk = useStore((s) => s.storageOk)
  const signOut = signOutUrl()
  const dateId = useId()

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Settings" />

      <section aria-labelledby="set-exam" className={`${card} space-y-4`}>
        <h2 id="set-exam" className="text-lg font-bold text-ink">
          Your exam
        </h2>
        <RadioGroup<NecEdition>
          legend="NEC edition"
          value={settings.edition}
          onChange={(edition) => setSettings({ edition })}
          stacked
          options={[
            { value: '2020', label: '2020 NEC', note: 'The Maryland exam uses this one today (PSI bulletin).' },
            { value: '2023', label: '2023 NEC', note: 'Only if your exam uses it. Locations we have not checked for 2023 are left out.' },
            { value: '2026', label: '2026 NEC', note: 'Only if your exam uses it. Maryland is expected to move to it; no date yet. Its locations are not mapped yet.' },
          ]}
        />
        <div>
          <label htmlFor={dateId} className="font-semibold text-ink">
            Exam date
          </label>
          <p className="text-sm text-slate">For the countdown on Home. Leave it empty if you have not booked.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              id={dateId}
              type="date"
              value={settings.examDate ?? ''}
              onChange={(e) => setSettings({ examDate: /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) ? e.target.value : undefined })}
              className="min-h-11 rounded-xl border-2 border-slate-100 bg-white px-3 text-ink"
            />
            {settings.examDate && (
              <button type="button" onClick={() => setSettings({ examDate: undefined })} className={btnSecondary}>
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="set-practice" className={`${card} space-y-1`}>
        <h2 id="set-practice" className="text-lg font-bold text-ink">
          Practice
        </h2>
        <div className="divide-y divide-slate-100">
          <Switch
            label="Codebook hints in practice"
            description="A “Where is it in the book?” button on each question: the chapter, then the article, then the exact section. Using it is recorded, never counted as wrong."
            checked={settings.bookHints === 'button'}
            onChange={(on) => setSettings({ bookHints: on ? 'button' : 'off' })}
          />
          <div className="py-3">
            <RadioGroup<'hint' | 'always'>
              legend="Calculator keys on worksheet lines"
              value={settings.keys}
              onChange={(keys) => setSettings({ keys })}
              stacked
              options={[
                { value: 'hint', label: 'As a hint', note: 'Hidden until you ask, or until a slip shows the numbers were right but the keys were not.' },
                { value: 'always', label: 'Always shown', note: 'The keystrokes sit under every calculation line.' },
              ]}
            />
          </div>
          <Switch
            label="Test-me timer"
            description="A clock on each Test-me problem at the exam's pace, about 2.7 minutes a question."
            checked={settings.testTimer}
            onChange={(testTimer) => setSettings({ testTimer })}
          />
          <Switch
            label="Book hints in the exam simulator"
            description="Off is real exam conditions. This is the starting choice; you can still change it before each exam."
            checked={settings.examHints}
            onChange={(examHints) => setSettings({ examHints })}
          />
        </div>
      </section>

      <BackupSection />

      {!storageOk && (
        <p role="alert" className="rounded-xl border-2 border-bad bg-bad-100 p-3 font-semibold text-ink">
          <span aria-hidden="true">✗ </span>
          This browser is blocking saves right now, so progress disappears when you close it. Export a backup before you go.
        </p>
      )}
      <A2HSCard force />

      <ResetSection />

      {signOut && (
        <section aria-labelledby="set-account" className={card}>
          <h2 id="set-account" className="text-lg font-bold text-ink">
            Signed in
          </h2>
          <p className="mt-0.5 text-sm text-slate">Signing out keeps your progress on this device.</p>
          <a href={signOut} className={`${btnSecondary} mt-3`}>
            Sign out
          </a>
        </section>
      )}

      <p className="text-center text-sm">
        <Link to="/about" className={link}>
          About the exam and this app
        </Link>
      </p>
    </div>
  )
}

type Result = { ok: boolean; message: string }

function BackupSection() {
  const exportJson = useStore((s) => s.exportJson)
  const importJson = useStore((s) => s.importJson)
  const lastBackupAt = useStore((s) => s.meta.lastBackupAt)
  const [exportText, setExportText] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [importText, setImportText] = useState('')
  const [mode, setMode] = useState<ImportMode>('merge')
  const [result, setResult] = useState<Result | null>(null)
  const exportRef = useRef<HTMLTextAreaElement>(null)
  const exportId = useId()
  const importId = useId()
  const fileId = useId()

  const lastMs = lastBackupAt ? Date.parse(lastBackupAt) : Number.NaN
  const lastLine = Number.isFinite(lastMs) ? `Last backup: ${relativeDays(lastMs)}.` : 'No backup from this device yet.'

  function download() {
    const json = exportJson()
    try {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `electrician-progress-${dayKey(Date.now())}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExportStatus('Backup file saved. Keep it somewhere safe, or import it on your other device.')
    } catch {
      setExportText(json)
      setExportStatus('This browser blocked the download, so the backup text is below. Copy it somewhere safe.')
    }
  }

  async function copy() {
    if (exportText === null) return
    try {
      await navigator.clipboard.writeText(exportText)
      setExportStatus('Copied. Paste it into a note, or into Import on your other device.')
    } catch {
      exportRef.current?.focus()
      exportRef.current?.select()
      setExportStatus('Copying is blocked here, so the text is selected: long-press and tap Copy, or press Ctrl+C.')
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImportText(await file.text())
      setResult(null)
    } catch {
      setResult({ ok: false, message: 'That file could not be read. Open it and paste the text into the box instead.' })
    }
  }

  function runImport() {
    if (!importText.trim()) {
      setResult({ ok: false, message: 'Choose a backup file or paste the backup text first.' })
      return
    }
    const r = importJson(importText, mode)
    if (!r.ok) {
      setResult({ ok: false, message: `That backup could not be imported. ${r.error}` })
      return
    }
    const items = `${r.added} ${r.added === 1 ? 'record' : 'records'}`
    setResult({
      ok: true,
      message:
        mode === 'merge'
          ? r.added === 0
            ? 'Merged. Nothing new: this device already had everything in that backup.'
            : `Merged: ${items} added.`
          : `Replaced: this device now holds the backup's progress (${items}).`,
    })
  }

  return (
    <section aria-labelledby="set-backup" className={`${card} space-y-4`}>
      <div>
        <h2 id="set-backup" className="text-lg font-bold text-ink">
          Your progress lives on this device
        </h2>
        <p className="mt-0.5 text-sm text-slate">
          Nothing is sent anywhere. Export a backup to keep a copy, or to carry it between your phone and a computer.
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">{lastLine}</p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-ink">Export</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={download} className={btnPrimary}>
            Save a backup file
          </button>
          <button
            type="button"
            onClick={() => {
              setExportText(exportJson())
              setExportStatus(null)
            }}
            className={btnSecondary}
          >
            Show backup text
          </button>
        </div>
        {exportText !== null && (
          <div className="space-y-2">
            <label htmlFor={exportId} className="block text-sm font-semibold text-ink">
              Backup text
            </label>
            <textarea id={exportId} ref={exportRef} readOnly value={exportText} rows={5} className="w-full rounded-xl border-2 border-slate-100 p-2 font-mono text-xs text-ink" />
            <button type="button" onClick={() => void copy()} className={btnSecondary}>
              Copy
            </button>
          </div>
        )}
        <p role="status" className="text-sm text-ink">
          {exportStatus && (
            <>
              <span aria-hidden="true" className="text-ok">
                ✓{' '}
              </span>
              {exportStatus}
            </>
          )}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-ink">Import</h3>
        <div>
          <label htmlFor={fileId} className="block text-sm font-semibold text-ink">
            Backup file
          </label>
          <input
            id={fileId}
            type="file"
            accept="application/json,.json"
            onChange={(e) => void onFile(e)}
            className="mt-1 block min-h-11 w-full text-sm text-ink file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-slate-50 file:px-4 file:font-semibold file:text-ink"
          />
        </div>
        <div>
          <label htmlFor={importId} className="block text-sm font-semibold text-ink">
            …or paste the backup text
          </label>
          <textarea
            id={importId}
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value)
              setResult(null)
            }}
            rows={4}
            spellCheck={false}
            className="mt-1 w-full rounded-xl border-2 border-slate-100 p-2 font-mono text-xs text-ink"
          />
        </div>
        <RadioGroup<ImportMode>
          legend="How to import"
          value={mode}
          onChange={setMode}
          stacked
          options={[
            { value: 'merge', label: 'Merge with this device', note: 'Keeps everything from both. Use this to combine a phone and a computer.' },
            { value: 'replace', label: "Replace this device's progress", note: 'Wipes the progress here first, then loads the backup. Your settings come from the backup too.' },
          ]}
        />
        <button type="button" onClick={runImport} className={btnPrimary}>
          {mode === 'merge' ? 'Import and merge' : 'Replace my progress'}
        </button>
        {result &&
          (result.ok ? (
            <p role="status" className="text-sm font-semibold text-ok">
              <span aria-hidden="true">✓ </span>
              {result.message}
            </p>
          ) : (
            <p role="alert" className="text-sm font-semibold text-bad">
              <span aria-hidden="true">✗ </span>
              {result.message}
            </p>
          ))}
      </div>
    </section>
  )
}

function ResetSection() {
  const resetProgress = useStore((s) => s.resetProgress)
  const toast = useStore((s) => s.toast)
  const [confirming, setConfirming] = useState(false)
  return (
    <section aria-labelledby="set-reset" className={`${card} space-y-3`}>
      <h2 id="set-reset" className="text-lg font-bold text-ink">
        Reset progress
      </h2>
      <p className="text-sm text-slate">Clears every answer, review box, recipe record, exam and streak on this device. Your settings stay.</p>
      {confirming ? (
        <InlineConfirm
          title="Reset all progress?"
          confirmLabel="Yes, reset everything"
          cancelLabel="Keep my progress"
          tone="danger"
          onConfirm={() => {
            resetProgress()
            setConfirming(false)
            toast('Progress reset. A fresh start.', 'info')
          }}
          onCancel={() => setConfirming(false)}
        >
          <p>This cannot be undone. If you might want it back, save a backup above first.</p>
        </InlineConfirm>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={btnDanger}>
          Reset progress…
        </button>
      )}
    </section>
  )
}
