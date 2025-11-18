/**
 * PDF Export Service
 * Generates comic-style PDFs from storyboard panels
 */

import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { NativeModules, Platform } from 'react-native';
import { StoryboardProject, StoryboardPanel, Character } from '../types/storyboard';
import { ExportOptions, PDFLayout, PDFExportResult } from '../types/export';

const { PDFShareManager } = NativeModules;

class PDFExportService {
  /**
   * Generate a comic PDF from project panels
   */
  async generateComicPDF(
    project: StoryboardProject,
    options: ExportOptions
  ): Promise<PDFExportResult> {
    try {
      // Filter panels that have generated images
      const panelsWithImages = project.panels.filter(panel => panel.generatedImageUrl);

      if (panelsWithImages.length === 0) {
        throw new Error('No panels with generated images found');
      }

      // Prepare images (convert URLs to base64)
      console.log('[PDFExportService] Preparing images...');
      const startPrepareImages = Date.now();
      const imageDataMap = await this.prepareImages(panelsWithImages);
      console.log(`[PDFExportService] Images prepared in ${Date.now() - startPrepareImages}ms`);

      // Generate HTML based on layout
      console.log('[PDFExportService] Generating HTML...');
      const startGenerateHTML = Date.now();
      const html = this.generateHTML(project, panelsWithImages, imageDataMap, options);
      const htmlSize = new Blob([html]).size;
      console.log(`[PDFExportService] HTML generated in ${Date.now() - startGenerateHTML}ms, size: ${(htmlSize / 1024 / 1024).toFixed(2)} MB`);

      // Generate PDF
      console.log('[PDFExportService] Creating PDF...');
      const startCreatePDF = Date.now();
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      console.log(`[PDFExportService] PDF created in ${Date.now() - startCreatePDF}ms`);

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log(`[PDFExportService] PDF file size: ${((fileInfo as any).size / 1024 / 1024).toFixed(2)} MB`);

      // Calculate page count based on layout
      const pageCount = this.calculatePageCount(panelsWithImages.length, options.layout);

      // Generate filename
      const filename = this.generateFilename(project);

      console.log('[PDFExportService] PDF generated successfully:', uri);

      return {
        uri,
        filename,
        pageCount
      };
    } catch (error) {
      console.error('[PDFExportService] Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Convert image URLs to base64 data
   * Uses parallel loading to prevent UI freeze
   * Compresses images to reduce PDF file size
   */
  private async prepareImages(panels: StoryboardPanel[]): Promise<Map<string, string>> {
    const imageDataMap = new Map<string, string>();

    // Load all images in parallel to prevent blocking the UI thread
    const imagePromises = panels.map(async (panel) => {
      if (!panel.generatedImageUrl) {
        return { id: panel.id, data: '' };
      }

      try {
        // ALWAYS compress images to reduce PDF file size and prevent Share Sheet freeze
        // ImageManipulator can handle both file:// URIs and data: URIs
        console.log(`[PDFExportService] Compressing image for panel ${panel.panelNumber}...`);
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          panel.generatedImageUrl,
          [
            // Resize to max 1024x1024 to reduce file size
            { resize: { width: 1024 } }
          ],
          {
            // Use JPEG compression with quality 0.7 to balance quality and size
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG
          }
        );

        // Read compressed image as base64
        const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
          encoding: FileSystem.EncodingType.Base64
        });

        const dataUri = `data:image/jpeg;base64,${base64}`;
        console.log(`[PDFExportService] Image compressed for panel ${panel.panelNumber}`);
        return { id: panel.id, data: dataUri };
      } catch (error) {
        console.warn(`[PDFExportService] Failed to load image for panel ${panel.panelNumber}:`, error);
        // Use placeholder if image fails to load
        return { id: panel.id, data: '' };
      }
    });

    // Wait for all images to load in parallel
    const results = await Promise.all(imagePromises);

    // Populate the map with results
    results.forEach(result => {
      imageDataMap.set(result.id, result.data);
    });

    return imageDataMap;
  }

  /**
   * Generate HTML for the PDF based on layout
   */
  private generateHTML(
    project: StoryboardProject,
    panels: StoryboardPanel[],
    imageDataMap: Map<string, string>,
    options: ExportOptions
  ): string {
    const { layout, includeMetadata } = options;

    let bodyContent = '';

    switch (layout) {
      case PDFLayout.SINGLE:
        bodyContent = this.generateSingleLayoutHTML(project, panels, imageDataMap, includeMetadata);
        break;
      case PDFLayout.DOUBLE:
        bodyContent = this.generateDoubleLayoutHTML(project, panels, imageDataMap, includeMetadata);
        break;
      case PDFLayout.QUAD:
        bodyContent = this.generateQuadLayoutHTML(project, panels, imageDataMap, includeMetadata);
        break;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${project.title}</title>
          <style>
            ${this.getCommonStyles()}
          </style>
        </head>
        <body>
          ${bodyContent}
        </body>
      </html>
    `;
  }

  /**
   * Common CSS styles for all layouts
   */
  private getCommonStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        background: white;
        color: #1f2937;
      }

      .page {
        page-break-after: always;
        padding: 40px;
        min-height: 100vh;
      }

      .page:last-child {
        page-break-after: auto;
      }

      .project-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 8px;
        color: #111827;
      }

      .project-description {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 20px;
        line-height: 1.5;
      }

      .panel-container {
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .panel-header {
        background: #f3f4f6;
        padding: 12px 16px;
        border-bottom: 2px solid #e5e7eb;
      }

      .panel-number {
        font-size: 16px;
        font-weight: bold;
        color: #374151;
      }

      .panel-image {
        width: 100%;
        height: auto;
        display: block;
        background: #f9fafb;
      }

      .panel-metadata {
        padding: 16px;
        background: #fafafa;
        border-top: 1px solid #e5e7eb;
      }

      .panel-description {
        font-size: 13px;
        line-height: 1.6;
        color: #4b5563;
        margin-bottom: 8px;
      }

      .panel-info {
        font-size: 11px;
        color: #9ca3af;
      }

      .characters-list {
        margin-top: 8px;
        font-size: 12px;
        color: #6b7280;
      }

      .character-tag {
        display: inline-block;
        background: #dbeafe;
        color: #1e40af;
        padding: 4px 10px;
        border-radius: 12px;
        margin-right: 6px;
        margin-bottom: 4px;
        font-size: 11px;
        font-weight: 600;
      }
    `;
  }

  /**
   * Generate HTML for Single layout (1 panel per page)
   */
  private generateSingleLayoutHTML(
    project: StoryboardProject,
    panels: StoryboardPanel[],
    imageDataMap: Map<string, string>,
    includeMetadata: boolean
  ): string {
    let html = '';

    // First page with project info (if metadata is included)
    if (includeMetadata) {
      html += `
        <div class="page">
          <h1 class="project-title">${this.escapeHtml(project.title)}</h1>
          <p class="project-description">${this.escapeHtml(project.description)}</p>
          ${this.generateCharactersList(project.characters)}
        </div>
      `;
    }

    // One panel per page
    panels.forEach(panel => {
      const imageData = imageDataMap.get(panel.id) || '';
      const characters = this.getPanelCharacters(panel, project.characters);

      html += `
        <div class="page">
          <div class="panel-container">
            <div class="panel-header">
              <div class="panel-number">Panel ${panel.panelNumber}</div>
            </div>
            ${imageData ? `<img src="${imageData}" class="panel-image" alt="Panel ${panel.panelNumber}" />` : ''}
            ${includeMetadata ? `
              <div class="panel-metadata">
                <div class="panel-description">${this.escapeHtml(panel.prompt.sceneDescription)}</div>
                <div class="panel-info">
                  <strong>Action:</strong> ${this.escapeHtml(panel.prompt.action)}
                  ${panel.prompt.dialogue ? `<br><strong>Dialogue:</strong> "${this.escapeHtml(panel.prompt.dialogue)}"` : ''}
                </div>
                ${characters.length > 0 ? `
                  <div class="characters-list">
                    ${characters.map(char => `<span class="character-tag">${this.escapeHtml(char.name)}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    return html;
  }

  /**
   * Generate HTML for Double layout (2 panels per page)
   */
  private generateDoubleLayoutHTML(
    project: StoryboardProject,
    panels: StoryboardPanel[],
    imageDataMap: Map<string, string>,
    includeMetadata: boolean
  ): string {
    let html = '';

    // First page with project info (if metadata is included)
    if (includeMetadata) {
      html += `
        <div class="page">
          <h1 class="project-title">${this.escapeHtml(project.title)}</h1>
          <p class="project-description">${this.escapeHtml(project.description)}</p>
          ${this.generateCharactersList(project.characters)}
        </div>
      `;
    }

    // Process panels in pairs
    for (let i = 0; i < panels.length; i += 2) {
      html += `<div class="page"><div style="display: flex; gap: 20px; flex-wrap: wrap;">`;

      // First panel
      const panel1 = panels[i];
      const imageData1 = imageDataMap.get(panel1.id) || '';
      const characters1 = this.getPanelCharacters(panel1, project.characters);

      html += `
        <div style="flex: 1; min-width: 300px;">
          <div class="panel-container">
            <div class="panel-header">
              <div class="panel-number">Panel ${panel1.panelNumber}</div>
            </div>
            ${imageData1 ? `<img src="${imageData1}" class="panel-image" alt="Panel ${panel1.panelNumber}" />` : ''}
            ${includeMetadata ? `
              <div class="panel-metadata">
                <div class="panel-description">${this.escapeHtml(panel1.prompt.sceneDescription)}</div>
                ${characters1.length > 0 ? `
                  <div class="characters-list">
                    ${characters1.map(char => `<span class="character-tag">${this.escapeHtml(char.name)}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      `;

      // Second panel (if exists)
      if (i + 1 < panels.length) {
        const panel2 = panels[i + 1];
        const imageData2 = imageDataMap.get(panel2.id) || '';
        const characters2 = this.getPanelCharacters(panel2, project.characters);

        html += `
          <div style="flex: 1; min-width: 300px;">
            <div class="panel-container">
              <div class="panel-header">
                <div class="panel-number">Panel ${panel2.panelNumber}</div>
              </div>
              ${imageData2 ? `<img src="${imageData2}" class="panel-image" alt="Panel ${panel2.panelNumber}" />` : ''}
              ${includeMetadata ? `
                <div class="panel-metadata">
                  <div class="panel-description">${this.escapeHtml(panel2.prompt.sceneDescription)}</div>
                  ${characters2.length > 0 ? `
                    <div class="characters-list">
                      ${characters2.map(char => `<span class="character-tag">${this.escapeHtml(char.name)}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }

      html += `</div></div>`;
    }

    return html;
  }

  /**
   * Generate HTML for Quad layout (4 panels per page, 2x2 grid)
   */
  private generateQuadLayoutHTML(
    project: StoryboardProject,
    panels: StoryboardPanel[],
    imageDataMap: Map<string, string>,
    includeMetadata: boolean
  ): string {
    let html = '';

    // First page with project info (if metadata is included)
    if (includeMetadata) {
      html += `
        <div class="page">
          <h1 class="project-title">${this.escapeHtml(project.title)}</h1>
          <p class="project-description">${this.escapeHtml(project.description)}</p>
          ${this.generateCharactersList(project.characters)}
        </div>
      `;
    }

    // Process panels in groups of 4
    for (let i = 0; i < panels.length; i += 4) {
      html += `
        <div class="page">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      `;

      // Add up to 4 panels
      for (let j = 0; j < 4 && i + j < panels.length; j++) {
        const panel = panels[i + j];
        const imageData = imageDataMap.get(panel.id) || '';
        const characters = this.getPanelCharacters(panel, project.characters);

        html += `
          <div>
            <div class="panel-container" style="height: 100%;">
              <div class="panel-header">
                <div class="panel-number" style="font-size: 14px;">Panel ${panel.panelNumber}</div>
              </div>
              ${imageData ? `<img src="${imageData}" class="panel-image" alt="Panel ${panel.panelNumber}" />` : ''}
              ${includeMetadata ? `
                <div class="panel-metadata" style="padding: 12px;">
                  <div class="panel-description" style="font-size: 11px;">${this.escapeHtml(panel.prompt.sceneDescription)}</div>
                  ${characters.length > 0 ? `
                    <div class="characters-list" style="margin-top: 6px;">
                      ${characters.map(char => `<span class="character-tag" style="font-size: 10px; padding: 2px 8px;">${this.escapeHtml(char.name)}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    return html;
  }

  /**
   * Generate characters list HTML
   */
  private generateCharactersList(characters: Character[]): string {
    if (characters.length === 0) return '';

    return `
      <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #374151;">Characters</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${characters.map(char => `
            <div style="display: inline-block; padding: 8px 14px; background: white; border: 2px solid #dbeafe; border-radius: 8px;">
              <div style="font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 2px;">${this.escapeHtml(char.name)}</div>
              <div style="font-size: 11px; color: #6b7280;">${this.escapeHtml(char.description)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Get characters present in a panel
   */
  private getPanelCharacters(panel: StoryboardPanel, allCharacters: Character[]): Character[] {
    return allCharacters.filter(char => panel.prompt.characters.includes(char.id));
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Calculate number of pages based on layout
   */
  private calculatePageCount(panelCount: number, layout: PDFLayout): number {
    const panelsPerPage = layout === PDFLayout.SINGLE ? 1 : layout === PDFLayout.DOUBLE ? 2 : 4;
    return Math.ceil(panelCount / panelsPerPage);
  }

  /**
   * Generate filename for the PDF
   */
  private generateFilename(project: StoryboardProject): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitizedTitle = project.title.replace(/[^a-zA-Z0-9]/g, '_');
    return `${sanitizedTitle}_${date}.pdf`;
  }

  /**
   * Share the generated PDF using native iOS module
   * This bypasses React Native window hierarchy issues completely
   */
  async sharePDF(uri: string): Promise<void> {
    console.log('[PDFExportService] sharePDF called with URI:', uri);

    try {
      // Verify file exists before attempting to share
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('[PDFExportService] File info:', fileInfo);

      if (!fileInfo.exists) {
        throw new Error('PDF file does not exist at the specified path');
      }

      // Check if native module is available (iOS only)
      if (!PDFShareManager) {
        throw new Error('PDFShareManager native module not available');
      }

      console.log('[PDFExportService] Using native PDFShareManager...');

      // Create a timeout promise to prevent infinite hanging
      const timeoutMs = 30000; // 30 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Share sheet timeout after 30 seconds'));
        }, timeoutMs);
      });

      // Call native module with timeout protection
      // The native module handles all view controller transitions and window hierarchy
      const result = await Promise.race([
        PDFShareManager.sharePDF(uri),
        timeoutPromise
      ]);

      console.log('[PDFExportService] Share result:', result);

      // result = { action: 'sharedAction' | 'dismissedAction', activityType?: string }
      if (result.action === 'sharedAction') {
        console.log('[PDFExportService] PDF shared successfully');
        if (result.activityType) {
          console.log('[PDFExportService] Shared via:', result.activityType);
        }
      } else if (result.action === 'dismissedAction') {
        console.log('[PDFExportService] User dismissed share sheet');
      }

      // Add a small delay to allow iOS to fully cleanup the Share Sheet
      // This prevents issues when sharing multiple times in quick succession
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('[PDFExportService] Share sheet cleanup delay completed');
    } catch (error: any) {
      // Log all errors for debugging
      console.error('[PDFExportService] Share error:', error);
      console.error('[PDFExportService] Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });

      // Rethrow to let caller handle it
      throw error;
    }
  }
}

// Export singleton instance
export default new PDFExportService();
