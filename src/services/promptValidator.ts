import { 
  StoryboardProject, 
  StoryboardPrompt,
  ValidationResult
} from "../types/storyboard";
import { analyzeTheme, analyzeVisualStyle } from "./promptParser";

/**
 * Validate a complete storyboard project
 */
export function validateStoryboardProject(project: StoryboardProject): ValidationResult {
  const issues: ValidationResult["issues"] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check basic project completeness
  if (!project.title || project.title.trim().length === 0) {
    issues.push({
      type: "error",
      message: "Project must have a title"
    });
    score -= 20;
  }

  if (!project.description || project.description.trim().length === 0) {
    issues.push({
      type: "error", 
      message: "Project must have a description"
    });
    score -= 15;
  }

  // Validate characters
  if (project.characters.length === 0) {
    issues.push({
      type: "warning",
      message: "Project has no characters defined"
    });
    score -= 10;
    suggestions.push("Consider adding character descriptions for better consistency");
  }

  // Validate scenes
  if (project.scenes.length === 0) {
    issues.push({
      type: "error",
      message: "Project must have at least one scene"
    });
    score -= 20;
  }

  // Validate panels
  if (project.panels.length === 0) {
    issues.push({
      type: "error",
      message: "Project must have at least one panel"
    });
    score -= 30;
  } else {
    // Check each panel
    project.panels.forEach((panel, index) => {
      const panelValidation = validateStoryboardPrompt(panel.prompt);
      if (!panelValidation.isValid) {
        panelValidation.issues.forEach(issue => {
          issues.push({
            ...issue,
            panelNumber: index + 1
          });
        });
        score -= 5;
      }
    });
  }

  // Check for proper 4-panel structure
  if (project.panels.length !== 4) {
    issues.push({
      type: "suggestion",
      message: `Project has ${project.panels.length} panels, consider using 4 panels for standard storyboard format`
    });
    suggestions.push("Standard storyboards work best with 4 panels for clear narrative flow");
  }

  // Check character consistency across panels
  const characterConsistencyScore = checkCharacterConsistency(project);
  score = Math.min(score, score + characterConsistencyScore);

  // Enhanced validation: Check thematic and stylistic coherence
  const thematicCoherenceScore = checkThematicCoherence(project);
  score = Math.min(score, score + thematicCoherenceScore);

  const stylisticCoherenceScore = checkStylisticCoherence(project);
  score = Math.min(score, score + stylisticCoherenceScore);

  return {
    isValid: issues.filter(i => i.type === "error").length === 0,
    score: Math.max(0, score),
    issues,
    suggestions
  };
}

/**
 * Validate an individual storyboard prompt
 */
export function validateStoryboardPrompt(prompt: StoryboardPrompt): ValidationResult {
  const issues: ValidationResult["issues"] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check required fields
  if (!prompt.sceneDescription || prompt.sceneDescription.trim().length === 0) {
    issues.push({
      type: "error",
      message: "Prompt must have a scene description"
    });
    score -= 25;
  }

  if (!prompt.action || prompt.action.trim().length === 0) {
    issues.push({
      type: "warning",
      message: "Prompt should have an action description"
    });
    score -= 10;
  }

  if (!prompt.generatedPrompt || prompt.generatedPrompt.trim().length === 0) {
    issues.push({
      type: "error",
      message: "Prompt must have generated AI prompt text"
    });
    score -= 30;
  }

  // Check prompt quality
  if (prompt.generatedPrompt && prompt.generatedPrompt.length < 50) {
    issues.push({
      type: "warning",
      message: "Generated prompt seems too short for good results"
    });
    score -= 5;
    suggestions.push("Consider adding more descriptive details to the prompt");
  }

  if (prompt.generatedPrompt && prompt.generatedPrompt.length > 500) {
    issues.push({
      type: "suggestion",
      message: "Generated prompt is very long, consider simplifying"
    });
    suggestions.push("Very long prompts may not generate better results");
  }

  // Check for storyboard-specific elements
  if (prompt.generatedPrompt && !prompt.generatedPrompt.toLowerCase().includes("storyboard")) {
    issues.push({
      type: "suggestion",
      message: "Prompt should include storyboard-specific styling"
    });
    suggestions.push("Adding 'storyboard' keywords helps generate appropriate style");
  }

  return {
    isValid: issues.filter(i => i.type === "error").length === 0,
    score: Math.max(0, score),
    issues,
    suggestions
  };
}

/**
 * Check character consistency across panels
 */
function checkCharacterConsistency(project: StoryboardProject): number {
  let consistencyScore = 0;
  
  // Check if characters appear consistently across panels
  project.characters.forEach(character => {
    const panelsWithCharacter = project.panels.filter(panel => 
      panel.prompt.characters.includes(character.id)
    );
    
    if (panelsWithCharacter.length > 1) {
      // Character appears in multiple panels - good for consistency
      consistencyScore += 5;
      
      // Check if character descriptions are consistent
      const descriptions = panelsWithCharacter.map(panel => 
        panel.prompt.generatedPrompt
      );
      
      // Simple consistency check - if character name appears in all descriptions
      const hasConsistentNaming = descriptions.every(desc => 
        desc.toLowerCase().includes(character.name.toLowerCase()) ||
        desc.toLowerCase().includes(character.description.toLowerCase())
      );
      
      if (hasConsistentNaming) {
        consistencyScore += 5;
      }
    }
  });
  
  return Math.min(consistencyScore, 20); // Cap at 20 points
}

/**
 * Get prompt quality suggestions
 */
export function getPromptQualitySuggestions(prompt: StoryboardPrompt): string[] {
  const suggestions: string[] = [];
  
  if (!prompt.cameraAngle) {
    suggestions.push("Add camera angle specification for better composition");
  }
  
  if (!prompt.lighting) {
    suggestions.push("Specify lighting conditions for more atmospheric results");
  }
  
  if (!prompt.mood) {
    suggestions.push("Define the mood to enhance emotional impact");
  }
  
  if (prompt.characters.length === 0) {
    suggestions.push("Include character references for better scene composition");
  }
  
  if (!prompt.visualNotes) {
    suggestions.push("Add visual notes for specific artistic direction");
  }
  
  return suggestions;
}

/**
 * Score prompt completeness (0-100)
 */
export function scorePromptCompleteness(prompt: StoryboardPrompt): number {
  let score = 0;
  
  // Required elements (60 points total)
  if (prompt.sceneDescription) score += 20;
  if (prompt.action) score += 15;
  if (prompt.generatedPrompt) score += 25;
  
  // Optional but valuable elements (40 points total)
  if (prompt.cameraAngle) score += 8;
  if (prompt.lighting) score += 8;
  if (prompt.mood) score += 8;
  if (prompt.characters.length > 0) score += 8;
  if (prompt.visualNotes) score += 8;
  
  return score;
}

/**
 * Check thematic coherence across panels
 */
function checkThematicCoherence(project: StoryboardProject): number {
  let coherenceScore = 0;
  
  if (!project.userInput) return 0;
  
  const themeAnalysis = analyzeTheme(project.userInput);
  
  // Check if panels reflect the detected theme
  project.panels.forEach((panel, index) => {
    const prompt = panel.prompt.generatedPrompt.toLowerCase();
    const themeKeywords = themeAnalysis.concepts.map(c => c.toLowerCase());
    
    // Check if theme concepts appear in prompts
    const hasThemeKeywords = themeKeywords.some(keyword => 
      prompt.includes(keyword)
    );
    
    if (hasThemeKeywords) {
      coherenceScore += 5;
    }
    
    // Check for historical context if it's a historical theme
    if (themeAnalysis.type === 'historical') {
      if (prompt.includes('historical') || prompt.includes('period') || prompt.includes('era')) {
        coherenceScore += 3;
      }
    }
    
    // Check for educational context if it's an educational theme
    if (themeAnalysis.type === 'educational') {
      if (prompt.includes('educational') || prompt.includes('learning') || prompt.includes('concept')) {
        coherenceScore += 3;
      }
    }
  });
  
  return Math.min(coherenceScore, 20); // Cap at 20 points
}

/**
 * Check stylistic coherence across panels
 */
function checkStylisticCoherence(project: StoryboardProject): number {
  let coherenceScore = 0;
  
  if (!project.userInput) return 0;
  
  const visualStyle = analyzeVisualStyle(project.userInput);
  
  // Check if panels reflect the detected visual style
  project.panels.forEach((panel, index) => {
    const prompt = panel.prompt.generatedPrompt.toLowerCase();
    const styleKeywords = visualStyle.characteristics.map(c => c.toLowerCase());
    
    // Check if style characteristics appear in prompts
    const hasStyleKeywords = styleKeywords.some(keyword => 
      prompt.includes(keyword)
    );
    
    if (hasStyleKeywords) {
      coherenceScore += 5;
    }
    
    // Check for specific style indicators
    if (visualStyle.style === 'toons') {
      if (prompt.includes('simple') || prompt.includes('basic') || prompt.includes('geometric')) {
        coherenceScore += 3;
      }
    }
    
    if (visualStyle.style === 'realistic') {
      if (prompt.includes('detailed') || prompt.includes('photographic') || prompt.includes('realistic')) {
        coherenceScore += 3;
      }
    }
    
    if (visualStyle.style === 'anime') {
      if (prompt.includes('anime') || prompt.includes('manga') || prompt.includes('stylized')) {
        coherenceScore += 3;
      }
    }
  });
  
  return Math.min(coherenceScore, 20); // Cap at 20 points
}

/**
 * Enhanced prompt quality validation with contextual awareness
 */
export function validateContextualPrompt(prompt: StoryboardPrompt, userInput: string): ValidationResult {
  const issues: ValidationResult["issues"] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Basic validation (existing)
  if (!prompt.sceneDescription || prompt.sceneDescription.trim().length === 0) {
    issues.push({
      type: "error",
      message: "Prompt must have a scene description"
    });
    score -= 25;
  }

  if (!prompt.generatedPrompt || prompt.generatedPrompt.trim().length === 0) {
    issues.push({
      type: "error",
      message: "Prompt must have generated AI prompt text"
    });
    score -= 30;
  }

  // Enhanced contextual validation
  const themeAnalysis = analyzeTheme(userInput);
  const visualStyle = analyzeVisualStyle(userInput);
  
  // Check thematic relevance
  if (prompt.generatedPrompt) {
    const promptLower = prompt.generatedPrompt.toLowerCase();
    const hasThematicRelevance = themeAnalysis.concepts.some(concept => 
      promptLower.includes(concept.toLowerCase())
    );
    
    if (!hasThematicRelevance) {
      issues.push({
        type: "warning",
        message: "Prompt may not reflect the thematic content of the input"
      });
      score -= 10;
      suggestions.push("Consider incorporating more thematic elements from the original input");
    }
  }
  
  // Check stylistic consistency
  if (prompt.generatedPrompt) {
    const promptLower = prompt.generatedPrompt.toLowerCase();
    const hasStyleConsistency = visualStyle.characteristics.some(characteristic => 
      promptLower.includes(characteristic.toLowerCase())
    );
    
    if (!hasStyleConsistency) {
      issues.push({
        type: "warning",
        message: "Prompt may not reflect the requested visual style"
      });
      score -= 10;
      suggestions.push("Consider incorporating the requested visual style characteristics");
    }
  }

  return {
    isValid: issues.filter(i => i.type === "error").length === 0,
    score: Math.max(0, score),
    issues,
    suggestions
  };
}