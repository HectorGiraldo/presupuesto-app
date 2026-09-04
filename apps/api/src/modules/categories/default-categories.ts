import { CategoryKind } from '@presupuesto/shared';

interface SeedCategory {
  name: string;
  color: string;
  icon: string;
  /** Imprescindible: no se puede recortar sin cambiar de vida. Alimenta el 50/30/20. */
  essential: boolean;
  children?: { name: string; essential?: boolean }[];
}

/**
 * Catálogo pensado para una economía doméstica en España. La división
 * esencial / prescindible es la que luego responde a "¿de qué gasto puedo prescindir?".
 */
export const DEFAULT_EXPENSE_CATEGORIES: SeedCategory[] = [
  {
    name: 'Vivienda', color: '#ef4444', icon: 'home', essential: true,
    children: [
      { name: 'Alquiler / Hipoteca' },
      { name: 'Comunidad' },
      { name: 'IBI y tasas' },
      { name: 'Reformas y mantenimiento', essential: false },
    ],
  },
  {
    name: 'Suministros', color: '#f97316', icon: 'zap', essential: true,
    children: [
      { name: 'Luz' }, { name: 'Agua' }, { name: 'Gas' },
      { name: 'Internet' }, { name: 'Móvil' },
    ],
  },
  {
    name: 'Alimentación', color: '#84cc16', icon: 'shopping-cart', essential: true,
    children: [
      { name: 'Supermercado' },
      { name: 'Restaurantes', essential: false },
      { name: 'Cafés y bares', essential: false },
    ],
  },
  {
    name: 'Transporte', color: '#06b6d4', icon: 'car', essential: true,
    children: [
      { name: 'Combustible' }, { name: 'Transporte público' },
      { name: 'Seguro del coche' }, { name: 'ITV y mantenimiento' },
      { name: 'Parking y peajes' }, { name: 'Taxi / VTC', essential: false },
    ],
  },
  {
    name: 'Salud', color: '#ec4899', icon: 'heart-pulse', essential: true,
    children: [
      { name: 'Farmacia' }, { name: 'Médico y dentista' }, { name: 'Seguro médico' },
    ],
  },
  {
    name: 'Seguros', color: '#8b5cf6', icon: 'shield', essential: true,
    children: [{ name: 'Hogar' }, { name: 'Vida' }, { name: 'Otros seguros' }],
  },
  {
    name: 'Ocio', color: '#a855f7', icon: 'party-popper', essential: false,
    children: [
      { name: 'Salidas' }, { name: 'Viajes' }, { name: 'Cultura y eventos' },
      { name: 'Deporte y gimnasio' }, { name: 'Hobbies' },
    ],
  },
  {
    name: 'Suscripciones', color: '#0ea5e9', icon: 'repeat', essential: false,
    children: [{ name: 'Streaming' }, { name: 'Software y apps' }, { name: 'Prensa' }],
  },
  {
    name: 'Compras', color: '#f59e0b', icon: 'shopping-bag', essential: false,
    children: [
      { name: 'Ropa y calzado' }, { name: 'Electrónica' },
      { name: 'Hogar y decoración' }, { name: 'Regalos' },
    ],
  },
  {
    name: 'Educación', color: '#14b8a6', icon: 'graduation-cap', essential: true,
    children: [{ name: 'Formación' }, { name: 'Libros y material' }],
  },
  {
    name: 'Impuestos y comisiones', color: '#64748b', icon: 'landmark', essential: true,
    children: [
      { name: 'IRPF / Hacienda' }, { name: 'Comisiones bancarias' }, { name: 'Autónomos' },
    ],
  },
  {
    name: 'Personal', color: '#d946ef', icon: 'user', essential: false,
    children: [{ name: 'Peluquería y estética' }, { name: 'Cuidado personal' }],
  },
  { name: 'Mascotas', color: '#22c55e', icon: 'paw-print', essential: false },
  { name: 'Deudas e intereses', color: '#dc2626', icon: 'credit-card', essential: true },
  { name: 'Ahorro e inversión', color: '#10b981', icon: 'piggy-bank', essential: true },
  { name: 'Otros gastos', color: '#94a3b8', icon: 'more-horizontal', essential: false },
];

export const DEFAULT_INCOME_CATEGORIES: SeedCategory[] = [
  { name: 'Nómina', color: '#10b981', icon: 'briefcase', essential: true },
  { name: 'Pagas extra', color: '#22c55e', icon: 'gift', essential: false },
  { name: 'Autónomo / Facturación', color: '#059669', icon: 'file-text', essential: false },
  { name: 'Alquileres', color: '#0d9488', icon: 'building', essential: false },
  { name: 'Intereses y dividendos', color: '#0891b2', icon: 'trending-up', essential: false },
  { name: 'Devolución de Hacienda', color: '#65a30d', icon: 'receipt', essential: false },
  { name: 'Venta de artículos', color: '#84cc16', icon: 'tag', essential: false },
  { name: 'Otros ingresos', color: '#94a3b8', icon: 'more-horizontal', essential: false },
];

export const DEFAULT_CATEGORIES: { kind: CategoryKind; items: SeedCategory[] }[] = [
  { kind: CategoryKind.EXPENSE, items: DEFAULT_EXPENSE_CATEGORIES },
  { kind: CategoryKind.INCOME, items: DEFAULT_INCOME_CATEGORIES },
];
