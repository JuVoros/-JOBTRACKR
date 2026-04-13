// Server-only component — only imported by /api/generate-pdf route
import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ContactInfo } from './ResumePDF'

const ACCENT = '#7F77DD'
const DARK = '#1a1a1a'
const MUTED = '#666666'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.65,
    color: DARK,
    paddingTop: 52,
    paddingBottom: 52,
    paddingLeft: 56,
    paddingRight: 56,
  },
  headerName: {
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 3,
  },
  headerContact: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 8,
  },
  accentBar: {
    width: 50,
    height: 2,
    backgroundColor: ACCENT,
    marginBottom: 20,
  },
  date: {
    fontSize: 10,
    color: MUTED,
    marginBottom: 18,
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.65,
    color: DARK,
    marginBottom: 12,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  signature: {
    marginTop: 24,
  },
  signatureName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },
})

function stripMd(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/, '').trim()
}

function renderParagraphs(markdown: string) {
  const paragraphs = markdown
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split('\n')
        .map(stripMd)
        .filter(Boolean)
        .join(' ')
    )
    .filter(Boolean)

  return paragraphs.map((p, i) => (
    <Text key={i} style={styles.paragraph}>
      {p}
    </Text>
  ))
}

interface CoverLetterPDFProps {
  content: string
  contactInfo?: ContactInfo
}

export default function CoverLetterPDF({ content, contactInfo }: CoverLetterPDFProps) {
  const contactLine = [contactInfo?.email, contactInfo?.phone, contactInfo?.location]
    .filter(Boolean)
    .join('  |  ')

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        {contactInfo?.fullName ? (
          <Text style={styles.headerName}>{contactInfo.fullName}</Text>
        ) : null}
        {contactLine ? (
          <Text style={styles.headerContact}>{contactLine}</Text>
        ) : null}
        <View style={styles.accentBar} />

        {/* Date */}
        <Text style={styles.date}>{today}</Text>

        {/* Body */}
        {renderParagraphs(content)}

        {/* Signature */}
        {contactInfo?.fullName ? (
          <View style={styles.signature}>
            <Text style={styles.paragraph}>Sincerely,</Text>
            <Text style={styles.signatureName}>{contactInfo.fullName}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
