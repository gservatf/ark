import type { Proveedor } from "@/types/domain";

export const mockProviders: Proveedor[] = [
  {
    id: "prov-unacem",
    nombre: "Unacem",
    ruc: "20100137390",
    contacto: "Carla Mendoza",
    telefono: "987 452 110",
    email: "ventas@unacem.pe",
    direccion: "Av. Atocongo 2440, Lima",
    notas: "Proveedor principal de cemento.",
    disponible_para_cliente: true,
    estado: "activo",
    created_at: "2026-03-12",
    updated_at: "2026-05-08"
  },
  {
    id: "prov-cantera-san-pedro",
    nombre: "Cantera San Pedro",
    ruc: "20544578122",
    contacto: "Miguel Torres",
    telefono: "981 004 889",
    email: "cotizaciones@sanpedro.pe",
    direccion: "Lurin, Lima",
    notas: "Agregados por volumen.",
    disponible_para_cliente: true,
    estado: "activo",
    created_at: "2026-03-14",
    updated_at: "2026-05-07"
  },
  {
    id: "prov-mano-obra-sac",
    nombre: "Mano de Obra SAC",
    ruc: "20488933118",
    contacto: "Rosa Huaman",
    telefono: "999 113 820",
    email: "operaciones@manoobra.pe",
    direccion: "Los Olivos, Lima",
    notas: "Cuadrillas para obra civil.",
    disponible_para_cliente: false,
    estado: "activo",
    created_at: "2026-03-18",
    updated_at: "2026-05-02"
  },
  {
    id: "prov-alquileres-sur",
    nombre: "Alquileres del Sur",
    ruc: "20677120452",
    contacto: "Fernando Rivas",
    telefono: "975 650 441",
    email: "reservas@alquileressur.pe",
    direccion: "Villa El Salvador, Lima",
    notas: "Equipos menores y maquinaria ligera.",
    disponible_para_cliente: true,
    estado: "activo",
    created_at: "2026-04-01",
    updated_at: "2026-05-09"
  }
];
