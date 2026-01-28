'use client'

interface WatermarkProps {
  userId: string
}

export function Watermark({ userId }: WatermarkProps) {
  // Create a short hash of the user ID for the watermark
  const shortId = userId.slice(0, 8)
  
  return (
    <div className="watermark font-mono select-none">
      SV-{shortId}
    </div>
  )
}
