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
  /** Whether the modal should be visible */
  visible: boolean;
  /** Close handler triggered by cancel actions */
  onClose: () => void;
  /** Project context for the export */
  project: StoryboardProject;
  /** Called when the user confirms export */
  onExport: (options: ExportOptions) => Promise<void>;
  /** Optional callback fired after the modal has fully dismissed */
  onDismissComplete?: () => void;
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
