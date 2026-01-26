/**
 * Netlify Function: Guardar inspecciones en Google Sheets
 * Proxy seguro que reenvía datos de inspecciones a Google Apps Script
 */

exports.handler = async (event, context) => {
  // Solo acepta POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Método no permitido' })
    };
  }

  try {
    // Obtener URL del Google Apps Script desde variables de entorno
    const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;

    if (!GOOGLE_SHEET_URL) {
      console.error('⚠️ ERROR: GOOGLE_SHEET_URL no configurada en variables de entorno');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          error: 'GOOGLE_SHEET_URL no configurada en el servidor. Verifica netlify.toml'
        })
      };
    }

    // Parsear datos de la inspección
    let datos;
    try {
      datos = JSON.parse(event.body);
    } catch (e) {
      console.error('❌ Error parseando JSON:', e.message);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          error: 'JSON inválido en el body de la solicitud'
        })
      };
    }

    console.log('[Guardar Inspección] Enviando a Google Sheets...');
    console.log('[Guardar Inspección] URL destino:', GOOGLE_SHEET_URL.substring(0, 80) + '...');

    // Enviar a Google Apps Script (pasar todos los datos)
    const response = await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos),
      timeout: 10000 // 10 segundos timeout
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        message: 'Inspección guardada en Google Sheets',
        timestamp: new Date().toISOString(),
        ...result
      })
    };

  } catch (error) {
    console.error('❌ [Guardar Inspección] Error:', error.message);
    console.error('❌ Stack:', error.stack);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: error.message,
        details: 'Revisa los logs en Netlify para más información'
      })
    };
  }
};
