
import { GoogleGenAI } from "@google/genai";

// Initialize AI right before making the request to ensure the most up-to-date API key is used from the environment
export const generateJobDescription = async (title: string, category: string, keywords: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Genera una descrizione professionale per un annuncio di lavoro in italiano.
      Titolo posizione: ${title}
      Categoria: ${category}
      Parole chiave/Requisiti: ${keywords}
      
      La descrizione deve includere:
      1. Un'introduzione accattivante dell'azienda (fittizia).
      2. Responsabilità principali.
      3. Requisiti richiesti.
      4. Cosa offriamo.
      
      Formatta il testo in Markdown.`,
      config: {
        temperature: 0.7,
      }
    });
    
    // Accessing .text directly as a property as per GenerateContentResponse definition
    return response.text;
  } catch (error) {
    console.error("Error generating job description:", error);
    return "Errore nella generazione del contenuto. Riprova più tardi.";
  }
};
