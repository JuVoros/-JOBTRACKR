// Server-only component — only imported by /api/generate-pdf route
import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

// Harvard/Columbia single-page resume standard:
//   - All black text, no color except subtle gray for dates/contact
//   - Name centered, uppercase, bold
//   - Contact info one line, pipe-separated
//   - Section headers: uppercase bold with full-width rule
//   - Skills: plain text (categorized when possible)
//   - Entries: title left / date flush right, subtitle italic, compact bullets
//   - Tight spacing throughout to maximize single-page density

const BLACK = '#000000'
const DARK = '#1a1a1a'
const MUTED = '#444444'
const RULE_COLOR = '#000000'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: DARK,
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 44,
    paddingRight: 44,
    lineHeight: 1.3,
  },

  header: {
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  contactRow: {
    fontSize: 9,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  headerRule: {
    borderBottomWidth: 1.2,
    borderBottomColor: BLACK,
    borderBottomStyle: 'solid',
    marginTop: 6,
    marginBottom: 0,
  },

  section: {
    marginTop: 7,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingBottom: 1.5,
    borderBottomWidth: 0.75,
    borderBottomColor: RULE_COLOR,
    borderBottomStyle: 'solid',
    marginBottom: 4,
  },

  bodyText: {
    fontSize: 10,
    lineHeight: 1.35,
    color: DARK,
    marginBottom: 1.5,
  },

  // Skills — each category on its own line, or one flat line
  skillsLine: {
    fontSize: 10,
    color: DARK,
    lineHeight: 1.4,
    marginBottom: 1,
  },
  skillsLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: DARK,
  },

  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 0.5,
  },
  entryTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
    flex: 1,
  },
  entryDate: {
    fontSize: 9.5,
    color: MUTED,
    flexShrink: 0,
    marginLeft: 8,
  },
  entrySubtitle: {
    fontSize: 9.5,
    color: MUTED,
    marginBottom: 1.5,
    fontFamily: 'Helvetica-Oblique',
  },

  bullet: {
    flexDirection: 'row',
    marginBottom: 1,
    paddingLeft: 6,
  },
  bulletDot: {
    fontSize: 10,
    width: 9,
    color: DARK,
  },
  bulletText: {
    fontSize: 10,
    flex: 1,
    lineHeight: 1.32,
    color: DARK,
  },

  educationEntry: {
    marginTop: 3,
  },
  educationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  educationInstitution: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
    flex: 1,
  },
  educationYear: {
    fontSize: 9.5,
    color: MUTED,
    flexShrink: 0,
    marginLeft: 8,
  },
  educationDegree: {
    fontSize: 10,
    color: DARK,
    fontFamily: 'Helvetica-Oblique',
  },
  educationDetail: {
    fontSize: 9.5,
    color: MUTED,
    marginTop: 0.5,
  },
})

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContactInfo {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  websiteUrl?: string
}

interface Section {
  title: string
  rawTitle: string
  content: string[]
}

// ── Parser helpers ─────────────────────────────────────────────────────────────

function parseSections(markdown: string): Section[] {
  const sections: Section[] = []
  let current: Section | null = null

  for (const line of markdown.split('\n')) {
    const h2 = line.match(/^##\s+(.+)/)
    if (h2) {
      if (current) sections.push(current)
      const rawTitle = h2[1].trim()
      current = { title: rawTitle.toUpperCase(), rawTitle, content: [] }
      continue
    }
    if (current) current.content.push(line)
  }
  if (current) sections.push(current)
  return sections
}

function stripMd(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
    .replace(/`([^`]+)`/g, '$1')              // `code` → code
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/, '')
    .trim()
}

function splitTitleDate(raw: string): { title: string; date: string } {
  const parts = raw.split('|').map((s) => s.trim())
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]
    if (/\d{4}|present|current|–|—|-/i.test(last)) {
      return { title: parts.slice(0, -1).join(' | '), date: last }
    }
  }
  return { title: raw, date: '' }
}

// ── Skills — categorized lines or flat comma list ────────────────────────────

function SkillsSection({ lines }: { lines: string[] }) {
  const cleaned = lines.filter((l) => l.trim()).map(stripMd)

  // Detect categorized format: lines like "Languages: Python, Java, ..."
  const categorized = cleaned.filter((l) => /^[A-Za-z\s&/]+:\s/.test(l))

  if (categorized.length >= 2) {
    return (
      <View>
        {categorized.map((line, i) => {
          const colonIdx = line.indexOf(':')
          const label = line.slice(0, colonIdx + 1)
          const items = line.slice(colonIdx + 1).trim()
          return (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 0.5 }}>
              <Text style={styles.skillsLabel}>{label} </Text>
              <Text style={styles.skillsLine}>{items}</Text>
            </View>
          )
        })}
      </View>
    )
  }

  // Flat format: join everything, normalize separators to comma-separated
  const flat = cleaned
    .join(', ')
    .replace(/[·•|]/g, ',')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ')

  return <Text style={styles.skillsLine}>{flat}</Text>
}

// ── Projects / Experience entries ─────────────────────────────────────────────

interface Entry {
  title: string
  date: string
  subtitle: string
  bullets: string[]
}

function parseEntries(lines: string[]): Entry[] {
  const entries: Entry[] = []
  let cur: Entry | null = null

  for (const line of lines) {
    if (line.match(/^###\s/)) {
      if (cur) entries.push(cur)
      const raw = stripMd(line)
      const { title, date } = splitTitleDate(raw)
      cur = { title, date, subtitle: '', bullets: [] }
      continue
    }
    // Bold line without ### — treat as new entry heading
    if (!cur && line.trim() && /^\*\*/.test(line.trim())) {
      const raw = stripMd(line)
      const { title, date } = splitTitleDate(raw)
      cur = { title, date, subtitle: '', bullets: [] }
      continue
    }
    if (!cur) continue

    if (line.match(/^[-*]\s/)) {
      cur.bullets.push(stripMd(line.slice(2)))
    } else if (line.trim() && !cur.subtitle && !line.match(/^[-*]\s/)) {
      cur.subtitle = stripMd(line)
    }
  }
  if (cur) entries.push(cur)
  return entries
}

function EntriesSection({ lines }: { lines: string[] }) {
  const entries = parseEntries(lines)

  return (
    <View>
      {entries.map((entry, i) => (
        <View key={i} wrap={false}>
          <View style={styles.entryRow}>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            {entry.date ? <Text style={styles.entryDate}>{entry.date}</Text> : null}
          </View>
          {entry.subtitle ? (
            <Text style={styles.entrySubtitle}>{entry.subtitle}</Text>
          ) : null}
          {entry.bullets.map((b, j) => (
            <View key={j} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

// ── Education section ─────────────────────────────────────────────────────────

function EducationSection({ lines }: { lines: string[] }) {
  // Check for ### heading format first
  const hasH3 = lines.some((l) => l.match(/^###\s/))

  if (hasH3) {
    const entries = parseEntries(lines)
    return (
      <View>
        {entries.map((entry, i) => (
          <View key={i} style={styles.educationEntry} wrap={false}>
            <View style={styles.educationRow}>
              <Text style={styles.educationInstitution}>{entry.title}</Text>
              {entry.date ? <Text style={styles.educationYear}>{entry.date}</Text> : null}
            </View>
            {entry.subtitle ? (
              <Text style={styles.educationDegree}>{entry.subtitle}</Text>
            ) : null}
            {entry.bullets.map((b, j) => (
              <Text key={j} style={styles.educationDetail}>
                {b}
              </Text>
            ))}
          </View>
        ))}
      </View>
    )
  }

  // Flat format: "Degree, Institution, Year" per line
  const cleaned = lines.filter((l) => l.trim()).map(stripMd)

  return (
    <View>
      {cleaned.map((line, i) => {
        const parts = line.split(',').map((s) => s.trim())
        if (parts.length >= 3) {
          const year = parts[parts.length - 1]
          const institution = parts[parts.length - 2]
          const degree = parts.slice(0, parts.length - 2).join(', ')
          return (
            <View key={i} style={styles.educationEntry} wrap={false}>
              <View style={styles.educationRow}>
                <Text style={styles.educationInstitution}>{institution}</Text>
                <Text style={styles.educationYear}>{year}</Text>
              </View>
              <Text style={styles.educationDegree}>{degree}</Text>
            </View>
          )
        }
        if (parts.length === 2) {
          return (
            <View key={i} style={styles.educationEntry} wrap={false}>
              <View style={styles.educationRow}>
                <Text style={styles.educationInstitution}>{parts[0]}</Text>
                <Text style={styles.educationYear}>{parts[1]}</Text>
              </View>
            </View>
          )
        }
        return (
          <Text key={i} style={styles.bodyText}>
            {line}
          </Text>
        )
      })}
    </View>
  )
}

// ── Generic section (fallback) ────────────────────────────────────────────────

function GenericSection({ lines }: { lines: string[] }) {
  const hasH3 = lines.some((l) => l.match(/^###\s/))

  if (hasH3) return <EntriesSection lines={lines} />

  return (
    <View>
      {lines
        .filter((l) => l.trim())
        .map((line, i) => {
          if (line.match(/^[-*]\s/)) {
            return (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{stripMd(line.slice(2))}</Text>
              </View>
            )
          }
          return (
            <Text key={i} style={styles.bodyText}>
              {stripMd(line)}
            </Text>
          )
        })}
    </View>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ResumePDFProps {
  content: string
  contactInfo?: ContactInfo
}

export default function ResumePDF({ content, contactInfo }: ResumePDFProps) {
  const sections = parseSections(content)

  const contactParts = [
    contactInfo?.email,
    contactInfo?.phone,
    contactInfo?.location,
    contactInfo?.websiteUrl,
  ].filter(Boolean)

  const contactLine = contactParts.join('  |  ')

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {contactInfo?.fullName ? (
            <Text style={styles.name}>{contactInfo.fullName}</Text>
          ) : null}
          {contactLine ? (
            <Text style={styles.contactRow}>{contactLine}</Text>
          ) : null}
        </View>
        <View style={styles.headerRule} />

        {/* Body sections */}
        {sections.map((section, idx) => {
          const t = section.title

          if (t === 'CONTACT') return null

          if (t === 'SUMMARY' || t === 'PROFESSIONAL SUMMARY' || t === 'OBJECTIVE') {
            const text = section.content
              .filter((l) => l.trim())
              .map(stripMd)
              .join(' ')
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionHeader}>SUMMARY</Text>
                <Text style={styles.bodyText}>{text}</Text>
              </View>
            )
          }

          if (t === 'SKILLS' || t === 'TECHNICAL SKILLS' || t === 'CORE COMPETENCIES') {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionHeader}>SKILLS</Text>
                <SkillsSection lines={section.content} />
              </View>
            )
          }

          if (
            t.includes('PROJECT') ||
            t.includes('EXPERIENCE') ||
            t.includes('WORK') ||
            t.includes('EMPLOYMENT')
          ) {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionHeader}>{t}</Text>
                <EntriesSection lines={section.content} />
              </View>
            )
          }

          if (t === 'EDUCATION' || t.includes('EDUCATION')) {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionHeader}>EDUCATION</Text>
                <EducationSection lines={section.content} />
              </View>
            )
          }

          if (t === 'CERTIFICATIONS' || t === 'AWARDS' || t === 'PUBLICATIONS') {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionHeader}>{t}</Text>
                <GenericSection lines={section.content} />
              </View>
            )
          }

          return (
            <View key={idx} style={styles.section}>
              <Text style={styles.sectionHeader}>{t}</Text>
              <GenericSection lines={section.content} />
            </View>
          )
        })}
      </Page>
    </Document>
  )
}
