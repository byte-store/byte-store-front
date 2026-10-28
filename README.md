# ByteStore - Frontend

Frontend en Angular 21 para la API de ByteStore (`../byte-store`).

## Uso

1. Levantar el back (en la carpeta `byte-store`): `npm run dev` (puerto 3000 por defecto).
2. En otra terminal, en esta carpeta:

```bash
npm install
npm start
```

3. Abrir http://localhost:4200

El back no tiene CORS habilitado, por eso `ng serve` hace de proxy (ver `proxy.conf.mjs`):
todas las requests a `/api` se reenvían a `http://localhost:3000`. Si el back corre en otro
puerto, en PowerShell:

```powershell
$env:BACKEND_URL="http://localhost:4000"; npm start
```

## Funcionalidades

- **Catálogo** (público): listado y búsqueda de productos.
- **Registro / Login**: crea usuarios comunes o admins (con la `ADMIN_SECRET_KEY` del back).
- **Carrito**: agregar, cambiar cantidad, quitar y vaciar.
- **Mi cuenta**: editar nombre, email y contraseña; eliminar la cuenta.
- **Admin**: crear y eliminar productos, ver usuarios, cambiar roles y eliminarlos.

## Estructura

- `src/app/core/`: cliente de la API (`api.ts`), sesión con JWT (`auth.ts`), interceptor que
  agrega el token y guards de rutas.
- `src/app/pages/`: una carpeta por pantalla.
- `src/app/shared/`: componentes reutilizables.

## Scripts

- `npm start`: servidor de desarrollo.
- `npm run build`: build de producción en `dist/`.
- `npm test`: tests unitarios con Vitest.
