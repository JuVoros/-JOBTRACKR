import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import type { JSXElementConstructor, ReactElement } from 'react'
import { createClient } from '../../lib/supabase/server'
import ResumePDF from '../../Components/resume/ResumePDF'
import CoverLetterPDF from '../../Components/resume/CoverLetterPDF'

// renderToBuffer's type signature requires ReactElement<DocumentProps> but our
// wrapper components are opaque to TypeScript. Cast through unknown to satisfy
// the constraint — the runtime shape is correct because both components render
// a @react-pdf/renderer <Document> at their root.
function asPdfElement(
  el: React.ReactElement
): ReactElement<DocumentProps, string | JSXElementConstructor<unknown>> {
  return el as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
}

export interface PdfRequestBody {
  content: string
  type: 'resume' | 'cover_letter'
  company: string
  role: string
  contactInfo?: {
    fullName?: string
    email?: string
    phone?: string
    location?: string
    websiteUrl?: string
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  // Auth check — never expose PDF generation to unauthenticated users
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PdfRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.content || !body.type || !body.company || !body.role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const element =
      body.type === 'cover_letter'
        ? React.createElement(CoverLetterPDF, {
            content: body.content,
            contactInfo: body.contactInfo,
          })
        : React.createElement(ResumePDF, {
            content: body.content,
            contactInfo: body.contactInfo,
          })

    const buffer = await renderToBuffer(asPdfElement(element))
    // NextResponse BodyInit requires Uint8Array, not Node Buffer
    const bytes = new Uint8Array(buffer)

    const prefix = body.type === 'cover_letter' ? 'cover-letter' : 'resume'
    const filename = `${prefix}-${slugify(body.company)}-${slugify(body.role)}.pdf`

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': bytes.length.toString(),
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json(
      { error: 'PDF generation failed', detail: String(err) },
      { status: 500 }
    )
  }
}
