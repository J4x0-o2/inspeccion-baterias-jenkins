/**
 * Vercel API: Obtener referencias de baterías
 * Referencias hardcodeadas - sin dependencias externas
 */

const REFERENCIAS_HARDCODEADAS = [
  {
    id: "1",
    referencia: "244105506R",
    cargaMin: 12.7,
    cargaMax: 12.95,
    pesoMin: 14.8,
    pesoMax: 16.1
  },
  {
    id: "2",
    referencia: "244103318R",
    cargaMin: 12.7,
    cargaMax: 13.01,
    pesoMin: 16.55,
    pesoMax: 17.97
  }
];

export default async function handler(req, res) {
  // Solo acepta GET
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    console.log(`[Referencias] Devolviendo ${REFERENCIAS_HARDCODEADAS.length} referencias hardcodeadas`);

    // Cache por 24 horas
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    return res.status(200).json({
      ok: true,
      referencias: REFERENCIAS_HARDCODEADAS,
      count: REFERENCIAS_HARDCODEADAS.length,
      timestamp: new Date().toISOString(),
      source: 'hardcoded'
    });

  } catch (error) {
    console.error('❌ [Referencias] Error:', error.message);

    // Siempre devolver referencias aunque haya error
    return res.status(200).json({
      ok: true,
      referencias: REFERENCIAS_HARDCODEADAS,
      count: REFERENCIAS_HARDCODEADAS.length,
      timestamp: new Date().toISOString(),
      source: 'hardcoded_fallback'
    });
  }
}
