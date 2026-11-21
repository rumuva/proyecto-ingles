# Proyecto Inglés

Portal de cursos en GitHub Pages. La portada lee el índice de `catalogo.json` y muestra el avance de cada curso con los intentos guardados en el navegador.

## Añadir otro curso

1. Crea una carpeta con un nombre único bajo `cursos/`. Guarda su `index.html` y sus recursos dentro.
2. Añade una entrada a `catalogo.json`. Usa el nombre de la carpeta como `id`, copia el formato de una ficha existente y adapta sus datos. El catálogo crea un enlace a `cursos/<id>/`.
3. Para mostrar progreso, usa los valores reales de `storageKey`, `passingScore` y `units` del curso. La clave debe ser única. Si el curso carece de evaluaciones guardadas en el navegador, puedes omitir `storageKey` y `passingScore`. Si su página tiene el ancla `#units`, indica las unidades en `units`; los demás cursos se abren desde el principio. Añade `finalLabel` solo si su actividad final se puede abrir en `#final`.
4. Si aportas una portada, indica la ruta desde la raíz del proyecto, el texto alternativo y sus dimensiones. Los accesos de `resources` pueden apuntar a secciones del curso o a una página de su carpeta, con una ruta relativa. Guarda la guía didáctica en la carpeta del curso como `guia-didactica.pdf` y enlázala desde su índice de unidades.
5. Tras guardar en GitHub, comprueba el despliegue de Pages, la ficha en el índice y los enlaces del curso.

El repositorio contiene la versión para alumnado. Guarda la documentación docente en un espacio privado.

## Edición revisada

- Los seis cursos mantienen sus unidades e historial local. Un intento fallido activa una variante de la primera pregunta en el siguiente intento. Comercio exige comprobar los cinco puntos de cada unidad.
- Los itinerarios B1 y B2 ofrecen diagnóstico, cronómetro complementario y comparación de dos resultados con muestras oficiales completas enlazadas. La producción y la mediación se valoran con apoyo docente y las hojas de observación de cada entidad.
- Desde el catálogo se pueden hacer copias de los intentos, los resultados de simulacros y el borrador de Rutinas. La importación combina la copia y el progreso de ese navegador.
- Las guías públicas y los cuadernos de simulacro son PDF etiquetados. Los Word editables y las guías de profesorado se distribuyen en el paquete docente.
