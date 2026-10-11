// Curated static art direction. Admin gallery records remain the gallery source of truth.
export const CORTES = [
  { filename: "corte-001.jpeg", width: 1000, height: 1600, alt: "Corte corto negro con textura, visto de perfil", position: "50% 40%" },
  { filename: "corte-002.jpeg", width: 958, height: 1600, alt: "Corte rubio asimétrico con laterales cortos", position: "50% 40%" },
  { filename: "corte-003.jpeg", width: 1026, height: 1600, alt: "Mohicano con puntas y lateral rapado", position: "50% 30%" },
  { filename: "corte-004.jpeg", width: 1132, height: 1600, alt: "Corte corto con fleco y textura negra", position: "50% 40%" },
  { filename: "corte-005.jpeg", width: 1060, height: 1600, alt: "Capas cortas y despeinadas con fleco", position: "50% 45%" },
  { filename: "corte-006.jpeg", width: 992, height: 1600, alt: "Corte corto con patillas largas, visto de perfil", position: "50% 45%" },
  { filename: "corte-007.jpeg", width: 874, height: 1600, alt: "Mullet verde con lateral rapado y línea de diseño", position: "50% 45%" },
  { filename: "corte-008.jpeg", width: 956, height: 1600, alt: "Corte asimétrico cobrizo con mechones largos", position: "50% 45%" },
  { filename: "corte-009.jpeg", width: 956, height: 1600, alt: "Corte violeta con capas y fleco largo", position: "50% 45%" },
  { filename: "corte-010.jpeg", width: 966, height: 1600, alt: "Capas negras asimétricas con fleco largo", position: "50% 45%" },
  { filename: "corte-011.jpeg", width: 972, height: 1600, alt: "Corte negro con volumen y mechones de perfil", position: "50% 50%" },
  { filename: "corte-012.jpeg", width: 822, height: 1600, alt: "Corte corto negro con fleco texturizado", position: "50% 50%" },
  { filename: "corte-013.jpeg", width: 990, height: 1600, alt: "Mullet negro largo con capas y fleco", position: "50% 45%" },
  { filename: "corte-014.jpeg", width: 984, height: 1600, alt: "Corte corto con nuca larga, visto de perfil", position: "50% 45%" },
] as const;

export const HERO_CORTE = CORTES[2];
export const EDITORIAL_CORTE = CORTES[12];
export const SIDE_CORTES = [CORTES[1], CORTES[6], CORTES[7], CORTES[10], CORTES[4], CORTES[11]];
export function localCorte(filename: string) { return `/images/cortes/${filename}`; }

export function importedCorte(objectKey: string) {
  return objectKey.startsWith("gallery/cortes/") ? CORTES.find((image) => objectKey === `gallery/cortes/${image.filename}`) : undefined;
}
