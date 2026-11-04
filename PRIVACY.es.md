# Política de privacidad — EnvJumper

🇬🇧 [English version](PRIVACY.md) · 🇫🇷 [Version française](PRIVACY.fr.md)

**Última actualización:** noviembre de 2026

---

EnvJumper es una extensión de Chrome de código abierto desarrollada de forma independiente. Esta política explica de forma clara y sencilla qué datos maneja la extensión y por qué.

---

## Datos almacenados

EnvJumper almacena los siguientes datos mediante las APIs de almacenamiento integradas en Chrome:

- **Nombres de proyectos y entornos** — los nombres que das a tus proyectos y entornos
- **Dominios de los entornos** — los dominios que configuras (p. ej. `staging.ejemplo.com`)
- **Configuración del CMS y enlaces rápidos** — tipo de CMS, ruta de administración, sitios de WordPress Multisite, enlaces personalizados
- **Credenciales Basic Auth** — nombre de usuario y contraseña de los entornos en los que activas la autenticación HTTP Basic Auth
- **Preferencias de visualización** — visibilidad del borde y de la etiqueta, posición y tamaño de la etiqueta, tema
- **Caché de favicons** — dirección del favicon de cada proyecto, conservada durante 24 horas

---

## Cómo se almacenan los datos

| Almacenamiento | Qué | Alcance |
|---|---|---|
| `chrome.storage.local` | Proyectos, entornos, configuración del CMS, enlaces, credenciales Basic Auth, caché de favicons | Solo en el dispositivo local |
| `chrome.storage.sync` | Preferencias de visualización | Sincronizado entre tus dispositivos Chrome si has iniciado sesión en Chrome |

Tus proyectos y credenciales **no se sincronizan**: permanecen en el dispositivo donde los introdujiste. Para transferirlos, usa la exportación JSON.

---

## Peticiones de red

EnvJumper no tiene backend, ni analítica, ni telemetría. Las únicas peticiones que realiza la propia extensión sirven para mostrar el icono de tus proyectos:

- **Tus dominios configurados** — EnvJumper intenta obtener `/favicon.ico` de los dominios de tus entornos.
- **Servicio de favicons de Google** — si no se encuentra ningún favicon, EnvJumper carga el icono desde `https://www.google.com/s2/favicons`. En ese caso, se envía a Google el **nombre de dominio** del primer entorno del proyecto. No se envía ningún otro dato (ruta, credenciales, nombre del proyecto).

---

## Contenido de las páginas

Cuando creas un proyecto desde un sitio web, EnvJumper analiza la página actual **localmente** para detectar el CMS utilizado (WordPress, Joomla, Drupal…). En los sitios WordPress configurados, también comprueba si has iniciado sesión, para adaptar los enlaces de administración. Esta información no se almacena fuera de la configuración del proyecto ni se transmite a nadie.

---

## Credenciales Basic Auth

Los nombres de usuario y contraseñas Basic Auth se almacenan en `chrome.storage.local`, solo en tu dispositivo. Estas credenciales:

- **Solo se envían al dominio para el que las configuraste**, en respuesta a una solicitud de autenticación de ese dominio
- **Nunca se transmiten a terceros**
- **Se incluyen por defecto en las exportaciones JSON** — una casilla permite excluirlas antes de exportar. Si las incluyes, el archivo exportado contiene las contraseñas en texto plano: compártelo con precaución.

---

## Sin rastreo

EnvJumper **no recopila ningún dato de uso**:

- Sin analítica
- Sin cookies
- Sin identificadores publicitarios
- Sin informes de errores enviados al exterior
- Sin telemetría

---

## Explicación de los permisos

| Permiso | Por qué es necesario |
|---|---|
| `storage` | Almacenar la configuración de tus proyectos, entornos y preferencias |
| `tabs` | Leer la URL de la pestaña activa para compararla con los entornos configurados y abrir un entorno en una nueva pestaña |
| `activeTab` | Acceder a la pestaña actual cuando usas la extensión |
| `scripting` | Detectar el CMS de la página actual al crear un proyecto |
| `webRequest`, `webRequestAuthProvider` | Responder automáticamente a las solicitudes HTTP Basic Auth en los dominios configurados |
| `contextMenus` | Añadir un menú contextual para abrir un enlace en otro entorno |
| `<all_urls>` (permisos de host) | Mostrar el borde de color y la etiqueta en las páginas que corresponden a tus entornos, sea cual sea su dominio, y gestionar allí el Basic Auth |

---

## Eliminar tus datos

Puedes eliminar todos los datos almacenados por EnvJumper en cualquier momento:

- Eliminando proyectos individuales en la pestaña **Proyectos**
- Desinstalando la extensión (borra todo el almacenamiento local)
- Borrando los datos sincronizados de Chrome desde la configuración de tu cuenta de Google (solo las preferencias de visualización)

---

## Código abierto

EnvJumper es de código abierto bajo la licencia **GNU General Public License v3 (GPL-3.0)**. El código fuente completo está disponible y puede auditarse en GitHub:

👉 [https://github.com/drashka/EnvJumper](https://github.com/drashka/EnvJumper)

---

## Contacto

Para cualquier pregunta sobre esta política de privacidad, puedes abrir una issue en el repositorio de GitHub.

---

*Esta extensión es un proyecto independiente, no un producto de empresa.*
