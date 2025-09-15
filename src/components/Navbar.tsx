// src/components/Navbar.tsx
"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import ProfileModal from "./ProfileModal" // Adjust path if needed
import Image from "next/image"
import Link from "next/link"
import { UserProfile } from "@/lib/types/profile"

export default function Navbar() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error("Erro ao buscar usuário:", userError?.message)
          router.push("/login")
          return
        }

        const { data, error: profileError } = await supabase
          .from("loja_perfil")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") { // No rows found
          console.error("Erro ao buscar perfil:", profileError.message)
          setError(profileError.message)
          return
        }

        let profileData: UserProfile
        if (!data) {
          const { data: newProfile, error: insertError } = await supabase
            .from("loja_perfil")
            .insert({
              user_id: user.id,
              nome: user.email?.split("@")[0] || "Usuário",
              email: user.email || "",
            })
            .select()
            .single()
          if (insertError) throw insertError
          profileData = newProfile as UserProfile
        } else {
          profileData = data as UserProfile
        }

        setUserProfile(profileData)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao carregar perfil."
        console.error("Erro inesperado:", errorMessage)
        setError(errorMessage)
      }
    }

    fetchUserData()
  }, [router])

  const openProfileModal = () => setIsModalOpen(true)
  const closeProfileModal = () => setIsModalOpen(false)

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (err: unknown) {
      console.error("Erro ao fazer logout:", err)
      setError("Erro ao fazer logout. Tente novamente.")
    }
  }

  return (
    <div>
      <nav className="bg-slate-800 p-4 w-screen px-10">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-white text-lg font-bold w-44">
            MyApp
          </Link>

          <div className="shadow-lg p-4 rounded-lg bg-gray-700 flex space-x-4">
            <Link href="/perfil" className="text-white mr-4">
              Perfil
            </Link>
            <Link href="/produtos" className="text-white">
              Produtos
            </Link>
            <Link href="/pedidos" className="text-white">
              Pedidos
            </Link>
            <Link href="/servicos" className="text-white">
              Serviços
            </Link>
          </div>

          <div className="flex items-center space-x-4 w-44">
            {error && <span className="text-red-500">{error}</span>}
            {userProfile ? (
              <div
                onClick={openProfileModal}
                className="flex items-center space-x-2 cursor-pointer transition-transform duration-200 hover:scale-105"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm">
                  {userProfile.foto_perfil ? (
                    <Image
                      src={userProfile.foto_perfil}
                      alt="Foto de perfil"
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-lg font-bold">
                      {userProfile.nome ? userProfile.nome.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                </div>
                <span className="text-white text-md font-medium hidden md:block">
                  {userProfile.nome || "Usuário"}
                </span>
              </div>
            ) : (
              <span className="text-white">Carregando...</span>
            )}

            <button
              onClick={handleLogout}
              className="text-white px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {isModalOpen && userProfile && (
        <ProfileModal
          isOpen={isModalOpen}
          onClose={closeProfileModal}
          userProfile={userProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  )
}