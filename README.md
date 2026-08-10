# Sistema CEH Zona 3 — Comité de Enlace con Hospitales (Monterrey, N.L.)

Aplicación web para la gestión de médicos colaboradores, hospitales, casos,
visitas y territorios del Comité de Enlace con Hospitales, Zona 3.

- **App en vivo:** https://cehmedicoscolaboadres.web.app
- **Repositorio:** https://github.com/5JuanG/ceh-zona3-web
- **Proyecto de Firebase:** `cehmedicoscolaboadres` (Firestore + Authentication + Hosting)

## Correr la app en tu computadora (modo desarrollo)

**Requisito:** Node.js 64 bits (verifica con `node -p "process.arch"` → debe decir `x64`)

```bash
npm install
npm run dev
```

Abre http://localhost:3000 — cualquier cambio que hagas en el código se
refleja al instante ahí. Esto NO afecta la app pública (cehmedicoscolaboadres.web.app)
hasta que hagas el despliegue (ver abajo).

## Publicar cambios (flujo completo)

Cada vez que se modifique el código y se quiera reflejar en el enlace
público que usa el comité, hay que hacer **estos 2 pasos, en orden**:

### 1. Publicar en Firebase Hosting (actualiza la app pública)

```bash
npm run build
firebase deploy --only hosting
```

Al terminar te muestra `Hosting URL: https://cehmedicoscolaboadres.web.app`
— ese es el enlace que ya está actualizado.

### 2. Respaldar el código en GitHub (opcional pero recomendado)

```bash
git add .
git commit -m "Descripción breve del cambio"
git push
```

### Si además cambiaron las reglas de seguridad de Firestore

Solo cuando se edite el archivo `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

## Administración de cuentas de acceso (login)

El login usa **Firebase Authentication real** (correo + contraseña), no
contraseñas guardadas en la app. Para dar de alta a un nuevo integrante del
comité:

1. Agrega su nombre, correo y datos en la app (Administración → Miembros).
2. Ve a [Firebase Console → Authentication → Users](https://console.firebase.google.com/project/cehmedicoscolaboadres/authentication/users) → **"Agregar usuario"** → escribe **el mismo correo** que registraste en el paso 1, y una contraseña temporal.
3. Comparte con esa persona su correo y contraseña temporal, o usa el botón
   **"Contraseña"** dentro del panel de Administración de la app para
   enviarle un correo de Firebase con el que puede establecer su propia
   contraseña (revisa spam la primera vez, es normal).

> Por diseño, la app no puede crear cuentas de acceso por sí sola sin pasar
> por Firebase Console — es la forma más segura sin construir un servidor
> propio de administración.

## Estructura del proyecto

- `src/context/AppContext.tsx` — estado global y sincronización con Firestore
- `src/lib/firebase.ts` — configuración e inicialización de Firebase (Auth + Firestore)
- `src/components/InteractiveMap.tsx` — mapa interactivo de congregaciones/hospitales
- `src/components/CEHMemberWorksheetModal.tsx` — generador de la Hoja de Trabajo PDF
- `src/data/congregationBoundaries.ts` — los 147 polígonos de territorio (extraídos del KMZ oficial de Zona 3)
- `firestore.rules` — reglas de seguridad de la base de datos
- `firebase.json` / `.firebaserc` — configuración del proyecto de Firebase (Hosting + Firestore)
