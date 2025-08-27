"use client";

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileX, ArrowLeft } from 'lucide-react'
import { Link, useLocation } from 'wouter'

interface ContentNotFoundProps {
  title?: string
  description?: string
  linkText?: string
  linkPath?: string
  showBackButton?: boolean
}

export default function ContentNotFound({
  title = "Content Not Found",
  description = "The content you're looking for doesn't exist or has been removed.",
  linkText = "Go to My Content",
  linkPath = "/my-content",
  showBackButton = false
}: ContentNotFoundProps) {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardContent className="pt-12 pb-8">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 bg-zinc-800 rounded-full">
                <FileX className="w-12 h-12 text-zinc-400" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white" data-testid="text-not-found-title">
                {title}
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed" data-testid="text-not-found-description">
                {description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Link href={linkPath}>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-go-to-content"
                >
                  {linkText}
                </Button>
              </Link>
              
              {showBackButton && (
                <Button 
                  variant="outline" 
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  onClick={() => window.history.back()}
                  data-testid="button-go-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}