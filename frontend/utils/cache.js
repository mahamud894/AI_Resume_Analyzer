import { mapAIResponse } from './aiMapper.js';

export const getCachedAnalysis = (resumeText, jobDesc) => {
  const key = `${resumeText.slice(0, 100)}_${jobDesc.slice(0, 50)}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return mapAIResponse(parsed);
    } catch {
      return null;
    }
  }
  return null;
};

export const setCachedAnalysis = (resumeText, jobDesc, data) => {
  const key = `${resumeText.slice(0, 100)}_${jobDesc.slice(0, 50)}`;
  localStorage.setItem(key, JSON.stringify(data));
};

export const getAnalysisWithCache = async (resumeText, jobDesc, aiCallFunction) => {
  const cachedData = getCachedAnalysis(resumeText, jobDesc);
  if (cachedData && cachedData.isValid) {
    console.log("Returning cached response");
    return cachedData;
  }

  console.log("Calling AI Service...");
  try {
    const rawAIResponse = await aiCallFunction(resumeText, jobDesc);
    const mappedResponse = mapAIResponse(rawAIResponse);
    
    if (mappedResponse.isValid) {
      setCachedAnalysis(resumeText, jobDesc, mappedResponse);
    }
    return mappedResponse;
  } catch (error) {
    return { isValid: false, error: "AI Service temporarily unavailable. Please try again later." };
  }
};