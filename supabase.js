import { createClient } from '@supabase/supabase-js'

// Define your Supabase URL and anon key
const supabaseUrl = 'https://pklaygtgyryexuyykvtf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbGF5Z3RneXJ5ZXh1eXlrdnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQ3MjEsImV4cCI6MjA3MjI5MDcyMX0.wFiSHjsg3oF5CdeRnRY5VTs6rhzJHJbVjT3B79EfAW0'

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions
export const studySetAPI = {
  // Get all study sets for the current user
  async getStudySets() {
    const { data, error } = await supabase
      .from('study_sets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create a new study set
  async createStudySet(setData) {
    const { data, error } = await supabase
      .from('study_sets')
      .insert([setData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Update a study set
  async updateStudySet(id, updates) {
    const { data, error } = await supabase
      .from('study_sets')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Delete a study set
  async deleteStudySet(id) {
    const { error } = await supabase
      .from('study_sets')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

export const flashcardAPI = {
  // Get all flashcards for a study set
  async getFlashcards(studySetId) {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('study_set_id', studySetId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Create multiple flashcards
  async createFlashcards(cards) {
    const { data, error } = await supabase
      .from('flashcards')
      .insert(cards)
      .select()
    
    if (error) throw error
    return data
  },

  // Update a flashcard
  async updateFlashcard(id, updates) {
    const { data, error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Delete a flashcard
  async deleteFlashcard(id) {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

export const userAPI = {
  // Get user profile
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) throw error
    return data
  },

  // Update user profile
  async updateProfile(updates) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
    
    if (error) throw error
    return data[0]
  }
}

// Note: Removed top-level await statements to fix Vite build compatibility
// Data loading is handled by the main application initialization