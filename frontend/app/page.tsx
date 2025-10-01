"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

export default function Home() {
  const [isConversationActive, setIsConversationActive] = useState(false)

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
  ]

  return (
    <main className="min-h-screen flex items-center justify-center bg-background pb-12">
      <div className="flex flex-col items-center gap-8 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/ease-logo-with-tagline.png"
            alt="Ease Medical Translations"
            width={1500}
            height={500}
            className="w-auto h-[400px]"
            priority
          />
        </div>

        {/* Language Selection */}
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Input Language</label>
            <Select defaultValue="en">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select input language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Output Language</label>
            <Select defaultValue="es">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select output language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Start/Stop Button */}
        <Button
          size="lg"
          className={`w-full font-medium ${
            isConversationActive
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
          onClick={() => setIsConversationActive(!isConversationActive)}
        >
          {isConversationActive ? "Stop Conversation" : "Start Conversation"}
        </Button>
      </div>
    </main>
  )
}
