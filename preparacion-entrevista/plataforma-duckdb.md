# Preparación de entrevista: Plataforma de datos con DuckDB / MotherDuck y Streamlit

> **Documento privado de preparación. No lo subas a GitHub ni a la web.**
> Las respuestas usan solo lo que confirmaste o lo que se ve en el código del repositorio. Donde aparece **[completar]**, la respuesta depende de detalles que solo tú conoces. Lo marcado como *(concepto general)* es una explicación técnica general, no un dato del proyecto.

## Datos clave para tener a mano

- Flujo: SAP GUI scripting → Polars → carga incremental a MotherDuck → SQL con CTEs → capa final → dashboard de Streamlit.
- Dos capas en MotherDuck: de trabajo y final. El dashboard solo lee la final.
- Carga incremental por rango de fechas (borrar e insertar) dentro de una transacción con rollback.
- Uso actual: gerencia de Non Food y Supply Chain. A futuro, las demás gerencias.
- Sin métricas de impacto, sin pruebas automatizadas, sin README con instrucciones verificadas (todavía).
- Elegiste MotherDuck: conocías DuckDB, funciona como data warehouse y permite crear dashboards con Dives; quieres aprender Flights.

---

## Contexto y negocio

**1. ¿Qué problema resolvía?**
Hacía falta una proyección diaria confiable a partir de datos logísticos de varias fuentes (SAP y tablas de maestros y configuración) y ver lo generado frente a lo pendiente. No existía un reporte previo; se pensó hacerlo como una macro de VBA en Excel.

**2. ¿Por qué no una macro de VBA?**
Porque había que conocer el historial de cada pedido, y una base de datos es más adecuada que archivos Excel.

**3. ¿Quién lo usa y cómo mides el éxito?**
Hoy lo usa la gerencia de Non Food y Supply Chain; a futuro lo verán las demás, mientras se trabajan las lógicas de cada una. Todavía no tengo métricas de impacto confirmadas.
**[completar]** cuántas personas lo usan, con qué frecuencia y qué decisiones apoya.

## Python

**4. ¿Qué hace Polars en el proyecto?**
Lee los archivos de texto que baja SAP, y limpia, renombra, tipifica y deduplica antes de la carga.

**5. ¿Por qué Polars y no pandas?**
En mi trabajo uso Polars para leer múltiples archivos sin saturar memoria. Ojo: el proyecto también depende de pandas.
**[completar]** para qué usas pandas aquí y si Polars fue una decisión consciente en este proyecto.

**6. ¿Cómo organizaste el código?**
Cuatro módulos: extracción desde SAP (`SAP_.py`), funciones de apoyo (`Auxiliar.py`), cargas y consultas (`duckdb_queries.py`) y el dashboard (`dashboard_.py`).
**[completar]** qué refactorizarías (hay una ruta absoluta de Windows fijada en el código de apoyo).

## SQL

**7. Explícame la consulta final con CTEs.**
Filtra precios por unidad de medida, calcula cantidades base y montos, ajusta la fecha de entrega según una tabla de configuración y agrega unidad de negocio y gerencia.
**[completar]** los nombres de los CTEs, las claves de unión y un ejemplo con números.

**8. ¿Cómo evitas duplicados en cargas repetidas?**
Cada carga borra el rango de fechas y luego inserta, dentro de una transacción.

**9. ¿Qué pasa si falla a mitad de la carga?**
Se hace rollback y la capa anterior queda intacta. *(Concepto general)*: una transacción es atómica, se aplica completa o no se aplica.

## Arquitectura

**10. ¿Por qué dos capas?**
La de trabajo guarda los datos cargados, los maestros y la configuración; la final contiene la proyección operativa diaria. El dashboard solo lee la final, así se separa el procesamiento del consumo.

**11. ¿Cómo se relacionan el pipeline y el dashboard?**
El pipeline de ingeniería produce los datos y el dashboard solo los consume. El dashboard no transforma; lee la tabla final y aplica filtros y agregaciones para mostrar.

**12. ¿Qué pasa si faltan datos maestros?**
Se detectan comparando con las tablas de maestros y configuración, y el proceso los descarga de SAP para completar la capa de trabajo.

## Cloud

**13. ¿Por qué MotherDuck?**
Ya conocía DuckDB. Además de funcionar como almacén de datos, permite generar dashboards con Dives, y planeo aprender más sobre Flights.
**[completar]** cuándo elegirías BigQuery en su lugar (volumen, concurrencia, gobierno de datos).

**14. ¿Qué son Dives y Flights?**
Dives: dashboards interactivos que se crean dentro de MotherDuck. Flights: scripts de Python que corren en el cómputo de MotherDuck, con programación opcional por cron, pensados para cargas ELT/ETL y trabajos recurrentes. **Ojo:** no los uso en este proyecto; los menciono como aprendizaje.

**15. ¿Dónde corre el dashboard?**
Se despliega en Streamlit Cloud y lee el token desde *secrets*.
**[completar]** quién puede acceder hoy (ver pregunta 19).

## Calidad de datos

**16. ¿Qué controles hay?**
Limpieza y deduplicación con Polars, carga transaccional, detección de maestros faltantes y, en el dashboard, validación de filtros y del rango de fechas, con un tope de 500,000 filas en la exportación.

**17. ¿Y las pruebas?**
Respuesta honesta: no hay pruebas automatizadas todavía. Propongo pruebas unitarias de la limpieza con archivos sintéticos, verificaciones sobre la tabla final (sin duplicados por clave, sin nulos obligatorios) y una prueba del rollback.

## Rendimiento

**18. ¿Cuántos datos procesa y cuánto tarda?**
No tengo esas métricas medidas. En el dashboard, la conexión se reutiliza con caché y la exportación a Excel tiene un tope de 500,000 filas.
**[completar]** volumen aproximado de filas por carga y tiempo de ejecución si lo conoces; o comprométete a medirlo.

## Seguridad

**19. ¿Cómo gestionas el token y qué riesgos ves?**
El token de MotherDuck se lee de variables de entorno o de *secrets* de Streamlit y el `.gitignore` excluye `.env`, `secrets.toml`, `*.duckdb` y `*.xlsx`.
Riesgo que tengo identificado: la aplicación desplegada está abierta y muestra datos operativos reales de la empresa, con un botón de exportación. Decidí no enlazarla desde mi portafolio.
**[completar]** qué decidiste hacer con el acceso (restringirla o crear una versión con datos sintéticos).

**20. ¿Hay información sensible en el repositorio?**
El repositorio es público y contiene nombres internos de sistemas SAP y una ruta absoluta de Windows en el código de apoyo. Planeo revisarlos y parametrizarlos.

## Decisiones técnicas

**21. ¿Por qué SAP GUI scripting?**
**[completar]** por qué se eligió (¿no había API, RFC u otra vía disponible?). Sé explicar su limitación: depende de una sesión de Windows con SAP GUI y no es reproducible fuera de la empresa.

**22. ¿Cómo programarías la carga con Flights?**
Es una propuesta mía, no algo implementado: las etapas posteriores a la extracción (limpieza, carga y consulta final) podrían correr como un Flight con programación por cron. La extracción con SAP GUI necesita una sesión de Windows, así que no podría moverse allí.

**23. ¿Qué mejorarías primero?**
README con instrucciones verificadas, datos sintéticos de demostración, pruebas automatizadas, programación de la carga, parametrizar rutas y medir uso y tiempos.
