# 005 · Audio y video por proximidad

- **Estado:** Approved
- **Fase del plan:** 4
- **Fecha:** 2026-11-18

## Contexto
Los participantes ya se ven moverse y chatean, pero hablar por texto es lento y no transmite la sensación de
«estar en la misma oficina». Esta fase añade voz y, opcionalmente, cámara, de forma que cada uno oye más fuerte a
quien tiene cerca y deja de oír a quien se aleja, como en un espacio físico. Así se pueden formar conversaciones
espontáneas por grupos sin salas aparte.

## Historias de usuario
- Como participante, quiero oír a quien está cerca de mi avatar y dejar de oír a quien está lejos para conversar en grupos sin molestar al resto.
- Como participante, quiero activar y silenciar mi micrófono para decidir cuándo me oyen.
- Como participante, quiero activar mi cámara y ver la de quienes están cerca para tener conversaciones cara a cara.
- Como participante sin micrófono o que deniega el permiso, quiero seguir en la sala y usar el chat para no quedarme fuera.

## Criterios de aceptación

### Conexión de audio/video
- **AC-1** Dado un participante que entra en la sala con su nombre, cuando la entrada se completa, entonces queda unido automáticamente al canal de audio/video de la sala sin pasos extra; la consola registra la unión y la pantalla de entrada no cambia.
- **AC-2** Dado el servidor de la oficina, cuando un participante dentro de la sala pide acceso al canal de audio/video, entonces el servidor le concede un acceso válido solo para esa sala y ligado a su identidad en ella; una petición de alguien que no está en la sala se rechaza.
- **AC-3** Dado que el servicio de audio/video no está disponible o no está configurado, cuando el participante entra, entonces sigue en la sala (movimiento, multijugador y chat funcionan), ve un aviso breve de que la voz no está disponible y los botones de micrófono y cámara aparecen desactivados.

### Micrófono y cámara
- **AC-4** Dado un participante dentro de la sala, cuando entra, entonces su micrófono y su cámara están apagados y ve dos botones (micrófono y cámara) que indican claramente su estado.
- **AC-5** Dado el micrófono apagado, cuando el participante pulsa el botón de micrófono y concede el permiso del navegador, entonces los participantes cercanos empiezan a oírlo; al pulsarlo de nuevo, dejan de oírlo y el botón vuelve a «apagado».
- **AC-6** Dado que el navegador deniega el permiso de micrófono o cámara (o no hay dispositivo), cuando el participante pulsa el botón, entonces ve un aviso breve con el motivo, el botón queda en «apagado» y sigue en la sala sin errores.
- **AC-7** Dada la cámara apagada, cuando el participante pulsa el botón de cámara y concede el permiso, entonces ve su propia imagen en un panel pequeño y los participantes cercanos (ver reglas) también la ven; al apagarla, desaparece para todos.
- **AC-8** Dado el participante en la sala con el foco fuera del campo del chat, cuando pulsa M, entonces se conmuta el micrófono como en AC-5; cuando pulsa V, se conmuta la cámara como en AC-7. Con el foco en el campo del chat, M y V se escriben como texto y no conmutan nada.

### Proximidad
- **AC-9** Dados A y B con el micrófono de B encendido, cuando A está a 2 m o menos de B, entonces A oye a B a volumen pleno.
- **AC-10** Dados A y B con el micrófono de B encendido, cuando A se aleja de B entre 2 m y 8 m, entonces el volumen con que A oye a B baja de forma gradual y continua (sin saltos audibles) según la distancia.
- **AC-11** Dados A y B con el micrófono de B encendido, cuando A está a más de 8 m de B, entonces A no oye a B (volumen 0); al volver a acercarse, lo oye de nuevo sin tener que reconectar.
- **AC-12** Dados A, B y C, cuando B y C hablan a la vez a distintas distancias de A, entonces A oye a cada uno con el volumen que le corresponde por su propia distancia, de forma independiente.
- **AC-13** Dado un participante que habla, cuando su micrófono está encendido y emite sonido, entonces él mismo y los demás ven un indicador visual sobre su avatar (junto a la etiqueta de nombre) mientras habla, y uno de micrófono apagado cuando lo tiene apagado.
- **AC-14** Dados A y B con la cámara de B encendida, cuando A está dentro de la distancia de video (ver reglas), entonces A ve el video de B en su panel con el nombre de B; cuando A se aleja más allá de esa distancia, el video de B sale del panel.

### Altas, bajas y errores
- **AC-15** Dado un participante que sale de la sala (cierra la pestaña o pierde la conexión), cuando ocurre, entonces los demás dejan de oírlo y de ver su video, y su indicador desaparece con su avatar.
- **AC-16** Dado un participante que pierde la conexión con la sala (spec 003 AC-18), cuando vuelve a la pantalla de entrada, entonces también sale del canal de audio/video y su micrófono y cámara se liberan (el indicador del navegador se apaga).
- **AC-17** Dado que se pierde solo la conexión de audio/video mientras la sala sigue activa, cuando ocurre, entonces el participante sigue en la sala, ve un aviso y los botones quedan desactivados; no vuelve a la pantalla de entrada.
- **AC-18** Dado el servidor de la oficina, cuando arranca sin la configuración del servicio de audio/video, entonces arranca igualmente, avisa en su consola de que la voz está desactivada y no expone secretos ni en consola ni en respuestas.

## Reglas de negocio
- Distancia: la que hay entre los centros de los avatares en el plano del suelo, en metros (las mismas unidades que la sala).
- Volumen: 100 % hasta 2 m; baja de forma continua hasta 0 % a 8 m; 0 % a partir de 8 m.
- Las posiciones usadas para el volumen son las que cada participante ve en su pantalla (la propia y las interpoladas de los demás); el volumen se recalcula al menos 10 veces por segundo.
- Video: se muestra el de los participantes con cámara encendida a 8 m o menos, como mucho 4 a la vez (los más cercanos), más la propia imagen.
- Estado inicial al entrar: micrófono y cámara apagados.
- Atajos: M conmuta el micrófono y V la cámara, solo con el foco fuera del campo del chat.
- Voz propia: el participante no oye su propia voz por los altavoces; solo ve su indicador de habla.
- Ubicación: botones de micrófono y cámara abajo al centro; panel de video arriba a la derecha (no tapan el chat, abajo a la izquierda).
- Servicio de audio/video para desarrollo y validación: instancia local en Docker; su dirección y credenciales van en `.env` y `.env.example` documenta los valores de desarrollo.
- Permisos: el navegador los pide solo al encender micrófono o cámara por primera vez, no al entrar.
- Acceso al canal: lo concede el servidor de la oficina solo a quien está dentro de la sala, con identidad igual a su identificador en la sala y nombre visible igual a su nombre; caduca a las pocas horas y no permite publicar en otras salas.
- Los secretos del servicio de audio/video solo viven en la configuración del servidor (`.env`), nunca en el cliente ni en el repositorio.
- Sin servicio de audio/video, todo lo demás (movimiento, multijugador, chat) funciona igual.
- Capacidad: la de la sala (20 participantes).
- Idioma de la UI y de la consola: español.

## Fuera de alcance
- Zonas privadas o burbujas de audio cerradas, salas de reunión, compartir pantalla.
- Audio espacial estéreo (izquierda/derecha según orientación): solo varía el volumen.
- Grabación, supresión de ruido propia, selección de dispositivo de entrada/salida en la UI.
- Video sobre el avatar en la escena 3D (el video va en un panel 2D).
- Moderación (silenciar a otros), autenticación real.

## Impacto en specs existentes
- **Spec 003, AC-7:** junto a la etiqueta de nombre aparece el indicador de habla/micrófono (AC-13).
- **Spec 003, AC-18:** al perder la conexión también se abandona el canal de audio/video y se liberan los dispositivos (AC-16).
- **Spec 004, AC-17 / panel:** los botones y el panel de video no deben tapar el panel de chat (abajo a la izquierda).

## Preguntas abiertas
- Ninguna.

## Clarificaciones
- 2026-11-18 · ¿Servicio de audio/video en la nube o local? → Local con Docker para desarrollo y validación. Reflejado en reglas.
- 2026-11-18 · ¿Distancias del volumen? → 100 % hasta 2 m, 0 % desde 8 m. Se confirman AC-9 a AC-11 y reglas.
- 2026-11-18 · ¿Atajos de teclado? → M (micrófono) y V (cámara), solo fuera del chat. AC-8 reescrito y reglas.
- 2026-11-18 · ¿Video por distancia y ubicación? → Solo a ≤ 8 m, máx. 4, panel arriba a la derecha; botones abajo al centro. Se confirma AC-14 y reglas.
- 2026-11-18 · ¿Se oye la propia voz? → No; solo se ve el indicador propio. AC-13 y reglas.

- 2026-11-18 · Spec y plan aprobados por Judith Paco por delegación («aprueba todo en mi nombre»).

## Trazabilidad
| AC | Prueba (archivo / método) o razón de no automatizar |
|---|---|

## Validation log
