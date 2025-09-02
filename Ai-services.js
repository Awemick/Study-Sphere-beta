const OCR_SPACE_API_KEY = 'K85308176588957';
const HUGGING_FACE_API_KEY = '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';

export const ocrService = {
  async extractTextFromImage(imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('apikey', OCR_SPACE_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    
    try {
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage.join(', '));
      }
      
      return data.ParsedResults[0].ParsedText;
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }
};

export const aiService = {
  async generateFlashcards(text) {
    // First, try to use Hugging Face API
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/google/flan-t5-large',
        {
          headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` },
          method: 'POST',
          body: JSON.stringify({
            inputs: `Generate flashcard questions and answers from the following text. Format as JSON: [{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}]. Text: ${text.substring(0, 1000)}`
          }),
        }
      );
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Try to extract JSON from the response
      const jsonMatch = result[0].generated_text.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to simple Q&A generation if JSON parsing fails
      return this.generateSimpleFlashcards(text);
    } catch (error) {
      console.error('Hugging Face API Error:', error);
      // Fallback to simple generation
      return this.generateSimpleFlashcards(text);
    }
  },
  
  async generateSimpleFlashcards(text) {
    // Simple fallback implementation
    const sentences = text.split(/[.!?]/).filter(s => s.length > 10);
    const flashcards = [];
    
    // Create simple question-answer pairs
    for (let i = 0; i < Math.min(sentences.length, 5); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length < 15) continue;
      
      const words = sentence.split(' ');
      if (words.length < 4) continue;
      
      // Create a question by removing a key term
      const keyTermIndex = Math.floor(words.length / 2);
      const keyTerm = words[keyTermIndex];
      words[keyTermIndex] = '______';
      
      flashcards.push({
        question: words.join(' ') + '?',
        answer: keyTerm
      });
    }
    
    return flashcards;
  }
};