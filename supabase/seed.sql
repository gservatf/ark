-- C y P - Seed data Peru.
-- Demo limpio para el modelo tradicional de Partidas/APU.

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
  ('00000000-0000-0000-0000-000000000101', 'Unacem', '20100137390', 'Carla Mendoza', '987 452 110', 'ventas@unacem.pe', 'Av. Atocongo 2440, Lima', 'Proveedor principal de cemento.', true, now(), now()),
  ('00000000-0000-0000-0000-000000000102', 'Cantera San Pedro', '20544578122', 'Miguel Torres', '981 004 889', 'cotizaciones@sanpedro.pe', 'Lurin, Lima', 'Agregados por volumen.', true, now(), now()),
  ('00000000-0000-0000-0000-000000000103', 'Mano de Obra SAC', '20488933118', 'Rosa Huaman', '999 113 820', 'operaciones@manoobra.pe', 'Los Olivos, Lima', 'Costos referenciales de cuadrilla.', false, now(), now()),
  ('00000000-0000-0000-0000-000000000104', 'Alquileres del Sur', '20677120452', 'Fernando Rivas', '975 650 441', 'reservas@alquileressur.pe', 'Villa El Salvador, Lima', 'Equipos menores y maquinaria ligera.', true, now(), now());

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
  ('00000000-0000-0000-0000-000000000201', 'Cemento', 'material', 'Bls', 26.61, '00000000-0000-0000-0000-000000000101', false, 0.00, 'Bolsa de cemento para concreto.', null, 'Seed APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000202', 'Arena gruesa', 'material', 'm3', 66.95, '00000000-0000-0000-0000-000000000102', false, 0.00, 'Agregado fino lavado.', null, 'Seed APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000203', 'Piedra chancada', 'material', 'm3', 70.34, '00000000-0000-0000-0000-000000000102', false, 0.00, 'Agregado grueso para concreto.', null, 'Seed APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000204', 'Operario', 'mano_obra', 'HH', 30.28, '00000000-0000-0000-0000-000000000103', false, 0.00, 'Hora hombre operario.', null, 'Seed APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000205', 'Oficial', 'mano_obra', 'HH', 23.83, '00000000-0000-0000-0000-000000000103', false, 0.00, 'Hora hombre oficial.', null, 'Seed APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000206', 'Peon', 'mano_obra', 'HH', 21.58, '00000000-0000-0000-0000-000000000103', false, 0.00, 'Hora hombre peon.', null, 'Seed APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000207', 'Herramientas manuales', 'herramienta', '%', 0.00, '00000000-0000-0000-0000-000000000104', false, 0.00, 'Porcentaje sobre mano de obra.', null, 'Seed APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000208', 'Mezcladora', 'equipo', 'HM', 0.75, '00000000-0000-0000-0000-000000000104', false, 0.00, 'Hora maquina mezcladora.', null, 'Seed APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000209', 'Vibrador', 'equipo', 'HM', 0.58, '00000000-0000-0000-0000-000000000104', false, 0.00, 'Hora maquina vibrador.', null, 'Seed APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000210', 'Capataz', 'mano_obra', 'HH', 38.50, '00000000-0000-0000-0000-000000000103', false, 0.00, 'Hora hombre capataz.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000211', 'Maestro de obra', 'mano_obra', 'HH', 34.00, '00000000-0000-0000-0000-000000000103', false, 0.00, 'Hora hombre maestro de obra.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000212', 'Ayudante', 'mano_obra', 'HH', 18.75, '00000000-0000-0000-0000-000000000103', false, 0.00, 'Hora hombre ayudante.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000213', 'Agua para mezcla', 'material', 'm3', 8.00, null, false, 0.00, 'Agua para concreto y curado.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000214', 'Acero corrugado fy=4200', 'material', 'kg', 4.20, '00000000-0000-0000-0000-000000000101', false, 0.00, 'Acero de refuerzo para estructuras.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000215', 'Encofrado madera', 'material', 'm2', 48.00, '00000000-0000-0000-0000-000000000104', false, 0.00, 'Material referencial para encofrado.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000216', 'Clavos', 'material', 'kg', 6.50, '00000000-0000-0000-0000-000000000101', false, 0.00, 'Clavos para carpinteria y encofrado.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000217', 'Alambre negro N 16', 'material', 'kg', 5.80, '00000000-0000-0000-0000-000000000101', false, 0.00, 'Alambre para amarre de acero.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000218', 'Andamio metalico', 'equipo', 'dia', 12.00, '00000000-0000-0000-0000-000000000104', false, 0.00, 'Alquiler diario de andamio.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000219', 'Cortadora de concreto', 'equipo', 'HM', 18.00, '00000000-0000-0000-0000-000000000104', false, 0.00, 'Hora maquina cortadora.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000220', 'Compactadora tipo plancha', 'equipo', 'HM', 22.00, '00000000-0000-0000-0000-000000000104', false, 0.00, 'Hora maquina compactadora.', null, 'Seed temporal APU', current_date, 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000221', 'Wincha y nivel', 'herramienta', 'und', 4.50, '00000000-0000-0000-0000-000000000104', false, 0.00, 'Herramienta menor de medicion.', null, 'Seed temporal APU', current_date, 'activo', now(), now());

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
  now(),
  now()
);

update public.proveedores
set organizacion_id = '00000000-0000-0000-0000-000000000901'
where id between '00000000-0000-0000-0000-000000000101' and '00000000-0000-0000-0000-000000000104';

update public.recursos
set organizacion_id = '00000000-0000-0000-0000-000000000901'
where id between '00000000-0000-0000-0000-000000000201' and '00000000-0000-0000-0000-000000000221';

insert into public.partida_categorias (
  id,
  organizacion_id,
  nombre,
  estado,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000901', 'Estructura', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000901', 'Arquitectura', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000901', 'Instalaciones sanitarias', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000901', 'Instalaciones electricas', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000705', '00000000-0000-0000-0000-000000000901', 'Obras preliminares', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000706', '00000000-0000-0000-0000-000000000901', 'Acabados', 'activo', now(), now());

insert into public.partida_subcategorias (
  id,
  organizacion_id,
  categoria_id,
  nombre,
  estado,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000721', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000705', 'Movimiento de tierras', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000722', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000701', 'Concreto simple', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000723', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000701', 'Concreto armado', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000724', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000702', 'Muros', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000725', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000702', 'Pisos', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000726', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000702', 'Revoques', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000727', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000706', 'Pintura', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000728', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000703', 'Tuberias', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000729', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000704', 'Cableado', 'activo', now(), now());

insert into public.unidades_medida (
  id,
  organizacion_id,
  codigo,
  nombre,
  tipo,
  estado,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000741', '00000000-0000-0000-0000-000000000901', 'm3', 'Metro cubico', 'volumen', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000742', '00000000-0000-0000-0000-000000000901', 'm2', 'Metro cuadrado', 'area', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000743', '00000000-0000-0000-0000-000000000901', 'ml', 'Metro lineal', 'longitud', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000744', '00000000-0000-0000-0000-000000000901', 'kg', 'Kilogramo', 'peso', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000745', '00000000-0000-0000-0000-000000000901', 'und', 'Unidad', 'unidad', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000746', '00000000-0000-0000-0000-000000000901', 'glb', 'Global', 'global', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000747', '00000000-0000-0000-0000-000000000901', 'HH', 'Hora hombre', 'tiempo', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000748', '00000000-0000-0000-0000-000000000901', 'HM', 'Hora maquina', 'tiempo', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000749', '00000000-0000-0000-0000-000000000901', 'dia', 'Dia', 'tiempo', 'activo', now(), now()),
  ('00000000-0000-0000-0000-000000000750', '00000000-0000-0000-0000-000000000901', 'Bls', 'Bolsa', 'unidad', 'activo', now(), now());

update public.recursos r
set unidad_id = u.id
from public.unidades_medida u
where r.organizacion_id = u.organizacion_id
  and lower(btrim(r.unidad)) = lower(btrim(u.codigo));

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
  '00000000-0000-0000-0000-000000000902',
  '00000000-0000-0000-0000-000000000901',
  'Edificio Multifamiliar Los Olivos',
  'Inmobiliaria Los Olivos SAC',
  'Lima, Peru',
  'PROY-DEMO',
  'Proyecto demo para presupuestos.',
  'activo',
  null,
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

insert into public.partidas (
  id,
  organizacion_id,
  codigo,
  nombre,
  unidad,
  unidad_id,
  categoria,
  categoria_id,
  subcategoria,
  subcategoria_id,
  especificaciones,
  rendimiento,
  jornada_horas,
  desperdicio_materiales_porcentaje,
  estado,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000401',
  '00000000-0000-0000-0000-000000000901',
  '01.04.01.01',
  'Zapatas, concreto f''c=210 kg/cm2',
  'm3',
  '00000000-0000-0000-0000-000000000741',
  'Estructura',
  '00000000-0000-0000-0000-000000000701',
  'Concreto armado',
  '00000000-0000-0000-0000-000000000723',
  'Partida demo con mano de obra, materiales, equipos y herramientas manuales.',
  25,
  8,
  5,
  'activo',
  now(),
  now()
);

insert into public.partida_recursos (
  id,
  partida_id,
  recurso_id,
  grupo,
  tipo_calculo_apu,
  cuadrilla,
  cantidad_base,
  porcentaje_aplicado,
  cantidad,
  unidad,
  costo_unitario_snapshot,
  costo_transporte_snapshot,
  parcial,
  orden
) values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000204', 'mano_obra', 'mano_obra_rendimiento', 2, null, null, 0.64, 'HH', 30.28, 0, 19.38, 1),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000205', 'mano_obra', 'mano_obra_rendimiento', 2, null, null, 0.64, 'HH', 23.83, 0, 15.25, 2),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000206', 'mano_obra', 'mano_obra_rendimiento', 8, null, null, 2.56, 'HH', 21.58, 0, 55.24, 3),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000201', 'materiales', 'material_desperdicio', null, 9.73, null, 10.2165, 'Bls', 26.61, 0, 271.86, 4),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000202', 'materiales', 'material_desperdicio', null, 0.48, null, 0.504, 'm3', 66.95, 0, 33.74, 5),
  ('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000203', 'materiales', 'material_desperdicio', null, 0.60, null, 0.63, 'm3', 70.34, 0, 44.31, 6),
  ('00000000-0000-0000-0000-000000000507', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000207', 'equipos_herramientas', 'herramientas_porcentaje_mano_obra', null, null, 3, 3, '%', 0, 0, 2.70, 7),
  ('00000000-0000-0000-0000-000000000508', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000208', 'equipos_herramientas', 'equipo_hm_rendimiento', 1, null, null, 0.32, 'HM', 0.75, 0, 0.24, 8),
  ('00000000-0000-0000-0000-000000000509', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000209', 'equipos_herramientas', 'equipo_hm_rendimiento', 1, null, null, 0.32, 'HM', 0.58, 0, 0.19, 9);
