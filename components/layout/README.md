# Layout Components

This directory contains layout-level components that wrap or structure the entire application.

## 📁 Files

### `PersistentScene.tsx` ✅ **Active**
The main component that renders the 3D scene, loading page, and audio UI across all routes.

**Features:**
- Scene mounts once and persists across all navigation
- Uses `useMemo` to cache elements
- Uses `React.memo` to prevent re-renders
- Never remounts during route changes

**Used in:** `app/layout.tsx`

**Implementation:**
```tsx
// Creates scene elements once
const sceneElement = useMemo(() => <Scene />, []);
const loadingElement = useMemo(() => <LoadingPage />, []);
const audioUICanvasElement = useMemo(() => <AudioUICanvas />, []);

// Memoized to prevent parent re-renders
export default React.memo(PersistentSceneComponent, () => true);
```

### `ContentOverlay.tsx` ✅ **Active**
Wrapper component for content pages with frosted glass effect.

**Features:**
- Backdrop blur
- Dark mode support
- `pointer-events-auto` (re-enables clicks)
- Consistent styling

**Used in:**
- `app/(site)/about/page.tsx`
- `app/(site)/contact/page.tsx`
- `app/(site)/projects/page.tsx`
- `app/(site)/projects/[slug]/page.tsx`

**Example:**
```tsx
<ContentOverlay>
  <h1>Page Title</h1>
  <p>Content...</p>
</ContentOverlay>
```

---

## 🎯 How They Work Together

```
app/layout.tsx (Root Layout)
│
├─ <PersistentScene /> (z-index: 0)
│   ├─ Scene (3D canvas)
│   ├─ LoadingPage (z-index: 50)
│   └─ AudioUICanvas (z-index: 20)
│
├─ <header> (z-index: 20)
│   └─ Navigation links
│
└─ <main> (z-index: 10, pointer-events-none)
    └─ {children} (pages)
        ├─ HomePage: null (scene is interactive)
        └─ Content pages: <ContentOverlay> (re-enables pointer events)
```

---

## 🔧 Best Practices

### **Adding New Pages**

For content pages (About, Contact, etc.):
```tsx
export default function NewPage() {
  return (
    <div className="max-w-2xl mx-auto py-20">
      <ContentOverlay>
        <h1>Title</h1>
        {/* Your content */}
      </ContentOverlay>
    </div>
  );
}
```

For empty pages where scene should be interactive:
```tsx
export default function EmptyPage() {
  return null; // Scene is fully interactive
}
```

---

## 🐛 Troubleshooting

### **Scene is re-rendering on navigation**
1. Check console for "Scene element created" logs
2. If you see multiple logs, switch to `PersistentSceneSingleton.tsx`

### **Scene interactions not working**
1. Check `pointer-events` on parent elements
2. Ensure `<main>` has `pointer-events-none`
3. Ensure `ContentOverlay` has `pointer-events-auto`

### **Navigation causes page reload**
1. Check if you're using `<a href>` instead of `<Link href>`
2. Replace all internal `<a>` tags with Next.js `<Link>`

---

## 📚 Related Documentation

- [REFACTOR_SUMMARY.md](../../REFACTOR_SUMMARY.md) - Full refactor details
- [BACKGROUND_SCENE_OPTIMIZATION.md](../../BACKGROUND_SCENE_OPTIMIZATION.md) - Performance strategies
- [Scene README](../scene/Scene.tsx) - 3D scene details

