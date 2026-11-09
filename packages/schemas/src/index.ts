// @datapitfalls/schemas — the shared data contracts of the datapitfalls family.
//
// The JSON Schemas in ../schemas are the source of truth; these TypeScript types
// mirror them. Validate documents with any JSON Schema 2020-12 validator, e.g.
//   import schema from '@datapitfalls/schemas/schemas/transcript.schema.json' with { type: 'json' };
//
// Versioning: adding an optional field is a minor release; removing or renaming
// a field is a major release with a migration note.

/** Base URL of the published schema `$id`s. */
export const SCHEMA_BASE_URL = 'https://avoidingdatapitfalls.com/schemas/';

/** The schema files this package ships, by contract name. */
export const SCHEMA_FILES = {
  finding: 'schemas/finding.schema.json',
  pitfallReport: 'schemas/pitfall-report.schema.json',
  transcript: 'schemas/transcript.schema.json',
  memoryRecord: 'schemas/memory-record.schema.json',
  trap: 'schemas/trap.schema.json',
} as const;

/** An Avoiding Data Pitfalls rule id (kebab-case slug), e.g. `multiple-comparisons`. */
export type RuleId = string;

export type Domain =
  | 'Epistemic Errors'
  | 'Technical Trespasses'
  | 'Mathematical Miscues'
  | 'Statistical Slip-Ups'
  | 'Analytical Aberrations'
  | 'Graphical Gaffes'
  | 'Design Dangers'
  | 'Biased Baseline';

export type Severity = 'info' | 'warning' | 'error';
export type Confidence = 'low' | 'medium' | 'high';

/** One pitfall a review found. */
export interface Finding {
  ruleId: RuleId;
  name: string;
  domain: Domain;
  severity: Severity;
  confidence: Confidence;
  /** active: evident from the artifact; latent: depends on data not seen. */
  nature: 'active' | 'latent';
  /** For latent findings, the data condition under which the pitfall bites. */
  condition: string;
  evidence: string;
  explanation: string;
  remediation: string;
  /** Experimental: how much the finding changes the takeaway. */
  consequence?: 'changes-takeaway' | 'weakens-support' | 'polish';
  /** Transcript reviews only: zero-based event numbers the evidence cites. */
  eventRefs?: number[];
}

/** The result of one review. */
export interface PitfallReport {
  findings: Finding[];
  kind: 'code' | 'text' | 'image' | 'document' | 'slides' | 'chain' | 'transcript';
  model: string;
  rulesConsidered: number;
  taxonomyVersion?: string;
  tier?: 'clear' | 'verify' | 'attention' | 'serious';
  summary?: string;
  avoided?: {
    ruleId: RuleId;
    name?: string;
    domain?: Domain;
    evidence: string;
    explanation?: string;
  }[];
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
  };
}

/** One step of an analytics-agent session. */
export interface TranscriptEvent {
  role: 'user' | 'agent' | 'tool';
  type: 'message' | 'query' | 'result' | 'chart' | 'correction';
  content: string;
  sql?: string;
  at?: string;
}

/** One session between a person and an AI analytics agent. */
export interface Transcript {
  session_id: string;
  agent: 'hex' | 'claude' | 'claude-code' | 'generic';
  started_at: string;
  events: TranscriptEvent[];
  signals?: { user_doubt?: number; rerun?: number; correction?: number };
}

/** One entry in a datapitfalls agent Logbook. */
export interface MemoryRecord {
  id: string;
  kind: 'lesson' | 'quirk' | 'hypothesis' | 'decision';
  statement: string;
  scope?: { dataset?: string; table?: string; metric?: string };
  evidence: { session_id?: string; events?: number[]; query?: string; note?: string }[];
  pitfall_ids: RuleId[];
  half_life_days: number;
  created_at?: string;
  last_verified?: string;
  status: 'proposed' | 'confirmed' | 'changed' | 'expired';
  confidence: Confidence;
  /** Human-written records are never rewritten by Debrief, only flagged. */
  source: 'debrief' | 'human';
  taxonomyVersion?: string;
}

/** A labeled moment in datapitfalls bench where a pitfall is likely to bite. */
export interface Trap {
  id: string;
  kind: 'data' | 'definition' | 'goal';
  /** YYYY-MM */
  start_month: string;
  end_month?: string;
  pitfall_ids: RuleId[];
  affected_questions: string[];
  ground_truth: string;
  evidence_query?: string;
}
