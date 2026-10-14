# WorshipChurch Multitrack Player

Quiero construir una aplicación completa para iglesias, músicos, equipos de adoración, directores musicales y operadores técnicos.

Nombre provisional:

Worship Church Multitrack Player 

Yo proporcionaré posteriormente el nombre y el logo definitivos.

IMPORTANTE:

NO utilices el logo de Loop Community.

NO utilices el logo de Prime.

NO utilices logos de otras marcas.

NO copies interfaces, branding, textos, imágenes ni identidad visual de aplicaciones existentes.

La aplicación debe tener identidad visual, componentes y código originales.

Quiero Que tu Generes Por Mi El Logo

La aplicación puede inspirarse conceptualmente en herramientas profesionales existentes, pero debe ser una plataforma original.

NO hacer un clon visual de Prime, Loop Community, Planning Center, ProPresenter, OBS ni otras aplicaciones.

Quiero combinar las funciones importantes en una sola aplicación propia.

El objetivo es crear una plataforma que pueda convertirse en el centro digital de una iglesia para preparar, ensayar, ejecutar y transmitir servicios.

VISIÓN GENERAL

La aplicación debe unir en una sola plataforma estas áreas:

A. Gestión de canciones
B. Letras y acordes
C. Biblioteca musical
D. Repertorios / Setlists
E. Multitracks
F. Mezclador de stems
G. Click Track
H. Cues
I. Tonic Pad
J. Cambio de tonalidad
K. Cambio de tempo
L. Arreglos
M. Marcadores
N. MIDI
O. Remote
P. Director
Q. Presentación de letras
R. Broadcast
S. Cámaras
T. Escenas
U. Overlays
V. Streaming
W. Grabación
X. Nube
Y. Sincronización entre dispositivos
Z. Modo offline
AA. Organización / Iglesia
AB. Usuarios y permisos
AC. Preparación de ensayos
AD. Modo servicio
AE. Preparación de transmisión
AF. Gestión de archivos
AG. Biblioteca de audio
AH. Preparación para aplicaciones Windows/macOS/iOS/Android
AI. Preparación para integraciones externas
AJ. Posible AI Stem Separation

La aplicación debe sentirse como un único sistema, no como muchas aplicaciones pegadas.

PRINCIPIO FUNDAMENTAL

Quiero una plataforma gratuita para todos los usuarios.

No crear un sistema donde las funciones fundamentales estén bloqueadas detrás de una suscripción Premium.

No crear límites artificiales pequeños solamente para simular diferentes planes.

La arquitectura debe poder crecer a gran escala.

No imponer límites artificiales de:

cantidad de canciones

cantidad de setlists

cantidad de stems

cantidad de arreglos

cantidad de dispositivos

cantidad de organizaciones

El almacenamiento físico dependerá del proveedor configurado, pero la aplicación no debe tener límites arbitrarios codificados en la interfaz.

ARQUITECTURA

Utilizar una arquitectura moderna, modular y escalable.

Preferencias:

React

TypeScript

Tailwind CSS

Vite o arquitectura recomendada por Lovable

Supabase

PostgreSQL

Supabase Auth

Supabase Storage o StorageService abstracto

React Query / TanStack Query

Web Audio API cuando corresponda

Realtime/WebSockets cuando corresponda

PWA

arquitectura preparada para Tauri/Electron/Capacitor posteriormente

No colocar toda la lógica en un único componente.

Separar servicios.

Crear arquitectura para:

AuthService
UserService
OrganizationService
SongService
LyricsService
SetlistService
ArrangementService
AudioEngine
PlaybackEngine
StemService
ClickEngine
CueEngine
PadEngine
MidiService
RealtimeService
RemoteService
PresentationService
BroadcastEngine
StreamingService
VideoSourceManager
CameraService
AudioRoutingService
SceneManager
OverlayManager
RecordingService
DestinationManager
StorageService
OfflineService
DownloadService
SearchService
NotificationService

MULTI-TENANCY

La aplicación debe soportar múltiples iglesias/organizaciones.

Cada organización debe tener:

usuarios

canciones

letras

setlists

stems

arreglos

presets

configuraciones

transmisiones

dispositivos

Implementar separación estricta de datos.

Roles:

Owner
Admin
Director
Músico
Operador
Presentador
Viewer

Preparar permisos granulares.

Ningún usuario debe poder acceder a datos de otra organización.

Usar Row Level Security cuando corresponda.

AUTENTICACIÓN

Crear:

Registro

Login

Logout

Recuperación de contraseña

Confirmación de correo

Perfil

Cambio de contraseña

Configuración

Preparar:

Email

Google

Otros proveedores posteriormente

Si un proveedor OAuth todavía no está configurado:

"NO CONFIGURADO"

Nunca fingir que una integración funciona.

DASHBOARD

Crear un Dashboard central.

Mostrar:

Canciones recientes

Setlists recientes

Próximo servicio

Archivos recientes

Favoritos

Reproducciones recientes

Transmisión reciente

Dispositivos conectados

Actividad reciente

Acciones rápidas:

Nueva canción
Nuevo setlist
Importar audio
Abrir reproductor
Abrir servicio
Abrir Remote
Abrir Broadcast
Abrir biblioteca

BIBLIOTECA DE CANCIONES

Crear una biblioteca completa.

Cada canción puede tener:

Título

Artista

Autor

Álbum

Tonalidad

BPM

Compás

Duración

Imagen

Descripción

Categorías

Etiquetas

Fecha

Favorito

Permitir:

Crear

Editar

Duplicar

Eliminar

Favoritos

Buscar

Filtrar

Ordenar

Categorizar

Etiquetar

LETRAS Y ACORDES

Cada canción puede almacenar:

Letra

Acordes

Secciones

Versos

Coros

Puentes

Intro

Outro

Crear editor de letras y acordes.

Permitir:

cambios de tonalidad

estructura

secciones

líneas

formato

tamaño

alineación

Preparar una vista para presentación.

MODO PRESENTACIÓN DE LETRAS

Crear una pantalla especial para presentar letras en una pantalla externa.

Permitir:

pantalla completa

fondo

texto

tamaño

tipografía

alineación

colores

imágenes de fondo

overlays

secciones

Crear salida visual separada del panel del operador cuando la plataforma lo permita.

El operador debe poder avanzar:

verso

coro

puente

línea

diapositiva/sección

Preparar integración futura con:

FreeShow

OpenLP

ProPresenter

EasyWorship

No crear integraciones falsas.

SETLISTS / REPERTORIOS

Crear sistema completo de repertorios.

Funciones:

Nuevo setlist

Editar

Duplicar

Eliminar

Compartir

Reordenar

Agregar canciones

Quitar canciones

Cada canción dentro de un setlist puede guardar una configuración propia.

Ejemplo:

Canción original:
Tonalidad = G

Setlist Domingo:
Tonalidad = A

La configuración del setlist NO debe destruir la configuración original de la canción.

Guardar:

tonalidad

BPM

arreglo

stems activos

volumen

click

cues

pad

marcadores

notas

MULTITRACKS

Crear un sistema completo de multitracks.

Cada canción puede contener múltiples archivos.

Tipos posibles:

Drums
Percussion
Bass
Electric Guitar
Acoustic Guitar
Piano
Keys
Synth
Strings
Pads
FX
Vocals
Backing Vocals
Click
Cues
Custom

No limitar artificialmente los stems.

Permitir stems personalizados.

Cada stem:

Nombre

Archivo

Volumen

Pan

Mute

Solo

Color

Orden

Grupo

Salida

IMPORTACIÓN DE STEMS

Permitir cargar una carpeta de stems.

Ejemplo:

Canción/
Drums.wav
Bass.wav
Piano.wav
Guitar.wav
Pad.wav
Click.wav
Cues.wav

La aplicación debe intentar identificar automáticamente los nombres.

Ejemplo:

Drums.wav → Drums
Bass.wav → Bass
Piano.wav → Piano

El usuario podrá corregir la clasificación.

AUDIO ENGINE

Crear un AudioEngine real.

Todos los stems de una canción deben permanecer sincronizados.

Controles:

Play

Pause

Stop

Seek

Previous

Next

Loop

Timeline

Mostrar:

tiempo actual

duración

progreso

BPM

tonalidad

Evitar reproducción independiente de cada stem.

La sincronización debe ser centralizada.

MIXER

Crear un mezclador visual.

Cada stem:

Fader

Meter

Mute

Solo

Pan

Nombre

Icono

Color

Crear grupos:

Instruments
Vocals
FX
Click
Cues
Master

Preparar buses y routing.

TONALIDAD

Permitir transponer la canción.

Notas:

C
C#
D
Eb
E
F
F#
G
Ab
A
Bb
B

Mostrar:

Tonalidad original
Tonalidad actual
Semitonos

Nunca modificar permanentemente el archivo original.

Aplicar procesamiento durante reproducción cuando sea técnicamente viable.

TEMPO

Permitir:

BPM

+/-

Tap Tempo

Reset

Mantener tonalidad cuando sea técnicamente posible.

No modificar permanentemente el archivo original.

ARREGLOS

Crear editor visual de arreglos.

Secciones:

Intro
Verse
Pre-Chorus
Chorus
Post-Chorus
Bridge
Instrumental
Solo
Breakdown
Outro
Custom

Permitir:

crear

editar

duplicar

eliminar

mover

repetir

saltar

Ejemplo:

Intro
Verse 1
Chorus
Verse 2
Chorus
Bridge
Chorus
Outro

Guardar diferentes arreglos para una canción.

MARCADORES

Crear marcadores:

Section

Cue

MIDI

Automation

Custom

Cada marcador:

posición

nombre

tipo

color

acción

CLICK TRACK

Crear Click Track integrado.

Soportar:

2/4
3/4
4/4
5/4
6/8
7/8
9/8
12/8

Funciones:

BPM

Compás

Accent

subdivisión

volumen

mute

sonido

El Click debe poder permanecer separado del audio principal.

Cuando el hardware lo permita, preparar salida independiente.

CUES

Crear sistema de cues.

Ejemplos:

Verse
Chorus
Bridge
Next
Drums In
Build
Stop
Ending

Los cues pueden ser:

visuales

audio

MIDI

El usuario puede activarlos o desactivarlos.

TONIC PAD

Crear Tonic Pad.

Notas:

C
C#
D
Eb
E
F
F#
G
Ab
A
Bb
B

Controles:

Play

Stop

Volume

Fade In

Fade Out

Note

Preset

El usuario debe poder elegir la tonalidad rápidamente.

Preparar arquitectura para múltiples sonidos/presets.

REMOTE

Crear un modo Remote.

Concepto:

COMPUTADORA:
Director / reproductor principal

TELÉFONO / TABLET:
Remote

El teléfono no necesita convertirse automáticamente en reproductor del audio principal.

Debe controlar la sesión principal.

Acciones:

Play
Pause
Stop
Next
Previous
Jump Section
Loop
Tempo
Tonalidad
Volumen cuando corresponda

Mostrar:

canción actual

sección actual

siguiente sección

estado

conexión

SESIONES EN TIEMPO REAL

Implementar sesiones realtime.

Un Director puede crear una sesión.

Ejemplo:

WORSHIP ROOM
Código: 4821

Los dispositivos ingresan al código.

Todos ven el estado de la sesión.

Cuando el Director cambia:

Canción
Play/Pause
Sección
Posición
BPM
Tonalidad

los dispositivos conectados reciben el cambio.

Mostrar dispositivos conectados.

MODO SERVICIO

Crear un "Modo Servicio".

Este será el centro operativo.

Mostrar:

Setlist
Canción actual
Sección
Próxima sección
BPM
Tonalidad
Multitracks
Click
Pad
Remote
Presentación
Broadcast
MIDI

La interfaz debe estar diseñada para operación en vivo.

MIDI

Crear arquitectura MIDI.

Preparar:

MIDI IN
MIDI OUT
MIDI Clock
Program Change
CC
Note
Automations

Permitir asociar eventos MIDI con marcadores.

Ejemplo:

00:00 → Program Change
00:20 → CC
01:40 → Note
02:00 → Program Change

Si MIDI no está disponible:

"MIDI no disponible en este dispositivo"

No mostrar dispositivos inexistentes.

AUTOMATIZACIÓN

Permitir acciones automáticas.

Ejemplos:

Cambio de sección
Cambio de volumen
Cambio de arreglo
MIDI
Cue
Presentación
Overlay
Cambio de escena

Preparar arquitectura para automatización avanzada.

AI STEM LAB

Crear módulo opcional llamado:

"Stem Lab"

Permitir que un usuario suba un archivo de audio y posteriormente pueda separar instrumentos mediante un servicio de IA.

Posibles resultados:

Vocals
Drums
Bass
Guitar
Piano
Other

IMPORTANTE:

No fingir que la separación funciona si todavía no hay modelo o servicio configurado.

Si no está configurado:

"Stem AI no configurado"

Crear la arquitectura para incorporar posteriormente un modelo propio o servicio externo.

NUBE

Separar:

DATABASE
de
STORAGE

PostgreSQL:

usuarios

canciones

metadatos

setlists

arreglos

configuraciones

permisos

organizaciones

Storage:

audio

stems

imágenes

videos

grabaciones

Crear StorageService abstracto.

Debe ser posible utilizar posteriormente:

Supabase Storage
S3
Cloudflare R2
Backblaze B2
Otro proveedor compatible

OFFLINE

Preparar modo offline.

Permitir descargar:

canciones

stems

setlists

configuraciones

Cuando sea técnicamente posible:

Reproducir sin internet.

Mostrar claramente:

Disponible Offline
o
Requiere Internet

No fingir una función que no existe.

Cuando vuelva internet:

Sincronizar cambios.

BROADCAST

Crear módulo:

"BROADCAST"

Debe convertir la aplicación en un centro de transmisión de la iglesia.

Plataformas iniciales:

YouTube Live
Facebook Live
Twitch
RTMP personalizado

Preparar arquitectura para otras plataformas posteriormente.

Cuando una integración no esté disponible:

"NO CONFIGURADO"

DESTINOS

Crear sistema de destinos.

Ejemplo:

YouTube Iglesia
Facebook Iglesia
Twitch
RTMP

Cada destino debe tener:

nombre

plataforma

estado

cuenta

configuración

activar/desactivar

Permitir seleccionar múltiples destinos.

Ejemplo:

YouTube ☑
Facebook ☑
Twitch ☐
RTMP ☑

BROADCAST DASHBOARD

Mostrar:

Preview
Estado
Tiempo
FPS
Resolución
Bitrate
Audio
Conexión
Destinos

Botones:

INICIAR
PAUSAR
FINALIZAR

Estados:

OFFLINE
CONNECTING
LIVE
ERROR
ENDED

No mostrar LIVE si la transmisión realmente no está activa.

VIDEO SOURCES

Permitir:

Webcam
Cámara USB
Capturadora
Pantalla
Imagen
Video
Navegador
Fuente externa compatible

Mostrar dispositivos reales disponibles.

No inventar cámaras.

ESCENAS

Crear sistema de escenas.

Escenas ejemplo:

Bienvenida
Alabanza
Adoración
Predicación
Anuncios
Intermedio
Final

Cada escena puede contener:

cámara

video

imagen

texto

logo

overlay

fondo

El operador puede cambiar de escena en vivo.

OVERLAYS

Permitir:

Logo
Nombre
Título
Versículo
Anuncio
Lower Third
Texto
Redes sociales

El usuario cargará su propio logo.

No utilizar logos de terceros.

LOWER THIRD

Crear sistema para:

Nombre
Cargo / descripción

Ejemplo:

"Samuel López"
"Director de Alabanza"

Permitir guardar plantillas.

AUDIO DE BROADCAST

El audio del Broadcast debe poder ser independiente del audio de los músicos.

Ejemplo:

AUDIO PARA MÚSICOS:
Tracks
Click
Cues

AUDIO PARA TRANSMISIÓN:
Voces
Instrumentos
Tracks
Pads
Música

Normalmente:

Click = OFF
Cues = OFF

Crear Broadcast Mixer independiente.

AUDIO ROUTING

Preparar routing.

Ejemplo:

MUSICIAN OUTPUT
Tracks + Click + Cues

STREAM OUTPUT
Tracks + Vocals + Instruments

HOUSE OUTPUT
Vocals + Instruments + Tracks

Permitir distintas mezclas cuando el hardware/plataforma lo permita.

MULTISTREAM

Permitir transmitir a varios destinos.

Ejemplo:

Broadcast
↓
YouTube
Facebook
RTMP

Cada destino debe tener estado individual.

Si un destino falla, mostrar el error específicamente.

No detener necesariamente los demás destinos si técnicamente es posible.

GRABACIÓN

Agregar:

"Grabar"

Permitir grabar localmente cuando el sistema lo permita.

Mostrar:

duración

tamaño

estado

Permitir:

Iniciar
Detener
Guardar
Exportar

No prometer formatos que el entorno no pueda producir realmente.

PRESETS

Crear presets.

Ejemplo:

"Servicio Domingo"

Video:
1080p / 30 FPS

Audio:
48 kHz

Destinos:
YouTube + Facebook

Escena:
Bienvenida

Overlay:
Logo Iglesia

Permitir:

Nuevo preset
Guardar
Editar
Duplicar
Cargar
Eliminar

INTEGRACIÓN ENTRE SERVICIO Y BROADCAST

Cuando el operador abre:

MODO SERVICIO

Debe poder controlar:

Setlist
Canciones
Multitracks
Click
Cues
Pad
Letras
Presentación
Remote
MIDI
Broadcast

Todo desde la misma sesión.

Cuando cambia la canción, opcionalmente:

actualizar título de transmisión

actualizar overlay

actualizar sección

actualizar letra

actualizar escena

si el usuario lo activa.

DISPOSITIVOS

Preparar diferentes tipos de cliente:

DESKTOP / DIRECTOR

Funciones completas.

MOBILE / REMOTE

Control remoto y monitoreo.

TABLET

Interfaz híbrida.

DISPLAY

Pantalla de presentación/letras.

BROADCAST OPERATOR

Vista de transmisión.

PLAYER

Vista de reproducción.

No todas las funciones necesitan aparecer en todos los dispositivos.

PWA

Crear PWA.

Debe poder instalarse cuando el navegador lo permita.

Preparar:

Manifest
Service Worker
Icons
Caching
Offline architecture

DESKTOP

La arquitectura debe estar preparada para posteriormente empaquetar la aplicación para:

Windows
macOS

mediante:

Tauri
Electron
u otra tecnología apropiada.

Esto es especialmente importante para:

audio avanzado

routing

MIDI

cámaras

RTMP

grabación

múltiples dispositivos

procesamiento pesado

La versión web debe seguir funcionando con las funciones compatibles.

MOBILE

Preparar arquitectura para:

Android
iPhone
iPad

Especialmente para:

Remote
Player
Setlist
Lyrics
Control
Sesiones

No obligar a un teléfono a realizar procesamiento pesado innecesario.

DISEÑO

Diseño original.

Inspiración:

software profesional de audio

DAW

consolas digitales

aplicaciones modernas de producción

software de worship

NO copiar visualmente Prime.

NO copiar visualmente Loop Community.

NO copiar visualmente OBS.

NO copiar visualmente ProPresenter.

Crear identidad completamente propia.

No mostrar logotipos de terceros.

Dejar un espacio preparado para mi logo.

DARK MODE

La aplicación estará diseñada principalmente para uso en vivo.

Dark Mode como modo principal.

Alto contraste.

Botones grandes en las funciones importantes.

No usar animaciones innecesarias.

NAVEGACIÓN PRINCIPAL

Crear navegación:

Dashboard
Canciones
Biblioteca
Setlists
Reproductor
Multitracks
Lyrics
Tonic Pad
MIDI
Remote
Presentación
Broadcast
Grabaciones
Descargas
Favoritos
Organización
Configuración

Adaptar navegación a móvil.

BÚSQUEDA

Buscar por:

Canción
Artista
Autor
BPM
Tonalidad
Categoría
Tags
Setlist
Tipo de archivo

Filtros:

Favoritos
Recientes
Multitracks
Click
Cues
Offline

IMPORTACIÓN

Permitir importar:

Audio
Stems
Imágenes
Videos
Archivos compatibles

Crear asistente de importación.

Ejemplo:

Seleccionar archivos

Detectar información

Detectar stems

Confirmar

Guardar

MANEJO DE ARCHIVOS

Cada archivo debe mostrar:

nombre

tipo

tamaño

fecha

duración cuando corresponda

estado

ubicación

Permitir:

Subir
Descargar
Reemplazar
Eliminar
Mover

No romper referencias cuando un archivo sea reemplazado.

ESTABILIDAD

Prioridades:

Audio

Sincronización

Reproducción

Guardado

Integridad de datos

Broadcast

UI

Animaciones

El sistema debe manejar errores sin perder una sesión.

ERRORES

Mensajes claros:

"No se pudo cargar el archivo"
"Formato no compatible"
"Sin conexión"
"MIDI no disponible"
"Fuente de video no disponible"
"No se pudo conectar al destino"
"Archivo no encontrado"
"Storage no configurado"

No mostrar errores internos innecesarios.

SEGURIDAD

Implementar:

autenticación segura

RLS

permisos

validación

protección de rutas

separación de organizaciones

manejo seguro de tokens

no exponer secretos

Nunca guardar Stream Keys en texto visible del frontend.

Cuando una plataforma permita OAuth, utilizar OAuth.

DATOS DE DEMOSTRACIÓN

Utilizar solamente datos originales de demostración.

No importar:

canciones comerciales

multitracks comerciales

letras protegidas

contenido de Loop Community

contenido de Prime

contenido de otras plataformas

La aplicación debe permitir que el usuario cargue sus propios archivos.

NO SIMULAR FUNCIONES

Esto es MUY IMPORTANTE.

No crear botones que aparenten funcionar si la función no está implementada.

No mostrar:

"Live"

si no hay transmisión.

No mostrar:

"Connected"

si no existe conexión.

No mostrar cámaras inexistentes.

No mostrar dispositivos MIDI inexistentes.

No afirmar que el audio está saliendo por una salida física si el navegador no tiene acceso a ella.

Cuando una función requiera configuración externa:

"NO CONFIGURADO"

Cuando requiera una aplicación Desktop:

"REQUIERE APP DE ESCRITORIO"

EXPERIENCIA PRINCIPAL

El flujo ideal será:

CREAR ORGANIZACIÓN
↓
AGREGAR CANCIONES
↓
AGREGAR LETRAS
↓
AGREGAR ACORDES
↓
AGREGAR MULTITRACKS
↓
CONFIGURAR BPM
↓
CONFIGURAR TONALIDAD
↓
CREAR ARREGLO
↓
CONFIGURAR CLICK
↓
CONFIGURAR CUES
↓
CONFIGURAR PAD
↓
GUARDAR
↓
CREAR SETLIST
↓
ABRIR MODO SERVICIO
↓
CONECTAR REMOTES
↓
PRESENTAR LETRAS
↓
REPRODUCIR MULTITRACKS
↓
CONTROLAR CLICK/PAD
↓
CONTROLAR MIDI
↓
TRANSMITIR
↓
GRABAR
↓
FINALIZAR SERVICIO

CONCEPTO DEL PRODUCTO

Quiero que esta aplicación sea un:

"Centro integral de producción y adoración para iglesias"

No una simple aplicación de canciones.

Debe poder cubrir el flujo completo de:

PREPARACIÓN
ENSAYO
SERVICIO
AUDIO
MULTITRACKS
LETRAS
CONTROL
MIDI
REMOTE
VIDEO
TRANSMISIÓN

desde una sola plataforma.

PRIORIDADES DE IMPLEMENTACIÓN

No empieces creando solamente una landing page.

Construye primero la aplicación.

Prioridad 1:

Auth

Dashboard

Organización

Canciones

Letras

Setlists

Storage

Prioridad 2:

Audio Engine

Multitracks

Mixer

Click

Cues

Tempo

Tonalidad

Arreglos

Marcadores

Prioridad 3:

Director

Remote

Realtime

Presentación

Prioridad 4:

MIDI

Tonic Pad

Offline

Prioridad 5:

Broadcast

Cámaras

Escenas

Overlays

Audio de transmisión

Destinos

Grabación

Prioridad 6:

AI Stem Lab

Integraciones externas

Desktop

Mobile

Aunque estas sean prioridades de implementación, la arquitectura completa debe contemplarse desde el inicio.

IMPORTANTÍSIMO

No quiero que Lovable interprete esto como una solicitud para copiar otra aplicación.

Quiero una aplicación completamente nueva que reúna en una sola plataforma las funciones que un equipo de adoración y producción de una iglesia necesita.

La aplicación debe tener:

branding propio

interfaz propia

logo propio posteriormente

base de datos propia

arquitectura propia

código propio

No utilizar el logo de Prime.
No utilizar el logo de Loop Community.
No utilizar el logo de OBS.
No utilizar el logo de ProPresenter.
No utilizar branding de terceros.

RESULTADO FINAL

El resultado debe ser una plataforma que permita a una iglesia:

administrar canciones

escribir y administrar letras

administrar acordes

crear repertorios

cargar multitracks

mezclar stems

cambiar tonalidad

cambiar BPM

crear arreglos

usar Click

usar Cues

usar Tonic Pad

controlar MIDI

controlar la reproducción desde un teléfono

conectar múltiples dispositivos

presentar letras

administrar un servicio

transmitir el servicio

utilizar cámaras

crear escenas

mostrar overlays

transmitir a múltiples destinos

grabar

almacenar contenido en la nube

utilizar contenido offline cuando corresponda

Todo dentro de una única plataforma.

No crear funciones falsas.

No crear límites artificiales.

No crear una landing page como sustituto de la aplicación.

No utilizar branding de terceros.

Construir una base sólida, modular, estable y escalable.

El objetivo es que el usuario sienta que está utilizando una sola plataforma profesional y coherente, no cinco aplicaciones diferentes.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://worshipchurch.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3fbc5be4-e88e-4e2d-8657-82f28e7f9693).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
