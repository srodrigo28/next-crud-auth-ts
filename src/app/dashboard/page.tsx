// src/app/dashboard/page.tsx
"use client"

import Navbar from "../../components/Navbar"
import ProductList from "./produto/page"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center px-4 sm:px-6 lg:px-8">
      <Navbar />
      <main className="flex flex-col items-center w-full max-w-5xl mx-auto">
        <ProductList />
      </main>
    </div>
  )
}