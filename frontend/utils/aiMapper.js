export const mapAIResponse = (aiOutput) => {
  try {
    let data = typeof aiOutput === 'string' ? JSON.parse(aiOutput) : aiOutput;

    const requiredFields = ['atsScore', 'matchingSkills', 'missingSkills', 'suggestions', 'summary'];
    const hasAllFields = requiredFields.every(field => data.hasOwnProperty(field));

    if (!hasAllFields) {
      throw new Error("AI response is missing required fields.");
    }

    return {
      atsScore: Math.min(100, Math.max(0, Number(data.atsScore))),
      matchingSkills: data.matchingSkills.map(s => s.trim()),
      missingSkills: data.missingSkills.map(s => s.trim()),
      suggestions: data.suggestions.trim(),
      summary: data.summary.trim(),
      isValid: true
    };
  } catch (error) {
    console.error("AI Response Mapping Failed:", error);
    return {
      isValid: false,
      error: "AI response format is invalid. Please try again."
    };
  }
};