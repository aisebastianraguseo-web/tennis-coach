import type { GoalCategory } from '@/types/domain'

export const PREDEFINED_PLAYERS = [
  'Inninger Marco',
  'Pauker Niklas',
  'Maier Michael',
  'Ott Josef',
  'Burger Stefan',
  'Schmidhuber Tobias',
  'Ammon Björn',
  'Brück Philipp',
  'Inninger Christoph',
  'Bleicher Stephan',
  'Ortlieb Matthias',
  'Meier Martin',
  'Polatzky Martin',
  'Sleik Rudi',
  'Deutsch Stephan',
  'Köbinger Markus',
] as const

interface GoalSeed {
  text: string
  category: GoalCategory
}

export const PREDEFINED_GOALS: GoalSeed[] = [
  // BEWEGUNG & POSITION
  {
    text: 'Laufen! Immer in Bewegung bleiben. Splitstep, Pause-Step, Cross-Step – um alle Bälle zu erreichen.',
    category: 'bewegung',
  },
  {
    text: 'Breiten Stand wählen (Split-Step). Für Gleichgewicht und Reaktion bei Richtungswechsel.',
    category: 'bewegung',
  },
  {
    text: 'Optimale horizontale Position. Immer zwischen den zwei besten Winkeln stehen.',
    category: 'bewegung',
  },
  {
    text: 'Optimale vertikale Position. Immer 1,5m hinter der Grundlinie stehen für Sicherheit.',
    category: 'bewegung',
  },
  {
    text: 'V-Movement. Dem Ball entgegengehen, Weg abschneiden – kürzerer Weg, höheres Returnpotential.',
    category: 'bewegung',
  },
  {
    text: 'Return-Beinarbeit. Splitstep sobald der Gegner beim Aufschlag den Ball trifft.',
    category: 'bewegung',
  },
  // SCHLAGTECHNIK
  {
    text: 'Handgelenk frei halten. Peitscheffekt nutzen, durchschwingen, Griff vor Schlag öffnen.',
    category: 'technik',
  },
  {
    text: 'Früh vorbereiten. Im Laufen und während der Ball übers Netz fliegt bereits vorbereitet sein.',
    category: 'technik',
  },
  {
    text: 'Einhändige Rückhand: zweiten Arm für Kontrolle und Gleichgewicht nutzen.',
    category: 'technik',
  },
  {
    text: 'In den Ball gehen. Körper in Schlagrichtung bewegen – Druck aufbauen und Ballsicherheit gewinnen.',
    category: 'technik',
  },
  // TAKTIK & STRATEGIE
  {
    text: 'Cross-Winkel steil spielen. Ball zuerst über die Seitenlinie, dann Grundlinie – Gegner aus dem Feld bewegen.',
    category: 'taktik',
  },
  {
    text: 'Ghost Net Run. Ans Netz laufen, wenn Gegner unter Druck und auf den Ball fixiert ist.',
    category: 'taktik',
  },
  {
    text: 'Return tief ins Zentrum, falls Gegner nach Aufschlag nicht zurückgeht – er muss aus Rückwärtslage schlagen.',
    category: 'taktik',
  },
  {
    text: 'Return als Drive. Keine Ausholbewegung bei zu wenig Zeit – sicher und kontrolliert zurückspielen.',
    category: 'taktik',
  },
  // AUFSCHLAG
  {
    text: 'Open Toss. Handfläche öffnen beim Werfen, damit der Ball gerade fliegt.',
    category: 'aufschlag',
  },
  {
    text: 'Serve auf T. Flach durch Slice – maximale Unbequemlichkeit für den Gegner.',
    category: 'aufschlag',
  },
  // KÖRPER & AUSRICHTUNG
  {
    text: 'Vor- und Rückhand-Körperhaltung auf dominantes linkes Auge ausrichten für optimalen Treffpunkt.',
    category: 'koerper',
  },
]
