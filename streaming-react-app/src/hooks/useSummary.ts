import {useCallback, useState} from 'react'
import {generateSummary, type SummaryResult} from '@/summarization/generateSummary'

type TargetLang = 'eng' | 'cmn' | 'spa'

export function useSummary() {
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (translatedText: string, targetLanguage: TargetLang) => {
    setIsGeneratingSummary(true)
    setError(null)
    try {
      const result = await generateSummary(translatedText, targetLanguage)
      setSummaryResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate summary')
    } finally {
      setIsGeneratingSummary(false)
    }
  }, [])

  const clear = useCallback(() => {
    setSummaryResult(null)
    setError(null)
  }, [])

  return {
    summaryResult,
    isGeneratingSummary,
    error,
    generate: run,
    clear,
    setSummaryResult,
  }
}


