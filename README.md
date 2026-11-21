# Proyecto Inglés

Portal de cursos en GitHub Pages. La portada lee el índice de `catalogo.json` y muestra el avance de cada curso con los intentos guardados en el navegador.

## Añadir otro curso

1. Crea una carpeta con un nombre único bajo `cursos/`. Guarda su `index.html` y sus recursos dentro.
2. Añade una entrada a `catalogo.json`. Usa el nombre de la carpeta como `id`, copia el formato de una ficha existente y adapta sus datos. El catálogo crea un enlace a `cursos/<id>/`.
3. Para mostrar progreso, usa los valores reales de `storageKey`, `passingScore` y `units` del curso. La clave debe ser única. Si el curso carece de evaluaciones guardadas en el navegador, puedes omitir `storageKey` y `passingScore`. Si su página tiene el ancla `#units`, indica las unidades en `units`; los demás cursos se abren desde el principio. Añade `finalLabel` solo si su actividad final se puede abrir en `#final`.
4. Si aportas una portada, indica la ruta desde la raíz del proyecto, el texto alternativo y sus dimensiones. Los accesos de `resources` deben apuntar a secciones de la propia página del curso. Si hay una guía descargable, coloca el PDF en la propia carpeta del curso e indica su nombre en `guide`.
5. Tras guardar en GitHub, comprueba el despliegue de Pages, la ficha en el índice y los enlaces del curso.

El repositorio contiene la versión para alumnado. Guarda la documentación docente en un espacio privado.
