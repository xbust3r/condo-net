# Condo-Net — Estado del proyecto

> Última actualización: 2026-05-01
> Commit: `a39d699` | Push: ✅

---

## Resumen

`condo-net` es una **intranet privada mobile-first** construida con Next.js + shadcn/ui + Tailwind CSS v4. Cada condominio aplica su tema visual (`theme_id`) desde `condo-py` en tiempo real.

No es una landing page. No usa templates externos.

---

## Arquitectura

```
src/src/
├── app/
│   ├── page.tsx              # Redirector: /login o /select-condo
│   ├── layout.tsx            # RootLayout con AuthProvider
│   ├── globals.css           # Tailwind v4 + CSS variables base
│   ├── login/page.tsx        # Delega a login-form.tsx
│   ├── select-condo/         # Selección de condominio
│   └── dashboard/
│       ├── layout.tsx        # Header compartido + MobileShell
│       ├── page.tsx          # Inicio: welcome + quick links
│       ├── residents/        # Lista de residentes
│       ├── units/            # Unidades agrupadas por edificio
│       ├── payments/         # Historial de pagos
│       └── towers/           # Edificios con stats
├── components/
│   ├── mobile-shell.tsx      # Bottom nav bar (5 tabs)
│   ├── login-form.tsx        # Formulario de login
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── api-client.ts         # HTTP client con auto-refresh de tokens
│   ├── auth-context.tsx      # Auth state + selección condominio + theme
│   ├── theme-runtime.ts      # applyTheme/reset/restore via CSS vars
│   └── utils.ts
├── themes/                   # 10 temas portados de Condo-backdmin
│   ├── index.ts
│   └── *.json
└── proxy.ts                  # Next.js middleware
```

---

## Flujo de usuario

```
/ → AuthProvider bootstrap
  ├── Sin token → /login
  │   └── Login exitoso → /select-condo
  │       └── Selección → applyTheme(theme_id) + localStorage
  │           └── /dashboard (tema aplicado)
  └── Con token → restore from localStorage
      └── selected_condominium + restoreTheme(theme_id)
          ├── Sin condominio → /select-condo
          └── Con condominio → /dashboard
```

---

## Navegación (Bottom Nav)

5 tabs fijos, siempre visibles:

| Tab | Ruta | Icono |
|---|---|---|
| Inicio | `/dashboard` | LayoutDashboard |
| Residentes | `/dashboard/residents` | Users |
| Unidades | `/dashboard/units` | Home |
| Pagos | `/dashboard/payments` | CreditCard |
| Torres | `/dashboard/towers` | Building2 |

Sub-páginas (`/dashboard/residents`, etc.) muestran **flecha atrás** en el header. Logout siempre visible a la derecha.

---

## Theme system

10 temas disponibles. Cada condominio tiene un `theme_id` en `condo-py`.

| ID | Nombre | Color |
|---|---|---|
| `twitter` | Twitter | #1D9BF0 |
| `amber-minimal` | Amber Minimal | #C48023 |
| `violet-bloom` | Violet Bloom | #8B5CF6 |
| `northern-lights` | Northern Lights | #45B8A0 |
| `candyland` | Candyland | #E85D75 |
| `ocean-breeze` | Ocean Breeze | #2D8B9F |
| `graphite` | Graphite | #666666 |
| `cyberpunk` | Cyberpunk | #CC33CC |
| `cyberpunk-2077` | Cyberpunk 2077 | #EB9605 |
| `facebook` | Facebook | #0866FF |

**Fallback:** `twitter`

---

## Contrato API (condo-py)

| Endpoint | Uso |
|---|---|
| `POST /auth/login` | Login → `access_token` + `refresh_token` |
| `POST /auth/refresh` | Renovar tokens |
| `POST /auth/logout` | Invalidar refresh |
| `GET /me/contexts` | Perfil + `roles_by_condominium` + `condominium_theme_id` |
| `GET /condominiums/{id}` | Detalle con `theme_id` |
| `GET /condominiums?ids=` | Bulk fetch (elimina N+1) |
| `GET /condominiums/{id}/users` | Residentes — **⚠️ retorna 500** |
| `GET /units?limit=200` | Unidades |
| `GET /payments?condominium_id=` | Pagos |
| `GET /buildings?condominium_id=` | Torres/Edificios |

---

## Estado de fases

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Confirmación alcance | ✅ Completa |
| 1 | Port catálogo 10 temas | ✅ Completa |
| 2 | Theme runtime | ✅ Completa |
| 3 | Integración AuthContext + selección | ✅ Completa |
| 4 | Refactor visual (sin hardcodes) | ✅ Completa |
| 5 | Fortalecimiento contrato API | 🔶 Parcial |
| 6 | QA funcional | ✅ Completada (7/7 casos) |
| 7 | Guía de tokens | ⏳ Pendiente |

---

## Bugs corregidos durante QA (Fase 6)

1. **CORS** — `localhost:3001 → localhost:7501` bloqueado → proxy via Next.js rewrites (`/api/*` → backend)
2. **Login response** — `auth-context` buscaba `data.access_token` pero la API anida en `data.data.access_token` → corregido
3. **API URL** — `.env.local` apuntaba a `:8000` en vez de `:7501` → corregido

---

## Pendiente

| Item | Prioridad | Notas |
|---|---|---|
| **Endpoint `/condominiums/{id}/users` 500** | 🔴 Alta | Residents no carga — necesita fix en condo-py |
| **Empty state en Pagos** | 🟡 Media | API devuelve 0 resultados — sin datos de prueba |
| **Fase 5 — enrich `/me/contexts`** | 🟡 Media | Eliminar N+1 calls ya implementado con bulk fetch |
| **Fase 7 — Guía de tokens** | 🟢 Baja | Tokens semánticos en uso; guía pendiente |

---

## Variables de entorno

```env
NEXT_PUBLIC_CONDO_PY_API_URL=http://localhost:7501
```

---

## Shadcn/ui components instalados

`button`, `card`, `input`, `label`, `badge`, `avatar`, `accordion`, `tabs`

---

## Recursos

- Estrategia: `docs/condo-theme-strategy.md`
- Roadmap: `docs/roadmap.md`
- Este archivo: `docs/project-status.md`
- Backend: `/home/miguel/servers/condo-py`