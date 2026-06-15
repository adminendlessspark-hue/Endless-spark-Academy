
export async function generateGeminiContent(params: {
  model: string;
  contents: any;
  config?: any;
}) {
  const response = await fetch("/api/gemini/generate-content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to generate content from Gemini");
  }

  return data;
}
