// script.js - Main application file with all integrations
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.7.1/+esm'

// Initialize Supabase
const supabaseUrl = 'https://pklaygtgyryexuyykvtf.supabase.co';
const supabaseAnonKey = 'sb_secret_iqMIPYGhwtgAr1_8GJt5jw_KZVFrvce';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API Keys (In production, these should be stored securely)
const OCR_SPACE_API_KEY = 'K85308176588957';
const HUGGING_FACE_API_KEY = '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';
const PAYSTACK_PUBLIC_KEY = 'pk_test_c8085f6e5ec5f58ab4146937afe3daf700003bfe';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

async function initializeApp() {
  // Check authentication state
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User signed in
        updateUIForAuthenticatedUser();
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        updateUIForAnonymousUser();
      }
    }
  );
  
  // Check current auth status
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    updateUIForAuthenticatedUser();
  } else {
    updateUIForAnonymousUser();
  }
  
  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Auth button
  document.getElementById('authBtn').addEventListener('click', handleAuthClick);
  
  // File uploads
  const fileInput = document.getElementById('fileUpload');
  const imageInput = document.getElementById('imageUpload');
  
  if (fileInput) {
    fileInput.addEventListener('change', handleFileUpload);
  }
  
  if (imageInput) {
    imageInput.addEventListener('change', handleImageUpload);
  }
  
  // Upload area click handlers
  const uploadArea = document.getElementById('uploadArea');
  const imageUploadArea = document.getElementById('imageUploadArea');
  
  if (uploadArea) {
    uploadArea.addEventListener('click', () => document.getElementById('fileUpload').click());
  }
  
  if (imageUploadArea) {
    imageUploadArea.addEventListener('click', () => document.getElementById('imageUpload').click());
  }
  
  // Process file button
  const processFileBtn = document.getElementById('processFileBtn');
  if (processFileBtn) {
    processFileBtn.addEventListener('click', processUploadedFile);
  }
  
  // Extract text button
  const extractTextBtn = document.getElementById('extractTextBtn');
  if (extractTextBtn) {
    extractTextBtn.addEventListener('click', extractTextFromImage);
  }
  
  // Record button
  const recordBtn = document.getElementById('recordBtn');
  if (recordBtn) {
    recordBtn.addEventListener('click', handleRecordClick);
  }
  
  // Generate flashcards button
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerateFlashcards);
  }
  
  // Save transcript button
  const saveTranscriptBtn = document.getElementById('saveTranscriptBtn');
  if (saveTranscriptBtn) {
    saveTranscriptBtn.addEventListener('click', saveTranscript);
  }
  
  // Premium upgrade buttons
  document.querySelectorAll('.plan-btn.primary, .plan-btn.secondary').forEach(btn => {
    btn.addEventListener('click', handlePremiumUpgrade);
  });
  
  // Payment modal button
  const paymentButton = document.getElementById('intaSendButton');
  if (paymentButton) {
    paymentButton.addEventListener('click', handlePayment);
  }
  
  // Tab navigation
  const tabLinks = document.querySelectorAll('.nav-link');
  tabLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all tabs
      tabLinks.forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      const tabName = this.dataset.tab;
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
  
  // Hero section buttons
  const startLearningBtn = document.querySelector('.cta-primary');
  const watchDemoBtn = document.querySelector('.cta-secondary');
  
  if (startLearningBtn) {
    startLearningBtn.addEventListener('click', () => {
      document.getElementById('generate-tab').scrollIntoView({ behavior: 'smooth' });
    });
  }
  
  if (watchDemoBtn) {
    watchDemoBtn.addEventListener('click', () => {
      alert('Demo video would play here in the full version.');
    });
  }
}

async function handleAuthClick() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // User is logged in, show profile menu or log out
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  } else {
    // User is not logged in, show auth modal
    showAuthModal();
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Show file preview
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('filePreview').classList.remove('hidden');
}

async function processUploadedFile() {
  const fileInput = document.getElementById('fileUpload');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Please select a file first.');
    return;
  }
  
  try {
    const text = await readFileAsText(file);
    document.querySelector('.notes-input').value = text;
  } catch (error) {
    console.error('Error reading file:', error);
    alert('Failed to read file. Please try again.');
  }
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Show image preview
  const previewImage = document.getElementById('previewImage');
  previewImage.src = URL.createObjectURL(file);
  document.getElementById('imagePreview').classList.remove('hidden');
}

async function extractTextFromImage() {
  const imageInput = document.getElementById('imageUpload');
  const file = imageInput.files[0];
  
  if (!file) {
    alert('Please select an image first.');
    return;
  }
  
  try {
    showLoading('Extracting text from image...');
    const text = await extractTextFromImageOCR(file);
    document.querySelector('.notes-input').value = text;
    hideLoading();
  } catch (error) {
    console.error('Error extracting text:', error);
    hideLoading();
    alert('Failed to extract text from image. Please try again.');
  }
}

async function handleRecordClick() {
  const recordBtn = document.getElementById('recordBtn');
  const recordingStatus = document.querySelector('.recording-status');
  const voiceActions = document.querySelector('.voice-actions');
  
  recordBtn.classList.toggle('recording');
  
  if (recordBtn.classList.contains('recording')) {
    recordBtn.innerHTML = '<i class="ri-stop-fill"></i> Stop Recording';
    if (recordingStatus) recordingStatus.classList.remove('hidden');
    if (voiceActions) voiceActions.classList.remove('hidden');
    
    // Simulate transcription
    setTimeout(() => {
      const transcriptPreview = document.getElementById('transcriptPreview');
      if (transcriptPreview) {
        transcriptPreview.textContent = "This is a simulated transcript of your voice recording. In the full version, this would be actual speech-to-text transcription.";
      }
    }, 2000);
  } else {
    recordBtn.innerHTML = '<i class="ri-mic-fill"></i> Start Recording';
    if (recordingStatus) recordingStatus.classList.add('hidden');
  }
}

async function saveTranscript() {
  const transcript = document.getElementById('transcriptPreview').textContent;
  document.querySelector('.notes-input').value = transcript;
}

async function handleGenerateFlashcards() {
  const inputText = document.querySelector('.notes-input').value;
  if (!inputText.trim()) {
    alert('Please enter some text or upload content first.');
    return;
  }
  
  try {
    showLoading('Generating flashcards...');
    
    // Generate flashcards using AI
    const flashcards = await generateFlashcardsAI(inputText);
    
    // Display flashcards
    displayFlashcards(flashcards);
    
    hideLoading();
  } catch (error) {
    console.error('Error generating flashcards:', error);
    hideLoading();
    alert('Failed to generate flashcards. Please try again.');
  }
}

function displayFlashcards(flashcards) {
  const flashcardsGrid = document.getElementById('flashcardsGrid');
  if (!flashcardsGrid) return;
  
  flashcardsGrid.innerHTML = '';
  
  flashcards.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'flashcard';
    cardElement.innerHTML = `
      <div class="flashcard-content">
        <h4>Card ${index + 1}</h4>
        <p><strong>Q:</strong> ${card.question}</p>
        <p><strong>A:</strong> ${card.answer}</p>
      </div>
    `;
    flashcardsGrid.appendChild(cardElement);
  });
  
  // Show results section
  document.getElementById('resultsSection').classList.remove('hidden');
}

async function handlePremiumUpgrade(event) {
  event.preventDefault();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Please sign in to upgrade to premium.');
    showAuthModal();
    return;
  }
  
  const planType = event.target.closest('.pricing-card').classList.contains('premium') ? 'monthly' : 'yearly';
  
  try {
    await handlePremiumUpgradePayment(user.id, planType);
  } catch (error) {
    console.error('Premium upgrade error:', error);
    alert('Failed to initialize payment. Please try again.');
  }
}

async function handlePayment() {
  // This would be called from the premium modal
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Please sign in to upgrade to premium.');
    showAuthModal();
    return;
  }
  
  try {
    await handlePremiumUpgradePayment(user.id, 'monthly');
  } catch (error) {
    console.error('Payment error:', error);
    alert('Failed to initialize payment. Please try again.');
  }
}

// Helper functions
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(reader.error);
    reader.readAsText(file);
  });
}

async function extractTextFromImageOCR(imageFile) {
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

async function generateFlashcardsAI(text) {
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
    return generateSimpleFlashcards(text);
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    // Fallback to simple generation
    return generateSimpleFlashcards(text);
  }
}

function generateSimpleFlashcards(text) {
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

async function handlePremiumUpgradePayment(userId, planType) {
  try {
    // Get user profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const amount = planType === 'monthly' ? 900 : 1900; // $9 or $19
    
    // Initialize payment with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount * 100, // Convert to kobo
        metadata: { userId, planType },
        callback_url: `${window.location.origin}/payment-verification.html`
      })
    });
    
    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message);
    }
    
    // Redirect to payment page
    window.location.href = data.data.authorization_url;
  } catch (error) {
    console.error('Premium upgrade error:', error);
    throw new Error('Failed to initialize payment');
  }
}

function showLoading(message = 'Loading...') {
  const loadingState = document.getElementById('loadingState');
  if (!loadingState) return;
  
  loadingState.querySelector('p').textContent = message;
  loadingState.classList.remove('hidden');
}

function hideLoading() {
  const loadingState = document.getElementById('loadingState');
  if (loadingState) loadingState.classList.add('hidden');
}

function showAuthModal() {
  // Implementation for showing auth modal
  alert('Auth modal would appear here. In a full implementation, this would show a login/signup form.');
}

function updateUIForAuthenticatedUser() {
  const authBtn = document.getElementById('authBtn');
  if (authBtn) {
    authBtn.innerHTML = '<i class="ri-user-line"></i> Sign Out';
  }
  
  // Load user data and study sets
  loadUserData();
  loadStudySets();
}

function updateUIForAnonymousUser() {
  const authBtn = document.getElementById('authBtn');
  if (authBtn) {
    authBtn.innerHTML = '<i class="ri-user-line"></i> Sign In';
  }
  
  // Clear user-specific data
}

async function loadUserData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    if (data && data.is_premium) {
      // User has premium, update UI accordingly
      document.querySelectorAll('.premium-only').forEach(el => {
        el.classList.remove('hidden');
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

async function loadStudySets() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data, error } = await supabase
      .from('study_sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Display study sets in the library tab
    displayStudySets(data);
  } catch (error) {
    console.error('Error loading study sets:', error);
  }
}

function displayStudySets(studySets) {
  const setsGrid = document.getElementById('setsGrid');
  if (!setsGrid) return;
  
  if (!studySets || studySets.length === 0) {
    setsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="ri-folder-open-line"></i>
        </div>
        <h3>No Study Sets Yet</h3>
        <p>Create your first study set to get started with learning!</p>
        <button class="empty-cta" onclick="switchToTab('generate')">
          <i class="ri-add-line"></i>
          Create First Set
        </button>
      </div>
    `;
    return;
  }
  
  setsGrid.innerHTML = '';
  
  studySets.forEach(set => {
    const setElement = document.createElement('div');
    setElement.className = 'study-set-card';
    setElement.innerHTML = `
      <div class="set-header">
        <h3>${set.title}</h3>
        <span class="set-subject">${set.subject || 'General'}</span>
      </div>
      <div class="set-content">
        <p>${set.description || 'No description available.'}</p>
      </div>
      <div class="set-footer">
        <span class="card-count">${set.card_count || 0} cards</span>
        <button class="study-set-btn">Study Now</button>
      </div>
    `;
    
    setsGrid.appendChild(setElement);
  });
}

// Utility function to switch tabs
function switchToTab(tabName) {
  // Remove active class from all tabs
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  
  // Add active class to target tab
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Make switchToTab available globally
window.switchToTab = switchToTab;