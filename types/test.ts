// Mirrors schemas/ielts-test.schema.json — kept in sync manually since the
// JSON Schema is the source of truth for API validation (ajv) and this file
// is the source of truth for compile-time checks in the React engine.

export type TestType = "ACADEMIC" | "GENERAL";
export type ModuleType = "LISTENING" | "READING" | "WRITING" | "SPEAKING";

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE_NOT_GIVEN"
  | "MATCHING_HEADINGS"
  | "SENTENCE_COMPLETION"
  | "MAP_LABELING";

export interface OptionItem {
  key: string;
  text: string;
}

interface BaseQuestion {
  id: string;
  order: number;
  type: QuestionType;
  points: number;
  prompt?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "MULTIPLE_CHOICE";
  allowMultipleSelect: boolean;
  options: OptionItem[];
  correctAnswer: string | string[];
}

export interface TrueFalseNotGivenQuestion extends BaseQuestion {
  type: "TRUE_FALSE_NOT_GIVEN";
  statement: string;
  correctAnswer: "TRUE" | "FALSE" | "NOT_GIVEN";
}

export interface MatchingHeadingsQuestion extends BaseQuestion {
  type: "MATCHING_HEADINGS";
  paragraphLabel: string;
  correctAnswer: string;
}

export interface SentenceCompletionQuestion extends BaseQuestion {
  type: "SENTENCE_COMPLETION";
  textWithBlank: string;
  maxWords: number;
  correctAnswer: string | string[];
  caseSensitive: boolean;
}

export interface MapLabelingQuestion extends BaseQuestion {
  type: "MAP_LABELING";
  labelPointId: string;
  correctAnswer: string;
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseNotGivenQuestion
  | MatchingHeadingsQuestion
  | SentenceCompletionQuestion
  | MapLabelingQuestion;

// Client-safe question shapes — identical to their server counterparts minus
// `correctAnswer`. The test-taking UI (a "use client" tree) must only ever
// see these: the answer key is graded server-side (lib/scoring/gradeModule.ts)
// and must never be serialized into a client component's props or the RSC
// payload before a candidate submits. See lib/mappers/toClientModule.ts.
type OmitAnswer<T> = Omit<T, "correctAnswer">;

export type ClientMultipleChoiceQuestion = OmitAnswer<MultipleChoiceQuestion>;
export type ClientTrueFalseNotGivenQuestion = OmitAnswer<TrueFalseNotGivenQuestion>;
export type ClientMatchingHeadingsQuestion = OmitAnswer<MatchingHeadingsQuestion>;
export type ClientSentenceCompletionQuestion = OmitAnswer<SentenceCompletionQuestion>;
export type ClientMapLabelingQuestion = OmitAnswer<MapLabelingQuestion>;

export type ClientQuestion =
  | ClientMultipleChoiceQuestion
  | ClientTrueFalseNotGivenQuestion
  | ClientMatchingHeadingsQuestion
  | ClientSentenceCompletionQuestion
  | ClientMapLabelingQuestion;

export interface MapPoint {
  id: string;
  x: number; // percentage 0-100, relative to image
  y: number;
}

export interface QuestionGroupData {
  headings?: OptionItem[]; // MATCHING_HEADINGS
  mapImageUrl?: string; // MAP_LABELING
  mapPoints?: MapPoint[]; // MAP_LABELING
  options?: OptionItem[]; // MAP_LABELING
}

export interface QuestionGroup {
  id: string;
  order: number;
  type: QuestionType;
  instructions: string;
  passageId?: string;
  audioTrackId?: string;
  groupData?: QuestionGroupData;
  questions: Question[];
}

export interface ClientQuestionGroup extends Omit<QuestionGroup, "questions"> {
  questions: ClientQuestion[];
}

export interface Passage {
  id: string;
  order: number;
  title: string;
  bodyText: string;
}

export interface AudioTrack {
  id: string;
  order: number;
  title: string;
  audioUrl: string;
  durationSeconds: number;
  transcript?: string;
}

export interface ReadingModule {
  timeLimitMinutes: number;
  passages: Passage[];
  questionGroups: QuestionGroup[];
}

export interface ListeningModule {
  timeLimitMinutes: number;
  audioTracks: AudioTrack[];
  questionGroups: QuestionGroup[];
}

export interface WritingTask {
  id: string;
  taskNumber: 1 | 2;
  prompt: string;
  imageUrl?: string;
  minWords: number;
  timeLimitMinutes: number;
}

export interface WritingModule {
  tasks: WritingTask[];
}

export interface SpeakingPart {
  id: string;
  partNumber: 1 | 2 | 3;
  cueCardText?: string;
  prepTimeSeconds?: number;
  speakingTimeSeconds?: number;
  questions: string[];
}

export interface SpeakingModule {
  parts: SpeakingPart[];
}

export interface IeltsTest {
  id: string;
  title: string;
  type: TestType;
  isPublished: boolean;
  createdAt: string;
  modules: {
    listening: ListeningModule;
    reading: ReadingModule;
    writing: WritingModule;
    speaking: SpeakingModule;
  };
}

// A "gradable module" is the shape the engine + scorer work with for
// Listening/Reading — the two modules with objective, key-comparable answers.
export type GradableModule = ReadingModule | ListeningModule;

export interface ClientReadingModule extends Omit<ReadingModule, "questionGroups"> {
  questionGroups: ClientQuestionGroup[];
}

export interface ClientListeningModule extends Omit<ListeningModule, "questionGroups"> {
  questionGroups: ClientQuestionGroup[];
}

// The only module shape a "use client" test-engine component may receive —
// see the ClientQuestion comment above for why.
export type ClientGradableModule = ClientReadingModule | ClientListeningModule;

export interface UserAnswerMap {
  [questionId: string]: string | string[] | undefined;
}
