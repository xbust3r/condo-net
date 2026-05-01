# Guía de Tokens Semánticos — Condo-Net

> Cómo usar clases Tailwind temáticas sin hardcodear colores.

---

## Principio

**Nunca uses colores directos** (`bg-blue-500`, `text-zinc-900`, `from-zinc-50`).  
Usa los **tokens semánticos** que cada tema sobreescribe via CSS variables.

El theme runtime de condo-net inyecta `--background`, `--foreground`, `--primary`, etc. en `:root` y `.dark`, y Tailwind v4 los mapea como utilidades (`bg-background`, `text-foreground`, etc.).

---

## Tabla de tokens

| Token CSS | Clase Tailwind | Uso |
|---|---|---|
| `--background` | `bg-background` | Fondo principal de página |
| `--foreground` | `text-foreground` | Texto principal (títulos, body) |
| `--card` | `bg-card` | Fondo de tarjetas/paneles |
| `--card-foreground` | `text-card-foreground` | Texto dentro de cards |
| `--primary` | `bg-primary`, `text-primary`, `border-primary` | Color de marca (botones, links, acentos) |
| `--primary-foreground` | `text-primary-foreground` | Texto sobre fondo primary |
| `--secondary` | `bg-secondary` | Fondo secundario |
| `--secondary-foreground` | `text-secondary-foreground` | Texto sobre secondary |
| `--muted` | `bg-muted` | Fondo atenuado (gradientes, secciones secundarias) |
| `--muted-foreground` | `text-muted-foreground` | Texto atenuado (descripciones, labels) |
| `--accent` | `bg-accent` | Acento visual |
| `--accent-foreground` | `text-accent-foreground` | Texto sobre accent |
| `--border` | `border-border` | Bordes |
| `--input` | `bg-input` | Fondos de inputs |
| `--ring` | `ring-ring` | Anillos de focus |
| `--destructive` | `bg-destructive`, `text-destructive` | Errores, eliminación |
| `--chart-1` | `bg-chart-1`, `text-chart-1` | Categoría visual 1 (ej: Residentes) |
| `--chart-2` | `bg-chart-2`, `text-chart-2` | Categoría visual 2 (ej: Unidades) |
| `--chart-3` | `bg-chart-3`, `text-chart-3` | Categoría visual 3 (ej: Pagos) |
| `--chart-4` | `bg-chart-4`, `text-chart-4` | Categoría visual 4 (ej: Torres) |
| `--chart-5` | `bg-chart-5`, `text-chart-5` | Categoría visual 5 |
| `--radius` | `rounded-lg`, `rounded-xl` | Radio de bordes (se escala proporcionalmente) |

---

## Patrones por tipo de elemento

### Página / Layout

```tsx
// ✅ CORRECTO — semántico
<div className="flex min-h-screen flex-col bg-background">
<div className="bg-gradient-to-b from-background to-muted">

// ❌ INCORRECTO — hardcodeado
<div className="bg-zinc-50 dark:bg-zinc-950">
<div className="bg-gradient-to-b from-zinc-50 to-zinc-100">
```

### Header / Nav

```tsx
// ✅ CORRECTO
<header className="border-b bg-background/80 backdrop-blur-sm">
  <span className="font-semibold text-foreground">Título</span>
</header>

// ❌ INCORRECTO
<header className="bg-white/80 dark:bg-zinc-950/80">
  <span className="text-zinc-900 dark:text-zinc-50">Título</span>
```

### Cards / Paneles

```tsx
// ✅ CORRECTO
<Card className="bg-card text-card-foreground border shadow-sm">
  <CardTitle className="text-foreground">Título</CardTitle>
  <CardDescription className="text-muted-foreground">Descripción</CardDescription>
</Card>

// ❌ INCORRECTO
<Card className="bg-white dark:bg-zinc-900">
  <CardTitle className="text-zinc-900 dark:text-zinc-50">Título</CardTitle>
```

### Botones

```tsx
// ✅ CORRECTO
<Button>Acción</Button>  // shadcn Button ya usa primary/secondary semántico
<Button variant="ghost" className="text-muted-foreground">Cancelar</Button>

// ❌ INCORRECTO
<Button className="bg-blue-500 text-white">Acción</Button>
```

### Iconos de categoría (dashboard cards)

```tsx
// ✅ CORRECTO — usa chart-* para colores categóricos que cambian con el tema
<div className="bg-chart-1/10 text-chart-1">
  <Users />
</div>
<div className="bg-chart-2/10 text-chart-2">
  <Home />
</div>

// ❌ INCORRECTO — colores fijos que chocan con temas
<div className="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
  <Users />
</div>
```

### Errores / Estados destructivos

```tsx
// ✅ CORRECTO
<div className="bg-destructive/10 text-destructive">
  {errorMessage}
</div>

// ❌ INCORRECTO
<div className="bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
  {errorMessage}
</div>
```

### Texto con opacidad (muy atenuado)

```tsx
// ✅ CORRECTO
<p className="text-muted-foreground/40">Info secundaria</p>

// ❌ INCORRECTO
<p className="text-zinc-400">Info secundaria</p>
```

---

## Regla de oro

> **Si ves un color en el className (`zinc`, `blue`, `green`, `red`, `amber`, `purple`), está mal.**

Solo se permiten colores hardcodeados en:
- El archivo de tema (`themes/*.json`) — fuente de verdad
- `globals.css` — valores default de shadcn (estos son sobreescritos por el theme runtime)
- Imágenes, SVGs inline con colores específicos del contenido (no del tema)

---

## Cómo verificar

```bash
# Busca hardcodes en las páginas
grep -rn 'zinc\|blue-\|green-\|red-\|amber-\|purple-' src/app/ src/components/
# Debe devolver cero resultados (excepto en themes/ y globals.css)
```
