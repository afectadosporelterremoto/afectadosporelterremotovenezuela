# Afectados por el Terremoto Venezuela

Plataforma humanitaria de registro, localización de desaparecidos, reporte de personas rescatadas, centralización de números de emergencia y testimonios ciudadanos en respuesta al sismo en Venezuela.

Desarrollado bajo principios de seguridad, confidencialidad y rapidez móvil-primero.

---

## 🛠️ Stack Tecnológico

- **Framework**: Next.js con TypeScript (App Router).
- **Estilos**: Tailwind CSS (Tailwind v4) para una UI sobria, solidaria y profesional.
- **Base de Datos y Seguridad**: Supabase (PostgreSQL) con RLS (Row Level Security) y enmascaramiento selectivo de datos.
- **Autenticación**: Supabase Auth (control de acceso administrativo).
- **Almacenamiento**: Supabase Storage para fotografías en bucket `photos`.
- **Despliegue**: Vercel.

---

## 📦 Características de Seguridad e Integridad de Datos

1. **Enmascaramiento de Datos Sensibles**: Para proteger la integridad física y privacidad de los ciudadanos registrados, las cédulas y los números de teléfono se ocultan parcialmente al público (ej. `V-12.XXX.456`, `0414-XXX-5678`).
2. **Confidencialidad Geográfica**: Las direcciones exactas y puntos de referencia están ocultos para usuarios no administradores.
3. **RLS (Row Level Security)**: Todas las tablas tienen políticas RLS configuradas. El público solo puede insertar en los formularios y leer campos aprobados. El acceso total y la moderación se reservan para los administradores registrados en la tabla `admin_users`.
4. **Protección contra Spam**: Formularios protegidos con campo *honeypot* invisible para desviar el tráfico de robots automatizados.
5. **Estabilidad local**: En caso de que las variables de entorno de Supabase no estén configuradas o utilicen marcadores de posición, la plataforma entra en un **Modo de Simulación** con datos ficticios para permitir pruebas funcionales completas.

---

## 🚀 Instrucciones para Instalar y Correr Localmente

### 1. Clonar e Instalar dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto tomando como referencia el archivo `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-de-supabase
```

### 3. Correr en Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 💾 Configuración de Base de Datos en Supabase

Ejecuta el archivo [schema.sql](file:///schema.sql) en el editor de SQL de tu panel de Supabase. El script realizará las siguientes acciones:

1. Creará las tablas necesarias:
   - `admin_users` (Roles y accesos administrativos).
   - `affected_people` (Personas damnificadas o necesitadas).
   - `missing_people` (Reportes activos de desaparecidos).
   - `rescued_people` (Personas localizadas o albergadas).
   - `stories` (Testimonios y relatos del blog).
   - `emergency_contacts` (Directorio telefónico por estado).
   - `information_reports` (Reportes confidenciales de datos útiles).
2. Activará **RLS (Row Level Security)** en cada tabla.
3. Creará las políticas de acceso para lectura, escritura y administración.
4. Creará el bucket público de almacenamiento `photos` en Supabase Storage para guardar las fotos cargadas.
5. Insertará contactos telefónicos oficiales venezolanos reales a nivel nacional.

---

## 🌐 Configuración del Dominio en Vercel

Para vincular la plataforma al dominio oficial **afectadosporelterremotovenezuela.com** en Vercel:

1. **Crear el proyecto en Vercel**:
   - Conecta tu repositorio de GitHub en Vercel y crea un nuevo proyecto.
   - En la sección **Environment Variables**, añade las tres variables de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
   - Haz clic en **Deploy**.
2. **Añadir el Dominio**:
   - Dirígete a la pestaña **Settings** > **Domains** en tu panel de Vercel.
   - Escribe `afectadosporelterremotovenezuela.com` y haz clic en **Add**.
3. **Configurar los DNS**:
   - Vercel te suministrará los registros DNS requeridos.
   - Ve al registrador de tu dominio (Namecheap, GoDaddy, etc.) y añade los siguientes registros:
     - **Registro A**: Nombre `@` que apunte a la IP de Vercel `76.76.21.21`.
     - **Registro CNAME**: Nombre `www` que apunte a `cname.vercel-dns.com`.
4. **Validación SSL**:
   - Vercel generará y renovará automáticamente un certificado SSL Let's Encrypt de forma gratuita para tu dominio.
