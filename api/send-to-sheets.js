/**
 * API: Guardar inspecciones en Google Sheets
 * Proxy seguro que reenvía datos de inspecciones a Google Apps Script
 */

export default async function handler(req, res) {
  // Solo acepta POST
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    // Obtener URL del Google Apps Script desde variables de entorno
    const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;

    if (!GOOGLE_SHEET_URL) {
      console.error('⚠️ ERROR: GOOGLE_SHEET_URL no configurada en variables de entorno');
      return res.status(500).json({
        ok: false,
        error: 'GOOGLE_SHEET_URL no configurada en el servidor'
      });
    }

    // Parsear datos de la inspección
    let datos;
    try {
      datos = req.body;
      if (typeof datos === 'string') {
        datos = JSON.parse(datos);
      }
    } catch (e) {
      console.error('❌ Error parseando JSON:', e.message);
      return res.status(400).json({
        ok: false,
        error: 'JSON inválido en el body de la solicitud'
      });
    }

    console.log('[Guardar Inspección] Enviando a Google Sheets...');
    console.log('[Guardar Inspección] URL destino:', GOOGLE_SHEET_URL.substring(0, 80) + '...');

    // Agregar parámetro v= para evitar caché
    const url = GOOGLE_SHEET_URL + '?v=' + new Date().getTime();

    // Enviar a Google Apps Script (pasar todos los datos)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    console.log('[Guardar Inspección] Respuesta de Google Sheets - Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Google Sheets respondió con status ${response.status}: ${errorText}`);
      throw new Error(`Google Sheets error: ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (e) {
      // Si no es JSON válido, está bien - Google Apps Script a veces no devuelve JSON
      result = { success: true };
    }

    console.log(`✅ [Guardar Inspección] Éxito para referencia: ${datos.refBateria}`);

    return res.status(200).json({
      ok: true,
      message: 'Inspección guardada en Google Sheets',
      timestamp: new Date().toISOString(),
      ...result
    });

  } catch (error) {
    console.error('❌ [Guardar Inspección] Error:', error.message);
    console.error('❌ Stack:', error.stack);

    return res.status(500).json({
      ok: false,
      error: error.message,
      details: 'Revisa los logs del servidor para más información'
    });
  }
}
