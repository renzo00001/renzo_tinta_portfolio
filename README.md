# Renzo Tinta · Portfolio

Portafolio de Junior Data Engineer con pipelines en Google Cloud y SAP/MotherDuck, experiencia en automatización y resultados medidos. Sitio estático, sin compilación, con versiones ES/EN y temas claro y oscuro.

## Contenido

- `index.html`: perfil, resultados, proyectos, experiencia y contacto.
- `projects/`: casos de estudio con arquitectura, contribución y limitaciones.
- `assets/`: estilos, traducciones y JavaScript.
- `404.html`: página de error.
- `privacy.html`: privacidad y uso del sitio.
- `readmes/`: documentación de proyectos.

## Antes de publicar

Para revisar el sitio localmente, ejecutar `node scripts/preview.cjs` y abrir `http://127.0.0.1:4173`. El servidor solo acepta conexiones desde este equipo.

1. Definir el dominio definitivo y usar URLs absolutas para `og:image`, `og:url` y las URLs canónicas de cada página.
2. Comprobar la vista previa social desde la URL pública.
3. Incorporar el CV actualizado y capturas anonimizadas cuando estén disponibles.
4. Confirmar fechas, formación y mediciones.

El contacto dirige a LinkedIn. No se presenta un formulario desactivado. Las métricas corresponden a mediciones propias; la ingesta técnica y el proceso operativo completo se describen por separado.

## Validación del rediseño

Las cinco páginas se revisaron con Chromium en anchos de 1440, 390 y 320 píxeles. Se verificaron archivos y anclas locales, IDs únicos, ausencia de errores JavaScript, cambio ES/EN, tema, apertura y cierre del menú móvil y contenido visible con movimiento reducido. Las capturas de revisión se guardan en `qa-output/`, excluido de Git.

## Movimiento

La portada incluye una escena SVG de registros que convergen, se transforman y llegan al almacenamiento. Se reproduce automáticamente, se detiene fuera de pantalla y al ocultar la pestaña. En móvil se reduce el número de partículas y se elimina la reacción al cursor.

`page-motion.js` coordina entradas, barras, revelación de palabras y conexiones entre nodos de las arquitecturas. Los grupos de extracción SAP se activan por etapas; las conexiones son esquemáticas y no representan tiempos reales. `data-motion.js` controla la escena de portada. Ninguno requiere un motor 3D ni librerías adicionales.

`ambient-network.js` dibuja la red de nodos como fondo fijo de todas las páginas, incluyendo proyectos, privacidad y 404. Los puntos se desplazan sin depender del cursor y algunos pulsos recorren sus conexiones. Por elección del propietario, el fondo y el pipeline se reproducen automáticamente, sin controles de movimiento ni preferencias de sesión. Al ocultar la pestaña se suspende el dibujo. Un solo canvas del tamaño de la ventana mantiene el costo independiente del largo de la página. Los colores siguen el tema y la densidad se reduce en móvil.

