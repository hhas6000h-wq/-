
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAiResponse(userMessage: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction: "أنت مساعد ذكي في تطبيق 'شات ريل العراق'. تحدث بلهجة عراقية محببة وودودة. قدم المساعدة للمستخدمين وكن مطلعاً على ثقافة العراق وتاريخه. اجعل ردودك قصيرة ومناسبة لبيئة الدردشة.",
        temperature: 0.8,
        topP: 0.9,
      }
    });
    return response.text || "عذراً، لم أفهم ذلك جيداً. كيف يمكنني مساعدتك؟";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "عذراً، واجهت مشكلة تقنية بسيطة. جرب مرة أخرى لاحقاً.";
  }
}
