/**
 * Netlify Function: Gestión de referencias de baterías
 * Lee y escribe referencias en Google Sheets
 */

exports.handler = async (event, context) => {
  // Solo acepta GET y POST
  if (!['GET', 'POST'].includes(event.httpMethod)) {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL;
    
    if (!GOOGLE_SHEETS_URL) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configuración incompleta' })
      };
    }

    // GET: Obtener referencias
    if (event.httpMethod === 'GET') {
      const response = await fetch(GOOGLE_SHEETS_URL + '?action=getReferencias', {
        method: 'GET'
      });

      const data = await response.text();
      
      try {
        const referencias = JSON.parse(data);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ok: true,
            referencias: referencias,
            timestamp: new Date().toISOString()
          })
        };
      } catch (e) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ok: true,
            referencias: [],
            timestamp: new Date().toISOString()
          })
        };
      }
    }

    // POST: Guardar referencia
    if (event.httpMethod === 'POST') {
      const datos = JSON.parse(event.body);

      const payload = {
        action: 'addReferencia',
        ...datos,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log(`[Referencias] Referencia guardada: ${datos.referencia}`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          message: 'Referencia guardada',
          timestamp: new Date().toISOString()
        })
      };
    }

  } catch (error) {
    console.error('Error en referencias:', error.message);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};
