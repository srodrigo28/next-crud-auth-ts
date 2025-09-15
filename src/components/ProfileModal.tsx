// src/components/ProfileModal.tsx
"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { UserProfile } from "@/lib/types/profile"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile: UserProfile
  onProfileUpdate: (updatedProfile: UserProfile) => void
}

export default function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdate,
}: ProfileModalProps) {
  const [formData, setFormData] = useState<UserProfile>(userProfile)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(userProfile.foto_perfil || null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFormData(userProfile)
    setImagePreview(userProfile.foto_perfil || null)
    setImageFile(null)
  }, [userProfile])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImageFile(null)
      setImagePreview(userProfile.foto_perfil || null)
    }
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let imageUrl = userProfile.foto_perfil || null

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `profiles/${userProfile.user_id}/${fileName}`

        if (userProfile.foto_perfil) {
          const oldFilePath = userProfile.foto_perfil.split("/").pop()
          if (oldFilePath) {
            await supabase.storage.from("box").remove([`profiles/${userProfile.user_id}/${oldFilePath}`])
          }
        }

        const { error: uploadError } = await supabase.storage
          .from("box")
          .upload(filePath, imageFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from("box").getPublicUrl(filePath)
        imageUrl = publicUrlData.publicUrl
      }

      const profileDataToSave: Partial<UserProfile> = {
        nome: formData.nome,
        email: formData.email,
        foto_perfil: imageUrl,
      }

      const { data, error } = await supabase
        .from("loja_perfil")
        .update(profileDataToSave)
        .eq("user_id", userProfile.user_id)
        .select()
        .single()

      if (error) throw error

      onProfileUpdate(data as UserProfile)
      onClose()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar perfil."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Editar Perfil</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSaveProfile}>
          <div className="mb-4">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="foto_perfil" className="block text-sm font-medium text-gray-700">
              Foto de Perfil
            </label>
            <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-gray-200 mb-4">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Prévia do perfil"
                  fill
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  Sem imagem
                </div>
              )}
            </div>
            <input
              type="file"
              id="foto_perfil"
              name="foto_perfil"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500"
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-400"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}