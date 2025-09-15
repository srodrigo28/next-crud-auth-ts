// src/types/product.ts

export interface ProductData {
  id: string;
  user_id: string;
  nome: string;
  preco: number;
  descricao?: string | null;
  imagem?: string | null;
  created_at: string;
}