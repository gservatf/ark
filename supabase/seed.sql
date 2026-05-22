-- C y P - Seed data Peru.
-- Run after all migrations in supabase/migrations/.

insert into public.proveedores (
  id,
  nombre,
  ruc,
  contacto,
  telefono,
  email,
  direccion,
  notas,
  disponible_para_cliente,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000101', 'Unacem', '20100137390', 'Carla Mendoza', '987 452 110', 'ventas@unacem.pe', 'Av. Atocongo 2440, Lima', 'Proveedor principal de cemento y aditivos.', true, '2026-03-12 09:00:00-05', '2026-05-08 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000102', 'Cantera San Pedro', '20544578122', 'Miguel Torres', '981 004 889', 'cotizaciones@sanpedro.pe', 'Lurin, Lima', 'Agregados por volumen para Lima Metropolitana.', true, '2026-03-14 09:00:00-05', '2026-05-07 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000103', 'Mano de Obra SAC', '20488933118', 'Rosa Huaman', '999 113 820', 'operaciones@manoobra.pe', 'Los Olivos, Lima', 'Cuadrillas para obra civil y acabados.', false, '2026-03-18 09:00:00-05', '2026-05-02 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000104', 'Alquileres del Sur', '20677120452', 'Fernando Rivas', '975 650 441', 'reservas@alquileressur.pe', 'Villa El Salvador, Lima', 'Equipos menores y maquinaria ligera.', true, '2026-04-01 09:00:00-05', '2026-05-09 09:00:00-05');

insert into public.recursos (
  id,
  nombre,
  tipo,
  unidad,
  costo_unitario_actual,
  proveedor_id,
  transporte_aplica,
  costo_transporte,
  especificacion,
  marca,
  fuente_precio,
  fecha_actualizacion_precio,
  estado,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000201', 'Cemento Portland Tipo I', 'material', 'bol', 32.00, '00000000-0000-0000-0000-000000000101', true, 2.50, 'Bolsa de 42.5 kg para concreto estructural.', 'Sol', 'Cotizacion proveedor', '2026-05-08', 'activo', '2026-03-12 09:00:00-05', '2026-05-08 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000202', 'Arena gruesa', 'material', 'm3', 80.00, '00000000-0000-0000-0000-000000000102', true, 15.00, 'Agregado lavado para concreto y mortero.', null, 'Lista mayo 2026', '2026-05-07', 'activo', '2026-03-15 09:00:00-05', '2026-05-07 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000203', 'Piedra chancada 1/2"', 'material', 'm3', 90.00, '00000000-0000-0000-0000-000000000102', true, 18.00, 'Agregado grueso para concreto.', null, 'Lista mayo 2026', '2026-05-07', 'activo', '2026-03-15 09:00:00-05', '2026-05-07 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000204', 'Agua', 'material', 'm3', 8.00, null, false, 0.00, 'Agua para mezcla y curado.', null, 'Tarifa local referencial', '2026-05-01', 'activo', '2026-03-20 09:00:00-05', '2026-05-01 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000205', 'Aditivo impermeabilizante', 'material', 'lt', 18.00, '00000000-0000-0000-0000-000000000101', false, 0.00, 'Aditivo liquido para morteros.', 'Sika', 'Cotizacion proveedor', '2026-04-28', 'inactivo', '2026-03-22 09:00:00-05', '2026-04-28 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000206', 'Maestro de obra', 'mano_obra', 'jor', 90.00, '00000000-0000-0000-0000-000000000103', false, 0.00, 'Jornada de 8 horas.', null, 'Tarifario interno', '2026-05-02', 'activo', '2026-03-18 09:00:00-05', '2026-05-02 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000207', 'Operario', 'mano_obra', 'jor', 78.00, '00000000-0000-0000-0000-000000000103', false, 0.00, 'Jornada de 8 horas.', null, 'Tarifario interno', '2026-05-02', 'activo', '2026-03-18 09:00:00-05', '2026-05-02 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000208', 'Oficial', 'mano_obra', 'jor', 70.00, '00000000-0000-0000-0000-000000000103', false, 0.00, 'Jornada de 8 horas.', null, 'Tarifario interno', '2026-05-02', 'activo', '2026-03-18 09:00:00-05', '2026-05-02 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000209', 'Peon', 'mano_obra', 'jor', 60.00, '00000000-0000-0000-0000-000000000103', false, 0.00, 'Jornada de 8 horas.', null, 'Tarifario interno', '2026-05-02', 'activo', '2026-03-18 09:00:00-05', '2026-05-02 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000210', 'Mezcladora 9 - 11 p3', 'equipo', 'hm', 25.00, '00000000-0000-0000-0000-000000000104', true, 5.00, 'Incluye mantenimiento preventivo.', 'Honda', 'Contrato marco', '2026-05-09', 'activo', '2026-04-02 09:00:00-05', '2026-05-09 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000211', 'Herramientas manuales', 'herramienta', '%mo', 3.00, '00000000-0000-0000-0000-000000000104', false, 0.00, 'Factor referencial sobre mano de obra.', null, 'Analisis interno', '2026-05-01', 'activo', '2026-04-03 09:00:00-05', '2026-05-01 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000212', 'Porcelanato 60x60', 'material', 'm2', 42.00, null, true, 4.00, 'Porcelanato nacional para piso.', null, 'Cotizacion local', '2026-05-05', 'activo', '2026-04-10 09:00:00-05', '2026-05-05 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000213', 'Pintura latex lavable', 'material', 'gal', 85.00, null, false, 0.00, 'Pintura latex para interiores.', null, 'Cotizacion local', '2026-05-05', 'activo', '2026-04-11 09:00:00-05', '2026-05-05 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000214', 'Placa drywall 12.5 mm', 'material', 'und', 38.00, null, true, 3.00, 'Placa yeso estandar 1.22 x 2.44 m.', null, 'Cotizacion local', '2026-05-05', 'activo', '2026-04-11 09:00:00-05', '2026-05-05 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000215', 'Puerta de madera contraplacada', 'material', 'und', 280.00, null, true, 20.00, 'Puerta interior contraplacada lista para acabado.', null, 'Cotizacion carpinteria', '2026-05-06', 'activo', '2026-04-13 09:00:00-05', '2026-05-06 09:00:00-05');

insert into public.recurso_precios_historial (
  id,
  recurso_id,
  costo_unitario_anterior,
  costo_unitario_nuevo,
  costo_transporte_anterior,
  costo_transporte_nuevo,
  fuente_precio,
  fecha,
  notas
) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 30.80, 32.00, 2.20, 2.50, 'Cotizacion proveedor', '2026-05-08 10:00:00-05', 'Ajuste por nueva lista de mayo.'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000202', 76.00, 80.00, 12.00, 15.00, 'Lista mayo 2026', '2026-05-07 10:00:00-05', 'Mayor costo logistico por distancia.'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000206', 86.00, 90.00, 0.00, 0.00, 'Tarifario interno', '2026-05-02 10:00:00-05', 'Actualizacion de jornal.'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000210', 23.00, 25.00, 4.00, 5.00, 'Contrato marco', '2026-05-09 10:00:00-05', 'Renovacion de tarifa por hora maquina.');

insert into public.partidas (
  id,
  codigo,
  nombre,
  unidad,
  categoria,
  descripcion,
  especificaciones,
  rendimiento,
  cuadrilla,
  estado,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000401', '01.01.01', 'Tarrajeo en muros interiores', 'm2', 'Arquitectura', 'Acabado con mortero cemento-arena para muros interiores.', 'Incluye preparacion de superficie, aplicacion y curado inicial.', 12.00, '1 maestro + 2 peones', 'activo', '2026-04-02 09:00:00-05', '2026-05-10 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000402', '02.03.01', 'Concreto f''c=210 kg/cm2', 'm3', 'Estructuras', 'Concreto preparado en obra para elementos estructurales.', 'Dosificacion referencial para resistencia de 210 kg/cm2.', 8.00, '1 maestro + 2 peones + mezcladora', 'activo', '2026-04-08 09:00:00-05', '2026-05-09 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000403', '03.02.04', 'Piso porcelanato 60x60', 'm2', 'Acabados', 'Instalacion de porcelanato en piso con adhesivo cementicio.', 'Incluye alineamiento, nivelacion y limpieza final.', 18.00, '1 operario + 1 peon', 'activo', '2026-04-12 09:00:00-05', '2026-05-07 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000404', '04.01.02', 'Pintura latex en muros y cielos', 'm2', 'Acabados', 'Aplicacion de pintura latex en dos manos sobre superficie preparada.', 'Incluye lijado fino y resanes menores.', 30.00, '1 operario + 1 peon', 'activo', '2026-04-15 09:00:00-05', '2026-05-01 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000405', '05.02.01', 'Muro drywall e=12.5mm', 'm2', 'Arquitectura', 'Tabiqueria drywall con placa de yeso de 12.5 mm.', 'Incluye estructura metalica liviana, fijaciones y tratamiento de juntas.', 16.00, '1 operario + 1 oficial', 'activo', '2026-04-18 09:00:00-05', '2026-05-06 09:00:00-05'),
  ('00000000-0000-0000-0000-000000000406', '06.01.01', 'Puerta de madera contraplacada', 'und', 'Carpinteria', 'Suministro e instalacion de puerta interior contraplacada.', 'Incluye colocacion, aplome y ajuste inicial.', 4.00, '1 operario + 1 oficial', 'activo', '2026-04-20 09:00:00-05', '2026-05-06 09:00:00-05');

insert into public.partida_recursos (
  id,
  partida_id,
  recurso_id,
  grupo,
  cantidad,
  unidad,
  costo_unitario_snapshot,
  costo_transporte_snapshot,
  rendimiento_factor,
  desperdicio_porcentaje,
  parcial,
  orden
) values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000201', 'materiales', 0.220000, 'bol', 32.00, 2.50, 1.000000, 4.0000, 7.8716, 1),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000202', 'materiales', 0.025000, 'm3', 80.00, 15.00, 1.000000, 5.0000, 2.4750, 2),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000206', 'mano_obra', 0.080000, 'jor', 90.00, 0.00, 1.000000, 0.0000, 7.2000, 3),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000209', 'mano_obra', 0.160000, 'jor', 60.00, 0.00, 1.000000, 0.0000, 9.6000, 4),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000210', 'equipos_herramientas', 0.040000, 'hm', 25.00, 5.00, 1.000000, 0.0000, 1.2000, 5),
  ('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000201', 'materiales', 8.500000, 'bol', 32.00, 2.50, 1.000000, 3.0000, 301.4100, 1),
  ('00000000-0000-0000-0000-000000000507', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000202', 'materiales', 0.480000, 'm3', 80.00, 15.00, 1.000000, 5.0000, 47.5200, 2),
  ('00000000-0000-0000-0000-000000000508', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000203', 'materiales', 0.650000, 'm3', 90.00, 18.00, 1.000000, 5.0000, 73.1250, 3),
  ('00000000-0000-0000-0000-000000000509', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000204', 'materiales', 0.180000, 'm3', 8.00, 0.00, 1.000000, 0.0000, 1.4400, 4),
  ('00000000-0000-0000-0000-000000000510', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000206', 'mano_obra', 0.120000, 'jor', 90.00, 0.00, 1.000000, 0.0000, 10.8000, 5),
  ('00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000209', 'mano_obra', 0.280000, 'jor', 60.00, 0.00, 1.000000, 0.0000, 16.8000, 6),
  ('00000000-0000-0000-0000-000000000512', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000210', 'equipos_herramientas', 0.350000, 'hm', 25.00, 5.00, 1.000000, 0.0000, 10.5000, 7),
  ('00000000-0000-0000-0000-000000000513', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000212', 'materiales', 1.050000, 'm2', 42.00, 4.00, 1.000000, 3.0000, 49.2030, 1),
  ('00000000-0000-0000-0000-000000000514', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000207', 'mano_obra', 0.070000, 'jor', 78.00, 0.00, 1.000000, 0.0000, 5.4600, 2),
  ('00000000-0000-0000-0000-000000000515', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000209', 'mano_obra', 0.080000, 'jor', 60.00, 0.00, 1.000000, 0.0000, 4.8000, 3),
  ('00000000-0000-0000-0000-000000000516', '00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000213', 'materiales', 0.030000, 'gal', 85.00, 0.00, 1.000000, 4.0000, 2.6520, 1),
  ('00000000-0000-0000-0000-000000000517', '00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000207', 'mano_obra', 0.040000, 'jor', 78.00, 0.00, 1.000000, 0.0000, 3.1200, 2),
  ('00000000-0000-0000-0000-000000000518', '00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000214', 'materiales', 0.700000, 'und', 38.00, 3.00, 1.000000, 5.0000, 29.9300, 1),
  ('00000000-0000-0000-0000-000000000519', '00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000207', 'mano_obra', 0.060000, 'jor', 78.00, 0.00, 1.000000, 0.0000, 4.6800, 2),
  ('00000000-0000-0000-0000-000000000520', '00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000215', 'materiales', 1.000000, 'und', 280.00, 20.00, 1.000000, 2.0000, 305.6000, 1),
  ('00000000-0000-0000-0000-000000000521', '00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000207', 'mano_obra', 0.250000, 'jor', 78.00, 0.00, 1.000000, 0.0000, 19.5000, 2);

insert into public.presupuestos (
  id,
  proyecto_nombre,
  cliente,
  ubicacion,
  version,
  estado,
  moneda,
  gastos_generales_porcentaje,
  utilidad_porcentaje,
  igv_porcentaje,
  subtotal,
  gastos_generales_total,
  utilidad_total,
  subtotal_con_margen,
  igv_total,
  total,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000601',
  'Edificio Multifamiliar Los Olivos',
  'Inmobiliaria Los Olivos SAC',
  'Lima, Peru',
  'Version 3',
  'borrador',
  'PEN',
  10.0000,
  10.0000,
  18.0000,
  43732.6250,
  4373.2625,
  4373.2625,
  52479.1500,
  9446.2470,
  61925.3970,
  '2026-05-01 09:00:00-05',
  '2026-05-13 09:00:00-05'
);

insert into public.presupuesto_partidas (
  id,
  presupuesto_id,
  partida_id,
  codigo_snapshot,
  nombre_snapshot,
  unidad_snapshot,
  categoria_snapshot,
  descripcion_snapshot,
  especificaciones_snapshot,
  rendimiento_snapshot,
  cuadrilla_snapshot,
  metrado,
  precio_unitario_snapshot,
  parcial,
  orden
) values
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000401', '01.01.01', 'Tarrajeo en muros interiores', 'm2', 'Arquitectura', 'Acabado con mortero cemento-arena para muros interiores.', 'Incluye preparacion de superficie, aplicacion y curado inicial.', 12.0000, '1 maestro + 2 peones', 350.000000, 34.0159, 11905.5650, 1),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000402', '02.03.01', 'Concreto f''c=210 kg/cm2', 'm3', 'Estructuras', 'Concreto preparado en obra para elementos estructurales.', 'Dosificacion referencial para resistencia de 210 kg/cm2.', 8.0000, '1 maestro + 2 peones + mezcladora', 42.000000, 553.9140, 23264.3880, 2),
  ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000403', '03.02.04', 'Piso porcelanato 60x60', 'm2', 'Acabados', 'Instalacion de porcelanato en piso con adhesivo cementicio.', 'Incluye alineamiento, nivelacion y limpieza final.', 18.0000, '1 operario + 1 peon', 120.000000, 71.3556, 8562.6720, 3);

insert into public.presupuesto_partida_recursos (
  id,
  presupuesto_id,
  presupuesto_partida_id,
  partida_recurso_id,
  recurso_id,
  nombre_snapshot,
  tipo_snapshot,
  unidad_snapshot,
  costo_unitario_snapshot,
  costo_transporte_snapshot,
  proveedor_id_snapshot,
  proveedor_nombre_snapshot,
  fuente_precio_snapshot,
  fecha_precio_snapshot,
  grupo,
  cantidad,
  unidad,
  rendimiento_factor,
  desperdicio_porcentaje,
  parcial_snapshot,
  orden
)
select
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000601',
  case pr.partida_id
    when '00000000-0000-0000-0000-000000000401' then '00000000-0000-0000-0000-000000000701'::uuid
    when '00000000-0000-0000-0000-000000000402' then '00000000-0000-0000-0000-000000000702'::uuid
    when '00000000-0000-0000-0000-000000000403' then '00000000-0000-0000-0000-000000000703'::uuid
  end,
  pr.id,
  r.id,
  r.nombre,
  r.tipo,
  r.unidad,
  pr.costo_unitario_snapshot,
  pr.costo_transporte_snapshot,
  r.proveedor_id,
  p.nombre,
  r.fuente_precio,
  r.fecha_actualizacion_precio,
  pr.grupo,
  pr.cantidad,
  pr.unidad,
  pr.rendimiento_factor,
  pr.desperdicio_porcentaje,
  pr.parcial,
  pr.orden
from public.partida_recursos pr
join public.recursos r on r.id = pr.recurso_id
left join public.proveedores p on p.id = r.proveedor_id
where pr.partida_id in (
  '00000000-0000-0000-0000-000000000401',
  '00000000-0000-0000-0000-000000000402',
  '00000000-0000-0000-0000-000000000403'
);

insert into public.organizaciones (
  id,
  nombre,
  ruc,
  estado,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000901',
  'Constructora Demo SAC',
  '20600000001',
  'activo',
  '2026-05-01 09:00:00-05',
  '2026-05-15 09:00:00-05'
);

update public.proveedores
set organizacion_id = '00000000-0000-0000-0000-000000000901'
where id in (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000104'
);

update public.recursos
set organizacion_id = '00000000-0000-0000-0000-000000000901'
where id between '00000000-0000-0000-0000-000000000201' and '00000000-0000-0000-0000-000000000215';

insert into public.recurso_proveedor_precios (
  id,
  organizacion_id,
  recurso_id,
  proveedor_id,
  costo_unitario,
  costo_transporte,
  moneda,
  fecha_cotizacion,
  vigente_desde,
  fuente_precio,
  url_referencia,
  es_preferido_interno,
  estado,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 32.00, 2.50, 'PEN', '2026-05-08', '2026-05-08', 'Cotizacion proveedor', 'https://demo.local/cotizaciones/unacem-cemento', true, 'activo', '2026-05-08 09:00:00-05', '2026-05-08 09:00:00-05'),
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', 33.40, 3.20, 'PEN', '2026-05-09', '2026-05-09', 'Cotizacion alternativa', 'https://demo.local/cotizaciones/cantera-cemento', false, 'activo', '2026-05-09 09:00:00-05', '2026-05-09 09:00:00-05'),
  ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 80.00, 15.00, 'PEN', '2026-05-07', '2026-05-07', 'Lista mayo 2026', 'https://demo.local/cotizaciones/arena-san-pedro', true, 'activo', '2026-05-07 09:00:00-05', '2026-05-07 09:00:00-05'),
  ('00000000-0000-0000-0000-000000001004', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000102', 90.00, 18.00, 'PEN', '2026-05-07', '2026-05-07', 'Lista mayo 2026', 'https://demo.local/cotizaciones/piedra-san-pedro', true, 'activo', '2026-05-07 09:00:00-05', '2026-05-07 09:00:00-05'),
  ('00000000-0000-0000-0000-000000001005', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000103', 90.00, 0.00, 'PEN', '2026-05-02', '2026-05-02', 'Tarifario interno', 'https://demo.local/cotizaciones/mo-maestro', true, 'activo', '2026-05-02 09:00:00-05', '2026-05-02 09:00:00-05'),
  ('00000000-0000-0000-0000-000000001006', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000103', 78.00, 0.00, 'PEN', '2026-05-02', '2026-05-02', 'Tarifario interno', 'https://demo.local/cotizaciones/mo-operario', true, 'activo', '2026-05-02 09:00:00-05', '2026-05-02 09:00:00-05'),
  ('00000000-0000-0000-0000-000000001007', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000103', 60.00, 0.00, 'PEN', '2026-05-02', '2026-05-02', 'Tarifario interno', 'https://demo.local/cotizaciones/mo-peon', true, 'activo', '2026-05-02 09:00:00-05', '2026-05-02 09:00:00-05'),
  ('00000000-0000-0000-0000-000000001008', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000104', 25.00, 5.00, 'PEN', '2026-05-09', '2026-05-09', 'Contrato marco', 'https://demo.local/cotizaciones/mezcladora-sur', true, 'activo', '2026-05-09 09:00:00-05', '2026-05-09 09:00:00-05'),
  ('00000000-0000-0000-0000-000000001009', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000101', 42.00, 4.00, 'PEN', '2026-05-05', '2026-05-05', 'Cotizacion local', 'https://demo.local/cotizaciones/porcelanato-unacem', true, 'activo', '2026-05-05 09:00:00-05', '2026-05-05 09:00:00-05'),
  ('00000000-0000-0000-0000-000000001010', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000102', 43.50, 5.50, 'PEN', '2026-05-06', '2026-05-06', 'Cotizacion cliente alternativa', 'https://demo.local/cotizaciones/porcelanato-san-pedro', false, 'activo', '2026-05-06 09:00:00-05', '2026-05-06 09:00:00-05');

update public.partidas
set organizacion_id = '00000000-0000-0000-0000-000000000901'
where id between '00000000-0000-0000-0000-000000000401' and '00000000-0000-0000-0000-000000000406';

update public.presupuestos
set organizacion_id = '00000000-0000-0000-0000-000000000901'
where id = '00000000-0000-0000-0000-000000000601';

insert into public.proyectos (
  id,
  organizacion_id,
  nombre,
  cliente,
  ubicacion,
  codigo,
  descripcion,
  estado,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000902',
  '00000000-0000-0000-0000-000000000901',
  'Edificio Multifamiliar Los Olivos',
  'Inmobiliaria Los Olivos SAC',
  'Lima, Peru',
  'PROY-LOS-OLIVOS',
  'Proyecto demo para validar borradores colaborativos y versiones oficiales congeladas.',
  'activo',
  '2026-05-01 09:00:00-05',
  '2026-05-15 09:00:00-05'
);

insert into public.presupuesto_borradores (
  id,
  organizacion_id,
  proyecto_id,
  nombre,
  cliente,
  ubicacion,
  estado,
  moneda,
  gastos_generales_porcentaje,
  utilidad_porcentaje,
  igv_porcentaje,
  subtotal,
  gastos_generales_total,
  utilidad_total,
  subtotal_con_margen,
  igv_total,
  total,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000903',
  '00000000-0000-0000-0000-000000000901',
  '00000000-0000-0000-0000-000000000902',
  'Presupuesto base',
  'Inmobiliaria Los Olivos SAC',
  'Lima, Peru',
  'activo',
  'PEN',
  10.0000,
  10.0000,
  18.0000,
  43732.6250,
  4373.2625,
  4373.2625,
  52479.1500,
  9446.2470,
  61925.3970,
  '2026-05-01 09:00:00-05',
  '2026-05-15 09:00:00-05'
);

insert into public.presupuesto_borrador_partidas (
  id,
  presupuesto_borrador_id,
  partida_id,
  codigo_snapshot,
  nombre_snapshot,
  unidad_snapshot,
  categoria_snapshot,
  descripcion_snapshot,
  especificaciones_snapshot,
  rendimiento_snapshot,
  cuadrilla_snapshot,
  metrado,
  precio_unitario_actual,
  precio_fijado,
  autoactualizar_precio,
  precio_origen,
  parcial,
  orden
)
select
  case pp.orden
    when 1 then '00000000-0000-0000-0000-000000000904'::uuid
    when 2 then '00000000-0000-0000-0000-000000000905'::uuid
    when 3 then '00000000-0000-0000-0000-000000000906'::uuid
  end,
  '00000000-0000-0000-0000-000000000903',
  pp.partida_id,
  pp.codigo_snapshot,
  pp.nombre_snapshot,
  pp.unidad_snapshot,
  pp.categoria_snapshot,
  pp.descripcion_snapshot,
  pp.especificaciones_snapshot,
  pp.rendimiento_snapshot,
  pp.cuadrilla_snapshot,
  pp.metrado,
  pp.precio_unitario_snapshot,
  false,
  true,
  'catalogo',
  pp.parcial,
  pp.orden
from public.presupuesto_partidas pp
where pp.presupuesto_id = '00000000-0000-0000-0000-000000000601';

insert into public.presupuesto_borrador_partida_recursos (
  id,
  presupuesto_borrador_id,
  presupuesto_borrador_partida_id,
  partida_recurso_id,
  recurso_id,
  nombre_snapshot,
  tipo_snapshot,
  unidad_snapshot,
  costo_unitario_actual,
  costo_transporte_actual,
  proveedor_id_snapshot,
  proveedor_nombre_snapshot,
  fuente_precio_snapshot,
  fecha_precio_snapshot,
  grupo,
  cantidad,
  unidad,
  rendimiento_factor,
  desperdicio_porcentaje,
  precio_fijado,
  autoactualizar_precio,
  precio_origen,
  parcial_actual,
  orden
)
select
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000903',
  case ppr.presupuesto_partida_id
    when '00000000-0000-0000-0000-000000000701' then '00000000-0000-0000-0000-000000000904'::uuid
    when '00000000-0000-0000-0000-000000000702' then '00000000-0000-0000-0000-000000000905'::uuid
    when '00000000-0000-0000-0000-000000000703' then '00000000-0000-0000-0000-000000000906'::uuid
  end,
  ppr.partida_recurso_id,
  ppr.recurso_id,
  ppr.nombre_snapshot,
  ppr.tipo_snapshot,
  ppr.unidad_snapshot,
  ppr.costo_unitario_snapshot,
  ppr.costo_transporte_snapshot,
  ppr.proveedor_id_snapshot,
  ppr.proveedor_nombre_snapshot,
  ppr.fuente_precio_snapshot,
  ppr.fecha_precio_snapshot,
  ppr.grupo,
  ppr.cantidad,
  ppr.unidad,
  ppr.rendimiento_factor,
  ppr.desperdicio_porcentaje,
  false,
  true,
  'catalogo',
  ppr.parcial_snapshot,
  ppr.orden
from public.presupuesto_partida_recursos ppr
where ppr.presupuesto_id = '00000000-0000-0000-0000-000000000601';

with resolved as (
  select
    pbr.id,
    internal_quote.id as cotizacion_interna_id,
    coalesce(client_quote.id, fallback_quote.id) as cotizacion_cliente_id,
    coalesce(
      client_quote.costo_unitario + client_quote.costo_transporte,
      fallback_quote.costo_unitario + fallback_quote.costo_transporte,
      pbr.costo_unitario_actual + pbr.costo_transporte_actual
    ) as precio_cliente_actual,
    case
      when client_quote.id is not null then 'proveedor_visible'
      else 'fallback_general'
    end as precio_cliente_origen,
    case
      when client_quote.id is null then 'No hay cotizacion de proveedor visible para cliente; se uso el precio general mas alto disponible.'
      else null
    end as precio_cliente_advertencia
  from public.presupuesto_borrador_partida_recursos pbr
  left join lateral (
    select q.*
    from public.recurso_proveedor_precios q
    where q.recurso_id = pbr.recurso_id
      and q.organizacion_id = '00000000-0000-0000-0000-000000000901'
      and q.estado = 'activo'
    order by q.es_preferido_interno desc, q.fecha_cotizacion desc nulls last, q.created_at desc
    limit 1
  ) internal_quote on true
  left join lateral (
    select q.*
    from public.recurso_proveedor_precios q
    join public.proveedores p on p.id = q.proveedor_id
    where q.recurso_id = pbr.recurso_id
      and q.organizacion_id = '00000000-0000-0000-0000-000000000901'
      and q.estado = 'activo'
      and p.estado = 'activo'
      and p.disponible_para_cliente
    order by (q.costo_unitario + q.costo_transporte) desc, q.fecha_cotizacion desc nulls last, q.created_at desc
    limit 1
  ) client_quote on true
  left join lateral (
    select q.*
    from public.recurso_proveedor_precios q
    where q.recurso_id = pbr.recurso_id
      and q.organizacion_id = '00000000-0000-0000-0000-000000000901'
      and q.estado = 'activo'
    order by (q.costo_unitario + q.costo_transporte) desc, q.fecha_cotizacion desc nulls last, q.created_at desc
    limit 1
  ) fallback_quote on true
  where pbr.presupuesto_borrador_id = '00000000-0000-0000-0000-000000000903'
    and pbr.recurso_id is not null
)
update public.presupuesto_borrador_partida_recursos pbr
set
  cotizacion_interna_id = resolved.cotizacion_interna_id,
  cotizacion_cliente_id = resolved.cotizacion_cliente_id,
  precio_cliente_actual = resolved.precio_cliente_actual,
  precio_cliente_origen = resolved.precio_cliente_origen,
  precio_cliente_advertencia = resolved.precio_cliente_advertencia
from resolved
where pbr.id = resolved.id;

insert into public.presupuesto_versiones (
  id,
  organizacion_id,
  proyecto_id,
  presupuesto_borrador_id,
  numero_version,
  nombre,
  cliente,
  ubicacion,
  estado,
  moneda,
  gastos_generales_porcentaje,
  utilidad_porcentaje,
  igv_porcentaje,
  subtotal,
  gastos_generales_total,
  utilidad_total,
  subtotal_con_margen,
  igv_total,
  total,
  emitida_at,
  created_at
) values (
  '00000000-0000-0000-0000-000000000907',
  '00000000-0000-0000-0000-000000000901',
  '00000000-0000-0000-0000-000000000902',
  '00000000-0000-0000-0000-000000000903',
  1,
  'Edificio Multifamiliar Los Olivos_Presupuesto_V1',
  'Inmobiliaria Los Olivos SAC',
  'Lima, Peru',
  'emitida',
  'PEN',
  10.0000,
  10.0000,
  18.0000,
  43732.6250,
  4373.2625,
  4373.2625,
  52479.1500,
  9446.2470,
  61925.3970,
  '2026-05-15 09:00:00-05',
  '2026-05-15 09:00:00-05'
);

insert into public.presupuesto_version_partidas (
  id,
  presupuesto_version_id,
  partida_id,
  codigo_snapshot,
  nombre_snapshot,
  unidad_snapshot,
  categoria_snapshot,
  descripcion_snapshot,
  especificaciones_snapshot,
  rendimiento_snapshot,
  cuadrilla_snapshot,
  metrado,
  precio_unitario_snapshot,
  precio_fijado_snapshot,
  precio_origen_snapshot,
  parcial_snapshot,
  orden
)
select
  case pp.orden
    when 1 then '00000000-0000-0000-0000-000000000908'::uuid
    when 2 then '00000000-0000-0000-0000-000000000909'::uuid
    when 3 then '00000000-0000-0000-0000-000000000910'::uuid
  end,
  '00000000-0000-0000-0000-000000000907',
  pp.partida_id,
  pp.codigo_snapshot,
  pp.nombre_snapshot,
  pp.unidad_snapshot,
  pp.categoria_snapshot,
  pp.descripcion_snapshot,
  pp.especificaciones_snapshot,
  pp.rendimiento_snapshot,
  pp.cuadrilla_snapshot,
  pp.metrado,
  pp.precio_unitario_snapshot,
  false,
  'snapshot',
  pp.parcial,
  pp.orden
from public.presupuesto_partidas pp
where pp.presupuesto_id = '00000000-0000-0000-0000-000000000601';

insert into public.presupuesto_version_partida_recursos (
  id,
  presupuesto_version_id,
  presupuesto_version_partida_id,
  partida_recurso_id,
  recurso_id,
  nombre_snapshot,
  tipo_snapshot,
  unidad_snapshot,
  costo_unitario_snapshot,
  costo_transporte_snapshot,
  proveedor_id_snapshot,
  proveedor_nombre_snapshot,
  fuente_precio_snapshot,
  fecha_precio_snapshot,
  precio_cliente_snapshot,
  cotizacion_interna_id_snapshot,
  cotizacion_cliente_id_snapshot,
  precio_cliente_origen_snapshot,
  precio_cliente_advertencia_snapshot,
  precio_fijado_snapshot,
  precio_origen_snapshot,
  grupo,
  cantidad,
  unidad,
  rendimiento_factor,
  desperdicio_porcentaje,
  parcial_snapshot,
  orden
)
select
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000907',
  case pbr.presupuesto_borrador_partida_id
    when '00000000-0000-0000-0000-000000000904' then '00000000-0000-0000-0000-000000000908'::uuid
    when '00000000-0000-0000-0000-000000000905' then '00000000-0000-0000-0000-000000000909'::uuid
    when '00000000-0000-0000-0000-000000000906' then '00000000-0000-0000-0000-000000000910'::uuid
  end,
  pbr.partida_recurso_id,
  pbr.recurso_id,
  pbr.nombre_snapshot,
  pbr.tipo_snapshot,
  pbr.unidad_snapshot,
  pbr.costo_unitario_actual,
  pbr.costo_transporte_actual,
  pbr.proveedor_id_snapshot,
  pbr.proveedor_nombre_snapshot,
  pbr.fuente_precio_snapshot,
  pbr.fecha_precio_snapshot,
  pbr.precio_cliente_actual,
  pbr.cotizacion_interna_id,
  pbr.cotizacion_cliente_id,
  pbr.precio_cliente_origen,
  pbr.precio_cliente_advertencia,
  pbr.precio_fijado,
  pbr.precio_origen,
  pbr.grupo,
  pbr.cantidad,
  pbr.unidad,
  pbr.rendimiento_factor,
  pbr.desperdicio_porcentaje,
  pbr.parcial_actual,
  pbr.orden
from public.presupuesto_borrador_partida_recursos pbr
where pbr.presupuesto_borrador_id = '00000000-0000-0000-0000-000000000903';

insert into public.activity_events (
  id,
  organizacion_id,
  proyecto_id,
  presupuesto_borrador_id,
  presupuesto_version_id,
  entity_type,
  entity_id,
  action,
  metadata,
  created_at
) values (
  '00000000-0000-0000-0000-000000000911',
  '00000000-0000-0000-0000-000000000901',
  '00000000-0000-0000-0000-000000000902',
  '00000000-0000-0000-0000-000000000903',
  '00000000-0000-0000-0000-000000000907',
  'presupuesto_version',
  '00000000-0000-0000-0000-000000000907',
  'emitir_version_demo',
  '{"nota":"Seed demo sin actor porque Supabase Auth todavia no esta configurado."}'::jsonb,
  '2026-05-15 09:00:00-05'
);

-- Usuarios demo locales para validar Auth/RLS.
-- Todos usan la contraseña local: Password123!
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000a001', 'authenticated', 'authenticated', 'owner@cyp.local', crypt('Password123!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Owner Demo"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000a002', 'authenticated', 'authenticated', 'editor@cyp.local', crypt('Password123!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Editor Demo"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000a003', 'authenticated', 'authenticated', 'lector@cyp.local', crypt('Password123!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Lector Demo"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000a004', 'authenticated', 'authenticated', 'externo@cyp.local', crypt('Password123!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Externo Demo"}'::jsonb, now(), now());

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000a001', '{"sub":"00000000-0000-0000-0000-00000000a001","email":"owner@cyp.local","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now()),
  ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-00000000a002', '{"sub":"00000000-0000-0000-0000-00000000a002","email":"editor@cyp.local","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now()),
  ('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-00000000a003', '00000000-0000-0000-0000-00000000a003', '{"sub":"00000000-0000-0000-0000-00000000a003","email":"lector@cyp.local","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now()),
  ('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-00000000a004', '00000000-0000-0000-0000-00000000a004', '{"sub":"00000000-0000-0000-0000-00000000a004","email":"externo@cyp.local","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

insert into public.organizacion_miembros (
  id,
  organizacion_id,
  user_id,
  rol,
  estado,
  joined_at,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-00000000a001', 'owner', 'activo', now(), now(), now()),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-00000000a002', 'miembro', 'activo', now(), now(), now()),
  ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-00000000a003', 'miembro', 'activo', now(), now(), now());

insert into public.proyecto_miembros (
  id,
  proyecto_id,
  organizacion_miembro_id,
  rol,
  estado,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-00000000c001', 'admin', 'activo', now(), now()),
  ('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-00000000c002', 'editor', 'activo', now(), now()),
  ('00000000-0000-0000-0000-00000000d003', '00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-00000000c003', 'lector', 'activo', now(), now());

insert into public.organizaciones (
  id,
  nombre,
  ruc,
  estado,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-00000000e001',
  'Constructora Externa SAC',
  '20600000002',
  'activo',
  now(),
  now()
);

insert into public.organizacion_miembros (
  id,
  organizacion_id,
  user_id,
  rol,
  estado,
  joined_at,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-00000000e002',
  '00000000-0000-0000-0000-00000000e001',
  '00000000-0000-0000-0000-00000000a004',
  'owner',
  'activo',
  now(),
  now(),
  now()
);

insert into public.proyectos (
  id,
  organizacion_id,
  nombre,
  cliente,
  ubicacion,
  codigo,
  descripcion,
  estado,
  created_by,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-00000000e003',
  '00000000-0000-0000-0000-00000000e001',
  'Proyecto externo RLS',
  'Cliente externo',
  'Lima, Peru',
  'PROY-EXTERNO',
  'Proyecto demo aislado para validar que RLS impide acceso cruzado.',
  'activo',
  '00000000-0000-0000-0000-00000000a004',
  now(),
  now()
);

insert into public.proyecto_miembros (
  id,
  proyecto_id,
  organizacion_miembro_id,
  rol,
  estado,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-00000000e004',
  '00000000-0000-0000-0000-00000000e003',
  '00000000-0000-0000-0000-00000000e002',
  'admin',
  'activo',
  now(),
  now()
);
