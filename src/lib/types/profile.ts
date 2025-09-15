// src/lib/types/profile.ts
export interface UserProfile {
  id: string // Changed from number to string to match uuid
  user_id: string
  nome: string
  email: string
  foto_perfil?: string | null
}