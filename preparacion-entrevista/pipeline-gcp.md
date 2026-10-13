# Preparación de entrevista: Pipeline de datos en GCP

> **Documento privado de preparación. No lo subas a GitHub ni a la web.**
> Las respuestas usan solo lo que confirmaste. Donde aparece **[completar]**, la respuesta depende de detalles que solo tú conoces: complétalos antes de la entrevista. Lo marcado como *(concepto general)* es una explicación técnica general, no un dato del proyecto.

## Datos clave para tener a mano

- Reporte de staging de paletas, `.xlsb`, se actualiza **4 veces al día**.
- **150,000 registros en 4 minutos** (del disparo en Power Automate al fin en Cloud Functions).
- Reportes operativos: **2 h → 15 min (−87 %)**.
- Antes: macros de Excel, límite de 1 M de filas, **2 días a 1 semana**, archivos perdidos.
- Flujo: VBA → SharePoint → Power Automate → URL firmada → Cloud Storage (BigLake) → Cloud Function → Dataflow → BigQuery → consultas programadas → Power BI.

---

## Contexto y negocio

**1. ¿Qué problema resolvía y para quién?**
Analizar datos de varios años obligaba a armar macros de Excel que resumían por partes (límite de 1 M de filas) y tardaban entre 2 días y 1 semana. Luego, una macro revisaba cada archivo, pero si había un error había que buscar el original y los reportes se perdían o se borraban. El pipeline guarda todo estructurado en BigQuery, el dashboard se actualiza solo y los errores se revisan a nivel de detalle.
**[completar]** quién usa el dashboard y cuántas personas.

**2. ¿Cómo sabes que funcionó?**
Dos medidas: 150,000 registros en 4 minutos (desde el disparo en Power Automate hasta el fin en Cloud Functions) y reportes operativos de 2 h a 15 min. Sé decir qué mide cada una y qué no: la primera no incluye la conversión a CSV con VBA.
**[completar]** cómo medías las 2 h antes (cronómetro, estimación del equipo).

## Python

**3. ¿Dónde entra Python en este pipeline?**
En mi trabajo uso Python con Polars para leer archivos Excel/CSV sin saturar memoria y VBA en la ingesta.
**[completar]** en qué lenguaje están la Cloud Function y el job de Dataflow (¿Python con Apache Beam?). Ten claro qué parte es Python y qué parte es VBA, Power Automate o SQL.

**4. ¿Qué haces cuando el archivo trae errores de fórmulas de Excel?**
Dataflow los limpia junto con los formatos de fecha y los tipos por columna; lo que no se puede corregir va a la tabla de rechazos.
**[completar]** un ejemplo real de error de fórmula que hayas visto (`#N/A`, `#REF!`…).

## SQL

**5. ¿Cómo evitas duplicados si el reporte llega 4 veces al día?**
Cada carga borra primero la fecha correspondiente en BigQuery y luego inserta los datos limpios. Así, reprocesar una fecha no duplica registros.
**[completar]** si la tabla está particionada por fecha y si usas `DELETE` o reemplazo de partición. Alternativa que puedes mencionar *(concepto general)*: `MERGE` por clave.

**6. ¿Qué hacen las consultas programadas de BigQuery?**
Actualizan la tabla conectada al dashboard, así que siempre muestra información al día.
**[completar]** frecuencia, qué transformaciones hacen y si son incrementales.

## Arquitectura

**7. Explícame el flujo de punta a punta.**
VBA convierte el `.xlsb` a CSV y lo guarda en SharePoint. Power Automate detecta el archivo, valida que esté autorizado, pide una URL firmada a una Cloud Function y sube el archivo a Cloud Storage. Un disparador de Cloud Functions crea el job de Dataflow, que limpia los datos, borra la fecha e inserta en BigQuery. Los errores van a una tabla de rechazos y el estado se avisa por correo. Consultas programadas alimentan el dashboard de Power BI vía DirectQuery.

**8. ¿Por qué una Cloud Function lanza el job de Dataflow?**
La función solo activa un script que crea el job de Dataflow cuando llega un archivo.
**[completar]** por qué elegiste ese diseño. *(Concepto general)*: un job por lotes de Dataflow se lanza; no “escucha” eventos por sí mismo.

**9. ¿Qué pasa si llegan dos archivos casi a la vez?**
**[completar]** cómo se comporta hoy con cargas simultáneas. Piénsalo antes: es una pregunta habitual con un reporte que llega 4 veces al día.

## Cloud

**10. ¿Por qué URL firmada y no una credencial guardada en Power Automate?**
Para una carga segura y directa a Cloud Storage. *(Concepto general)*: una URL firmada da acceso temporal y limitado a un objeto concreto sin compartir una credencial de larga duración.

**11. ¿Para qué usas BigLake?**
Conecté el bucket a BigLake para optimizar los costos de almacenamiento.
**[completar]** cómo se logra el ahorro y si lo mediste.

## Calidad de datos

**12. ¿Qué validaciones hay?**
Formatos de fecha, errores provenientes de fórmulas y tipos de datos por columna. Los registros con error van a una tabla de rechazos y no detienen la carga. Además, Power Automate solo deja pasar archivos autorizados.

**13. ¿Cómo se revisa y corrige un registro rechazado?**
Se revisa a nivel de detalle en la tabla de rechazos.
**[completar]** cómo se corrige y reprocesa (¿manual, se reenvía el archivo?).

**14. ¿Tienes pruebas automatizadas?**
Respuesta honesta: no las tengo documentadas todavía. Las validaciones existen dentro del pipeline; mi siguiente paso es documentarlas y probarlas con datos sintéticos.
**[completar]** si existe alguna prueba que no hayas mencionado.

## Rendimiento

**15. ¿Cómo mediste los 150,000 registros en 4 minutos?**
Desde el disparo en Power Automate hasta el fin del procesamiento en Cloud Functions.
**[completar]** tamaño del archivo, número de workers de Dataflow y si incluye el arranque del job.

**16. ¿Qué harías si el volumen se multiplica por 10?**
Es una hipótesis, no un resultado medido. **[completar]** qué cuello de botella crees que aparecería primero y qué revisarías (workers de Dataflow, partición de la tabla).

## Seguridad

**17. ¿Cómo aseguras la carga desde Power Automate?**
Con URL firmada y una validación de seguridad previa: solo continúan los archivos autorizados.

**18. ¿Por qué no publicas el código?**
Procesa datos internos de la empresa. Por eso publico documentación y diagramas, sin datos, credenciales ni nombres internos, y planeo una versión reproducible con datos sintéticos.

## Decisiones técnicas

**19. ¿Qué alternativas descartaste?**
La alternativa previa eran las macros de Excel, con el límite de filas y el riesgo de perder archivos.
**[completar]** otras alternativas técnicas dentro de GCP (por ejemplo, otra forma de cargar o transformar) y por qué las descartaste.

**20. ¿Qué mejorarías?**
Propuestas: versión reproducible con datos sintéticos, pruebas sobre esos datos, documentar las decisiones y medir el tiempo de análisis frente al proceso anterior.
