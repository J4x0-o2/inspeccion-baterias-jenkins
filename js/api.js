// Este archivo gestiona la comunicación con Google Sheets a través de Google Apps Script, permitiendo enviar datos del formulario a una hoja de cálculo.

const API_CONFIG = {
    // REEMPLAZA con la URL que te dio Google al publicar como Web App
    url: "https://script.google.com/macros/s/AKfycbyV5epXHNj8tG9CpUbvXHt8AeVRbepZcuCmeqbUn0AxDIJppvZyasqwR71nn6hXLs4D/exec",
    // REEMPLAZA con tu clave (debe ser igual a la del Code.gs)
    key: "123KKj" 
};

async function sendToGoogleSheets(data) {
    // Verificar si el campo de días está en rojo (días >= 21)
    const diasAlerta = data.dias >= 21;
    
    // Rangos de validación por referencia de batería
    const pesoRanges = {
        '244105506R': { min: 14.80, max: 16.10 },
        '244103318R': { min: 16.55, max: 17.97 }
    };
    
    const voltajeRanges = {
        '244105506R': { min: 12.70, max: 12.95 },
        '244103318R': { min: 12.70, max: 13.00 }
    };
    
    // Verificar si el peso está fuera de rango
    const pesoRange = pesoRanges[data.refBateria];
    const pesoAlerta = pesoRange && (data.peso < pesoRange.min || data.peso > pesoRange.max);
    
    // Verificar si el voltaje está fuera de rango
    const voltajeRange = voltajeRanges[data.refBateria];
    const voltajeAlerta = voltajeRange && (data.carga < voltajeRange.min || data.carga > voltajeRange.max);
    
    // Añadimos la API Key y los estados de alerta al objeto de datos antes de enviar
    const payload = {
        ...data,
        apiKey: API_CONFIG.key,
        diasAlerta: diasAlerta,      // Enviar si días >= 21
        pesoAlerta: pesoAlerta,      // Enviar si peso fuera de rango
        voltajeAlerta: voltajeAlerta // Enviar si voltaje fuera de rango
    };

    try {
        const response = await fetch(API_CONFIG.url, {
            method: "POST",
            mode: "no-cors", // Importante para Google Apps Script
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        });

        // Nota: Con "no-cors", no podemos leer la respuesta JSON, 
        // pero si no hay excepción, asumimos que se envió.
        return { status: "success" };
    } catch (error) {
        console.error("Error en el envío:", error);
        return { status: "error", message: error.message };
    }
}