"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, MicOff, Volume2, Copy, RotateCcw } from "lucide-react"

export function TranslationInterface() {
  const [isListening, setIsListening] = useState(false)
  const [sourceLanguage, setSourceLanguage] = useState("english")
  const [targetLanguage, setTargetLanguage] = useState("spanish")
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")

  const handleMicToggle = () => {
    setIsListening(!isListening)
  }

  const handleSwapLanguages = () => {
    const temp = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(temp)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/ease-logo.jpg" alt="Ease" width={120} height={48} className="h-12 w-auto" />
          </div>
          <nav className="flex items-center gap-6">
            <Button variant="ghost" size="sm">
              History
            </Button>
            <Button variant="ghost" size="sm">
              Settings
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Translation Interface */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2 text-balance">Real-time Medical Translation</h1>
          <p className="text-muted-foreground">
            Instant, simultaneous translations for seamless healthcare communication
          </p>
        </div>

        {/* Translation Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Source Language Card */}
          <Card className="p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="mandarin">Mandarin</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                  <SelectItem value="arabic">Arabic</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="portuguese">Portuguese</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMicToggle}
                className={isListening ? "text-primary" : ""}
              >
                {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
            </div>
            <Textarea
              placeholder="Speak or type your message..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[200px] resize-none bg-background text-base"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">{sourceText.length} characters</span>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(sourceText)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </Card>

          {/* Target Language Card */}
          <Card className="p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="mandarin">Mandarin</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                  <SelectItem value="arabic">Arabic</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="portuguese">Portuguese</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon">
                <Volume2 className="h-5 w-5" />
              </Button>
            </div>
            <Textarea
              placeholder="Translation appears here..."
              value={translatedText}
              readOnly
              className="min-h-[200px] resize-none bg-muted/30 text-base"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">{translatedText.length} characters</span>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(translatedText)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="lg" onClick={handleSwapLanguages} className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Swap Languages
          </Button>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
            Start Translation
          </Button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card className="p-6 text-center bg-card">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Instant Translation</h3>
            <p className="text-sm text-muted-foreground">
              Real-time, simultaneous translation powered by advanced AI technology
            </p>
          </Card>

          <Card className="p-6 text-center bg-card">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Medical Accuracy</h3>
            <p className="text-sm text-muted-foreground">
              Specialized for healthcare with medical terminology and context understanding
            </p>
          </Card>

          <Card className="p-6 text-center bg-card">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Human Connection</h3>
            <p className="text-sm text-muted-foreground">
              Preserve the personal touch while eliminating language barriers
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
