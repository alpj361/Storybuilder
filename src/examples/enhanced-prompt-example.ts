/**
 * Example demonstrating the enhanced contextual prompt generation system
 * This shows how the new system generates prompts based on thematic content and visual style
 */

import { parseUserInput, analyzeTheme, analyzeVisualStyle } from '../services/promptParser';
import { validateStoryboardProject, validateContextualPrompt } from '../services/promptValidator';

// Example 1: Historical content with toons style (like the Guatemala agrarian reform example)
const historicalInput = `
Sí. Aquí está la transcripción fiel de la captura.
Jacobo Arbenz Guzmán ganó la presidencia en noviembre de 1950 con una plataforma reformista que abogaba por la reforma agraria.
Guatemala es un país rico con un alto producto interno bruto (PIB) y una moneda fuerte, ocupando el segundo lugar después de Costa Rica en Centroamérica. Sin embargo, enfrentaba graves problemas con la distribución de la tierra.
El 2% de la población controlaba el 72% de la tierra cultivable, mientras que el 88% de la población poseía solo el 14%. Además, menos del 12% de la tierra privada estaba bajo cultivo, lo que llevaba a la pobreza generalizada y la desnutrición.
El presidente Arbenz enfatizó la necesidad de la reforma agraria para abordar los problemas sociales, afirmando que la riqueza del país debería beneficiar a la mayoría, no solo a unos pocos.
El 17 de junio de 1952, el Congreso de Guatemala aprobó el Decreto 900, que autorizó la redistribución de más de 600,000 hectáreas de tierra a aproximadamente 100,000 familias.
La Ley de Reforma Agraria fue controvertida, llevando a debates sobre sus implicaciones y acusaciones de que estaba influenciada por intereses soviéticos.
General un cómic estilo toons con bolitas y palitos haciendo referencia a esto (panels: 4)
Character 1
`;

// Example 2: Educational content with realistic style
const educationalInput = `
Crear un storyboard educativo sobre el proceso de fotosíntesis en las plantas.
Explicar cómo las plantas convierten la luz solar en energía química.
Mostrar las etapas: absorción de luz, conversión de CO2, producción de glucosa.
Estilo realista y detallado para mejor comprensión.
4 paneles
`;

// Example 3: Technical content with sketch style
const technicalInput = `
Diseñar un storyboard técnico para la construcción de una viga de acero.
Mostrar el proceso de soldadura, conexiones estructurales y refuerzos.
Incluir detalles técnicos como especificaciones de materiales.
Estilo sketch técnico con líneas de construcción.
6 paneles
`;

/**
 * Demonstrate enhanced prompt generation
 */
export async function demonstrateEnhancedPrompts() {
  console.log('=== Enhanced Prompt Generation Demo ===\n');

  // Test historical content
  console.log('1. Historical Content Analysis:');
  const historicalTheme = analyzeTheme(historicalInput);
  const historicalStyle = analyzeVisualStyle(historicalInput);
  console.log('Theme Analysis:', historicalTheme);
  console.log('Visual Style:', historicalStyle);
  console.log('');

  // Test educational content
  console.log('2. Educational Content Analysis:');
  const educationalTheme = analyzeTheme(educationalInput);
  const educationalStyle = analyzeVisualStyle(educationalInput);
  console.log('Theme Analysis:', educationalTheme);
  console.log('Visual Style:', educationalStyle);
  console.log('');

  // Test technical content
  console.log('3. Technical Content Analysis:');
  const technicalTheme = analyzeTheme(technicalInput);
  const technicalStyle = analyzeVisualStyle(technicalInput);
  console.log('Theme Analysis:', technicalTheme);
  console.log('Visual Style:', technicalStyle);
  console.log('');

  // Generate full storyboard projects
  console.log('4. Generating Full Storyboard Projects:');
  
  try {
    const historicalProject = await parseUserInput(historicalInput);
    console.log('Historical Project Generated:', historicalProject.success);
    if (historicalProject.success) {
      console.log('Panels:', historicalProject.project.panels.length);
      historicalProject.project.panels.forEach((panel, index) => {
        console.log(`Panel ${index + 1}:`, panel.prompt.generatedPrompt);
      });
    }
    console.log('');

    const educationalProject = await parseUserInput(educationalInput);
    console.log('Educational Project Generated:', educationalProject.success);
    if (educationalProject.success) {
      console.log('Panels:', educationalProject.project.panels.length);
      educationalProject.project.panels.forEach((panel, index) => {
        console.log(`Panel ${index + 1}:`, panel.prompt.generatedPrompt);
      });
    }
    console.log('');

    const technicalProject = await parseUserInput(technicalInput);
    console.log('Technical Project Generated:', technicalProject.success);
    if (technicalProject.success) {
      console.log('Panels:', technicalProject.project.panels.length);
      technicalProject.project.panels.forEach((panel, index) => {
        console.log(`Panel ${index + 1}:`, panel.prompt.generatedPrompt);
      });
    }
    console.log('');

  } catch (error) {
    console.error('Error generating projects:', error);
  }

  // Validate projects
  console.log('5. Validation Results:');
  
  try {
    const historicalProject = await parseUserInput(historicalInput);
    if (historicalProject.success) {
      const validation = validateStoryboardProject(historicalProject.project);
      console.log('Historical Project Validation Score:', validation.score);
      console.log('Issues:', validation.issues.length);
      console.log('Suggestions:', validation.suggestions.length);
    }
  } catch (error) {
    console.error('Error validating projects:', error);
  }
}

/**
 * Compare old vs new prompt generation
 */
export function comparePromptGeneration(input: string) {
  console.log('=== Comparing Old vs New Prompt Generation ===\n');
  
  // Old style (generic)
  const oldStylePrompt = "Wide establishing shot of generic setting";
  
  // New style (contextual)
  const theme = analyzeTheme(input);
  const style = analyzeVisualStyle(input);
  
  console.log('Input:', input.substring(0, 100) + '...');
  console.log('');
  console.log('OLD STYLE PROMPT:');
  console.log('-', oldStylePrompt);
  console.log('');
  console.log('NEW STYLE PROMPT (Contextual):');
  console.log('- Theme:', theme.type);
  console.log('- Concepts:', theme.concepts);
  console.log('- Visual Style:', style.style);
  console.log('- Characteristics:', style.characteristics);
  console.log('');
  console.log('The new system generates prompts that:');
  console.log('✓ Reflect the thematic content');
  console.log('✓ Match the requested visual style');
  console.log('✓ Maintain narrative coherence');
  console.log('✓ Include specific contextual details');
}

// Export for use in other parts of the application
export { historicalInput, educationalInput, technicalInput };
