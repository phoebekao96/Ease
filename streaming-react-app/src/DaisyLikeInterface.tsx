import {useEffect, useRef, useState, useCallback} from 'react'
import {StreamingController} from '@/controllers/StreamingController'
import {Button} from '@/components/ui/button'
import DaisyButton from '@/components/DaisyButton'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {useSummary} from '@/hooks/useSummary'

type TargetLang = 'eng' | 'cmn' | 'spa'

const LANGUAGE_OPTIONS: Array<{code: TargetLang; label: string}> = [
  {code: 'eng', label: 'English'},
  {code: 'cmn', label: 'Mandarin (cmn)'},
  {code: 'spa', label: 'Spanish'},
]

export default function DaisyLikeInterface() {
  const controllerRef = useRef<StreamingController | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const [targetLang, setTargetLang] = useState<TargetLang>('eng')
  const [transcript, setTranscript] = useState<string>('')
  const [preempted, setPreempted] = useState<boolean>(false)
  const {summaryResult, isGeneratingSummary, error: summaryError, generate, clear} = useSummary()

  // Init client once
  useEffect(() => {
    const ctl = new StreamingController()
    controllerRef.current = ctl

    const unsubStatus = ctl.on('status', (s) => setStatus(s))
    const unsubText = ctl.on('text', (t) => setTranscript((prev) => prev + t))
    const unsubPreempt = ctl.on('preempted', () => setPreempted(true))

    ctl
      .init(targetLang)
      .catch((e) => console.error('StreamingController init failed', e))

    return () => {
      unsubStatus()
      unsubText()
      unsubPreempt()
      ctl.destroy()
      controllerRef.current = null
    }
  }, [])

  // Reflect target language changes to server
  useEffect(() => {
    const ctl = controllerRef.current
    if (!ctl) return
    if (targetLang) ctl.setTargetLanguage(targetLang)
  }, [targetLang])

  const start = useCallback(async () => {
    try {
      setTranscript('')
      clear()
      await controllerRef.current?.start()
    } catch (e) {
      console.error('start failed', e)
    }
  }, [])

  const stop = useCallback(async () => {
    try {
      await controllerRef.current?.stop()
    } catch (e) {
      console.error('stop failed', e)
    } finally {
      // Trigger summarization after stopping
      if (transcript.trim().length > 0) {
        generate(transcript, targetLang)
      }
    }
  }, [transcript, targetLang, generate])

  const handleCopyTranscript = () => {
    if (!transcript) return
    navigator.clipboard.writeText(transcript).catch(() => {})
  }

  const handleCopySummary = () => {
    const s = summaryResult
    if (!s) return
    const text = `After Visit Note\n\nInstructions\n${s.instructions
      .map((i) => `- ${i}`)
      .join('\n')}\n\nMedication List\n${s.medicationList
      .map((m) => `- ${m}`)
      .join('\n')}\n\nPatient Summary\n${s.patientSummary}\n\nRecommendations\n${s.recommendations
      .map((r) => `- ${r}`)
      .join('\n')}\n\nStanding Order\n${s.standingOrder}`
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const handleDownload = () => {
    let content = `Translated Text (${targetLang}):\n${transcript}`
    if (summaryResult) {
      const s = summaryResult
      const summaryText = `\n\nAfter Visit Summary\n\nInstructions\n${s.instructions
        .map((i) => `- ${i}`)
        .join('\n')}\n\nMedication List\n${s.medicationList
        .map((m) => `- ${m}`)
        .join('\n')}\n\nPatient Summary\n${s.patientSummary}\n\nRecommendations\n${s.recommendations
        .map((r) => `- ${r}`)
        .join('\n')}\n\nStanding Order\n${s.standingOrder}`
      content += summaryText
    }
    const blob = new Blob([content], {type: 'text/plain'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcription.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // const canStart = status !== 'running' && !!targetLang
  const canStop = status === 'running'

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor: '#e2eff4'}}>
      <header className="w-full py-4 px-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="font-semibold text-slate-700">Daisy Medical Translation</div>
          <div className="text-sm text-slate-500">Status: {status}{preempted ? ' • Preempted' : ''}</div>
        </div>
      </header>

      <main className="flex-1 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-slate-800">Controls</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={targetLang} onValueChange={(v) => setTargetLang(v as TargetLang)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Target language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.code} value={opt.code}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-col items-center">
                  <DaisyButton isActive={canStop} onToggle={() => (canStop ? stop() : start())} />
                  <div className="mt-2 text-sm font-medium text-slate-700">
                    {canStop ? 'Stop' : 'Start'}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle className="text-slate-800">Translated Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap border border-slate-200 rounded-md p-3 min-h-[160px] text-slate-700">
                {transcript}
              </div>
              <div className="mt-3 flex gap-3">
                <Button variant="outline" onClick={handleCopyTranscript} disabled={!transcript}>
                  Copy Transcript
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={!transcript}>
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {(isGeneratingSummary || summaryResult || summaryError) && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-slate-800">After Visit Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {isGeneratingSummary && (
                  <div className="text-slate-700">Generating summary…</div>
                )}
                {summaryError && (
                  <div className="text-red-700">{summaryError}</div>
                )}
                {summaryResult && !isGeneratingSummary && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Instructions</h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {summaryResult.instructions.map((i, idx) => (
                          <li key={idx}>{i}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Medication List</h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {summaryResult.medicationList.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Patient Summary</h4>
                      <p className="text-slate-700">{summaryResult.patientSummary}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Recommendations</h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {summaryResult.recommendations.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Standing Order</h4>
                      <p className="text-slate-700">{summaryResult.standingOrder}</p>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" onClick={handleCopySummary}>
                        Copy Summary
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="w-full py-4 px-4">
        <div className="mx-auto max-w-4xl text-center text-xs text-slate-500">
          Designed for healthcare professionals • Secure & HIPAA compliant
        </div>
      </footer>
    </div>
  )
}


