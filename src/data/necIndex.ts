/**
 * The shape of the code book, for the "where is it in the book?" hint ladder: chapters, the articles
 * an exam touches, and the parts of the big articles. Titles are short descriptive names in our own
 * words where the official title is long. Pure data plus one function, `bookHint`.
 */
import type { BookHint, CodeRef, NecEdition } from '@/shared/types'

export const CHAPTERS: Record<string, string> = {
  '1': 'Chapter 1: General',
  '2': 'Chapter 2: Wiring and Protection',
  '3': 'Chapter 3: Wiring Methods and Materials',
  '4': 'Chapter 4: Equipment for General Use',
  '5': 'Chapter 5: Special Occupancies',
  '6': 'Chapter 6: Special Equipment',
  '7': 'Chapter 7: Special Conditions',
  '8': 'Chapter 8: Communications Systems',
  '9': 'Chapter 9: Tables (at the back, after Article 840)',
}

interface ArticleInfo {
  title: string
  /** Tab tip: where it sits and what to look for. */
  tip?: string
  /** Parts, by first and last section number (the integer after the dot). */
  parts?: { part: string; title: string; from: number; to: number }[]
  /** Only in these editions (omit when in both). */
  editions?: NecEdition[]
}

export const ARTICLES: Record<string, ArticleInfo> = {
  '90': { title: 'Introduction', tip: 'The very first pages, before Chapter 1.' },
  '100': { title: 'Definitions', tip: 'Alphabetical. Most exam definitions are here.' },
  '110': {
    title: 'Requirements for Electrical Installations',
    tip: 'Working space (110.26) and terminal temperature limits (110.14(C)) are here.',
    parts: [
      { part: 'Part I', title: 'General', from: 1, to: 25 },
      { part: 'Part II', title: '1000 Volts, Nominal, or Less', from: 26, to: 29 },
      { part: 'Part III', title: 'Over 1000 Volts, Nominal', from: 30, to: 41 },
    ],
  },
  '200': { title: 'Use and Identification of Grounded Conductors' },
  '210': {
    title: 'Branch Circuits',
    tip: 'GFCI is 210.8, AFCI 210.12, required outlets 210.50 onward.',
    parts: [
      { part: 'Part I', title: 'General Provisions', from: 1, to: 13 },
      { part: 'Part II', title: 'Branch-Circuit Ratings', from: 17, to: 25 },
      { part: 'Part III', title: 'Required Outlets', from: 50, to: 71 },
    ],
  },
  '215': { title: 'Feeders' },
  '220': {
    title: 'Branch-Circuit, Feeder, and Service Load Calculations',
    tip: 'Early in Chapter 2, right after 215 Feeders. Tab it: you will be here for every load calculation.',
    parts: [
      { part: 'Part I', title: 'General', from: 1, to: 5 },
      { part: 'Part II', title: 'Branch-Circuit Load Calculations', from: 10, to: 18 },
      { part: 'Part III', title: 'Feeder and Service Load Calculations (the standard method)', from: 40, to: 61 },
      { part: 'Part IV', title: 'Optional Feeder and Service Load Calculations', from: 80, to: 88 },
      { part: 'Part V', title: 'Farm Load Calculations', from: 100, to: 103 },
    ],
  },
  '225': { title: 'Outside Branch Circuits and Feeders' },
  '230': {
    title: 'Services',
    parts: [
      { part: 'Part I', title: 'General', from: 1, to: 10 },
      { part: 'Part II', title: 'Overhead Service Conductors', from: 22, to: 29 },
      { part: 'Part III', title: 'Underground Service Conductors', from: 30, to: 33 },
      { part: 'Part IV', title: 'Service-Entrance Conductors', from: 40, to: 56 },
      { part: 'Part V', title: 'Service Equipment: General', from: 62, to: 67 },
      { part: 'Part VI', title: 'Service Equipment: Disconnecting Means', from: 70, to: 85 },
      { part: 'Part VII', title: 'Service Equipment: Overcurrent Protection', from: 90, to: 95 },
    ],
  },
  '240': {
    title: 'Overcurrent Protection',
    tip: 'Standard ampere ratings are in 240.6(A); the small-conductor rule is 240.4(D); taps are 240.21.',
    parts: [
      { part: 'Part I', title: 'General', from: 1, to: 13 },
      { part: 'Part II', title: 'Location', from: 21, to: 24 },
      { part: 'Part VII', title: 'Circuit Breakers', from: 80, to: 88 },
    ],
  },
  '242': { title: 'Overvoltage Protection' },
  '250': {
    title: 'Grounding and Bonding',
    tip: 'The middle of Chapter 2 and the most-tabbed article in the book. The three sizing tables are 250.66, 250.102(C)(1) and 250.122.',
    parts: [
      { part: 'Part I', title: 'General', from: 1, to: 12 },
      { part: 'Part II', title: 'System Grounding', from: 20, to: 38 },
      { part: 'Part III', title: 'Grounding Electrode System and Grounding Electrode Conductor', from: 50, to: 70 },
      { part: 'Part IV', title: 'Enclosure, Raceway, and Service Cable Connections', from: 80, to: 86 },
      { part: 'Part V', title: 'Bonding', from: 90, to: 106 },
      { part: 'Part VI', title: 'Equipment Grounding and Equipment Grounding Conductors', from: 109, to: 126 },
      { part: 'Part VII', title: 'Methods of Equipment Grounding', from: 130, to: 148 },
      { part: 'Part VIII', title: 'Direct-Current Systems', from: 160, to: 169 },
    ],
  },
  '300': { title: 'General Requirements for Wiring Methods and Materials', tip: 'Burial depths are Table 300.5.' },
  '310': { title: 'Conductors for General Wiring', tip: 'Ampacity tables 310.16 and 310.17; the dwelling service table/rule is 310.12.' },
  '312': { title: 'Cabinets, Cutout Boxes, and Meter Socket Enclosures' },
  '314': {
    title: 'Outlet, Device, Pull, and Junction Boxes; Conduit Bodies; Fittings; and Handhole Enclosures',
    tip: 'Box fill is 314.16 with two tables; pull box sizing is 314.28.',
  },
  '320': { title: 'Armored Cable: Type AC' },
  '330': { title: 'Metal-Clad Cable: Type MC' },
  '334': { title: 'Nonmetallic-Sheathed Cable: Types NM and NMC' },
  '338': { title: 'Service-Entrance Cable: Types SE and USE' },
  '340': { title: 'Underground Feeder and Branch-Circuit Cable: Type UF' },
  '342': { title: 'Intermediate Metal Conduit: Type IMC' },
  '344': { title: 'Rigid Metal Conduit: Type RMC' },
  '348': { title: 'Flexible Metal Conduit: Type FMC' },
  '350': { title: 'Liquidtight Flexible Metal Conduit: Type LFMC' },
  '352': { title: 'Rigid Polyvinyl Chloride Conduit: Type PVC' },
  '356': { title: 'Liquidtight Flexible Nonmetallic Conduit: Type LFNC' },
  '358': { title: 'Electrical Metallic Tubing: Type EMT' },
  '362': { title: 'Electrical Nonmetallic Tubing: Type ENT' },
  '366': { title: 'Auxiliary Gutters' },
  '376': { title: 'Metal Wireways' },
  '392': { title: 'Cable Trays' },
  '400': { title: 'Flexible Cords and Flexible Cables' },
  '404': { title: 'Switches' },
  '406': { title: 'Receptacles, Cord Connectors, and Attachment Plugs' },
  '408': { title: 'Switchboards, Switchgear, and Panelboards' },
  '410': { title: 'Luminaires, Lampholders, and Lamps' },
  '422': { title: 'Appliances' },
  '424': { title: 'Fixed Electric Space-Heating Equipment' },
  '430': {
    title: 'Motors, Motor Circuits, and Controllers',
    tip: 'Near the end of Chapter 4. The motor tables (430.247 to 430.250) are at the END of the article; Figure 430.1 is the map.',
    parts: [
      { part: 'Part I', title: 'General', from: 1, to: 18 },
      { part: 'Part II', title: 'Motor Circuit Conductors', from: 21, to: 29 },
      { part: 'Part III', title: 'Motor and Branch-Circuit Overload Protection', from: 31, to: 44 },
      { part: 'Part IV', title: 'Motor Branch-Circuit Short-Circuit and Ground-Fault Protection', from: 51, to: 58 },
      { part: 'Part V', title: 'Motor Feeder Short-Circuit and Ground-Fault Protection', from: 61, to: 63 },
      { part: 'Part VI', title: 'Motor Control Circuits', from: 71, to: 75 },
      { part: 'Part VII', title: 'Motor Controllers', from: 81, to: 91 },
      { part: 'Part IX', title: 'Disconnecting Means', from: 101, to: 113 },
      { part: 'Part XIV', title: 'Tables', from: 247, to: 251 },
    ],
  },
  '440': { title: 'Air-Conditioning and Refrigerating Equipment' },
  '445': { title: 'Generators' },
  '450': {
    title: 'Transformers and Transformer Vaults',
    tip: 'Protection tables are 450.3(A) (over 1000 V) and 450.3(B) (1000 V and less).',
  },
  '480': { title: 'Stationary Standby Batteries' },
  '500': { title: 'Hazardous (Classified) Locations, Classes I, II, and III, Divisions 1 and 2' },
  '501': { title: 'Class I Locations' },
  '511': { title: 'Commercial Garages, Repair and Storage' },
  '514': { title: 'Motor Fuel Dispensing Facilities' },
  '517': { title: 'Health Care Facilities' },
  '518': { title: 'Assembly Occupancies' },
  '520': { title: 'Theaters, Audience Areas of Motion Picture and Television Studios, and Similar Locations' },
  '547': { title: 'Agricultural Buildings' },
  '550': { title: 'Mobile Homes, Manufactured Homes, and Mobile Home Parks' },
  '555': { title: 'Marinas, Boatyards, Floating Buildings, and Commercial and Noncommercial Docking Facilities' },
  '590': { title: 'Temporary Installations' },
  '600': { title: 'Electric Signs and Outline Lighting' },
  '620': { title: 'Elevators, Escalators, and similar equipment' },
  '625': { title: 'Electric Vehicle Power Transfer System' },
  '630': { title: 'Electric Welders' },
  '645': { title: 'Information Technology Equipment' },
  '680': { title: 'Swimming Pools, Fountains, and Similar Installations' },
  '690': { title: 'Solar Photovoltaic (PV) Systems' },
  '695': { title: 'Fire Pumps' },
  '700': { title: 'Emergency Systems' },
  '701': { title: 'Legally Required Standby Systems' },
  '702': { title: 'Optional Standby Systems' },
  '705': { title: 'Interconnected Electric Power Production Sources' },
  '725': { title: 'Class 1, Class 2, and Class 3 Remote-Control, Signaling, and Power-Limited Circuits' },
  '760': { title: 'Fire Alarm Systems' },
  '800': { title: 'General Requirements for Communications Systems' },
}

const ANNEX_TITLES: Record<string, string> = {
  C: 'Annex C: Conduit, Tubing, and Cable Tray Fill Tables for Conductors and Fixture Wires of the Same Size',
  D: 'Annex D: Examples (worked load calculations)',
}

function chapterOfArticle(article: string): string {
  const n = Number(article)
  if (n === 90) return 'The Introduction (Article 90), before Chapter 1'
  const ch = n >= 100 && n < 1000 ? String(Math.floor(n / 100)) : ''
  return CHAPTERS[ch] ?? 'The code book'
}

/** Picks the location for the edition: `byEdition[edition]` when given, else `loc`. */
export function locFor(ref: CodeRef, edition: NecEdition): string {
  return ref.byEdition?.[edition] ?? ref.loc
}

/**
 * The three-rung hint for a reference. Handles '250.66', 'Table 250.66', '314.16(B)(4)',
 * 'Art. 680', 'Chapter 9, Table 4', 'Annex C, Table C.1', Maryland law, and theory.
 */
export function bookHint(ref: CodeRef, edition: NecEdition): BookHint {
  const loc = locFor(ref, edition)
  if (ref.book === 'MD') {
    const isComar = /COMAR/i.test(loc)
    return {
      chapter: 'Maryland law, not the NEC',
      article: isComar
        ? 'COMAR Title 09, Subtitle 09: the State Board of Electricians regulations'
        : 'Maryland Code, Business Occupations and Professions Article, Title 6: Electricians',
      exact: loc,
      tip: 'Maryland law questions are answered from the state law and regulations, not the code book.',
    }
  }
  if (ref.book === 'THEORY') {
    return {
      chapter: 'Not in the code book: electrical theory',
      article: ref.title ?? 'A formula you carry in your head',
      exact: loc,
    }
  }
  const ch9 = /^Chapter 9/i.exec(loc)
  if (ch9) {
    return {
      chapter: CHAPTERS['9'] as string,
      article: 'Chapter 9 tables, with their notes ahead of Table 1',
      exact: loc,
      tip: 'Chapter 9 sits at the back of the book, after Article 840 and before the Annexes.',
    }
  }
  const annex = /^Annex ([A-Z])/i.exec(loc)
  if (annex) {
    const key = (annex[1] ?? '').toUpperCase()
    return {
      chapter: 'The Annexes, at the very back (after Chapter 9)',
      article: ANNEX_TITLES[key] ?? `Annex ${key}`,
      exact: loc,
    }
  }
  const m = /(\d{2,3})(?:\.(\d+))?/.exec(loc)
  const article = m?.[1] ?? ''
  const section = m?.[2] ? Number(m[2]) : undefined
  const info = ARTICLES[article]
  const part = section !== undefined ? info?.parts?.find((p) => section >= p.from && section <= p.to) : undefined
  const articleLine = info
    ? `Article ${article}: ${info.title}${part ? `, ${part.part}: ${part.title}` : ''}`
    : `Article ${article}`
  return { chapter: chapterOfArticle(article), article: articleLine, exact: loc, tip: info?.tip }
}
