export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  href: string;
}

export const categories: Category[] = [
  {
    id: "facial",
    name: "Cuidado facial",
    description: "Rutinas para una piel que se siente tan bien como se ve.",
    image: "/images/categories/facial.jpg",
    href: "/catalogo?category=facial",
  },
  {
    id: "capilar",
    name: "Cuidado capilar",
    description: "Descubre productos pensados para cuidar tu cabello.",
    image: "/images/categories/capilar.jpg",
    href: "/catalogo?category=capilar",
  },
  {
    id: "bienestar",
    name: "Bienestar",
    description: "Pequeños hábitos para sentirte mejor todos los días.",
    image: "/images/categories/bienestar.jpg",
    href: "/catalogo?category=bienestar",
  },
  {
    id: "suplementos",
    name: "Suplementos",
    description: "Complementa tu rutina con nuestra selección.",
    image: "/images/categories/suplementos.jpg",
    href: "/catalogo?category=suplementos",
  },
];