/**
 * Types for PDF export functionality
 */

import { StoryboardProject } from "./storyboard";

/**
 * Layout options for PDF export
 */
export enum PDFLayout {
  /** 1 panel per page */
  SINGLE = "single",
  /** 2 panels per page (side by side) */
  DOUBLE = "double",
  /** 4 panels per page (2x2 grid, comic style) */
  QUAD = "quad"
}

/**
 * Export options selected by user
 */
export interface ExportOptions {
  /** Layout type for the PDF */
  layout: PDFLayout;
  /** Whether to include metadata (project info, panel descriptions) */
  includeMetadata: boolean;
}

/**
 * Props for ExportOptionsModal
 */
export interface ExportOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  project: StoryboardProject;
  onExport: (options: ExportOptions) => Promise<void>;
}

/**
 * Result of PDF generation
 */
export interface PDFExportResult {
  /** URI of the generated PDF file */
  uri: string;
  /** Filename of the PDF */
  filename: string;
  /** Number of pages generated */
  pageCount: number;
}
