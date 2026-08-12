// AI রেসপন্স ক্যাশে করার ফাংশন
export const getCachedAnalysis = (resumeText, jobDesc) => {
  const key = `${resumeText.slice(0, 100)}_${jobDesc.slice(0, 50)}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      return JSON.parse(cached);
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