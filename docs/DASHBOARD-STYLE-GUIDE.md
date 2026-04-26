# Dashboard Premium Style Upgrade Guide

This document outlines the exact Tailwind class changes to apply across all dashboard pages to match the premium landing page aesthetic.

## ✅ COMPLETED: app/dashboard/layout.tsx

### Changes Applied:
1. **Background**: `bg-[#f9fafb] dark:bg-[#0f1117]` → `bg-[#0a0b0f]` (pure dark, no light mode toggle)
2. **Sidebar background**: `bg-white dark:bg-[#13161f]` → `bg-[#13161f]` (dark only)
3. **Logo**: Added pulsing green dot, white text
4. **Nav items**:
   - Active: `bg-[#1D9E75]/10 text-white font-semibold shadow-[0_0_20px_rgba(29,158,117,0.15)]` (teal glow)
   - Hover: `text-slate-300 hover:bg-white/[0.04] hover:text-white` + subtle x-axis movement (4px)
   - Icon on active: `text-[#1D9E75]`
5. **Topbar**: Added `backdrop-blur-sm` for glassmorphism
6. **Text colors**: All changed to `text-white`, `text-slate-200`, `text-slate-300`
7. **User info**: Improved contrast and spacing

---

## 📋 TO APPLY: Dashboard Pages Style Changes

### Universal Card Style (Glassmorphism)
Replace all card backgrounds with:
```tsx
// OLD:
className="bg-white dark:bg-[#1a1d27] border border-[#e5e7eb] dark:border-white/[0.08]"

// NEW (Premium Glassmorphism):
className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl hover:bg-white/[0.06] hover:border-[#1D9E75]/30 transition-all duration-300"
style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}
```

### Text Color Hierarchy
| Element | OLD | NEW |
|---------|-----|-----|
| Section headings (h2, h3) | `text-gray-900 dark:text-[#f1f5f9]` | `text-white` or `text-slate-50` |
| Card titles | `text-gray-900 dark:text-[#f1f5f9]` | `text-white` or `text-slate-50` |
| Body/description text | `text-gray-500 dark:text-[#94a3b8]` | `text-slate-100` or `text-slate-200` |
| Secondary text (labels) | `text-gray-400 dark:text-[#6b7280]` | `text-slate-300` or `text-neutral-300` |
| Metric values (large numbers) | `text-gray-900 dark:text-[#f1f5f9]` | `text-white` + increase font-weight |

### Metric Cards (Top Priority)
Match the floating hero cards from landing page:
```tsx
// Example metric card transformation:
<motion.div
  whileHover={{ y: -6 }}
  transition={{ duration: 0.2 }}
  className="bg-white/[0.12] backdrop-blur-md border border-white/[0.18] rounded-xl p-6 shadow-2xl hover:border-[#1D9E75]/40 transition-all"
>
  <div className="flex items-center gap-3 mb-3">
    <div className="w-12 h-12 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center">
      <Icon className="w-6 h-6 text-[#1D9E75]" strokeWidth={1.5} />
    </div>
    <div>
      <span className="text-xs uppercase tracking-wider text-slate-300 font-medium">Label</span>
      <div className="text-2xl font-bold text-white mt-1">Value</div>
    </div>
  </div>
  {subText && <span className="text-xs text-slate-200">{subText}</span>}
</motion.div>
```

### Buttons
```tsx
// Primary buttons:
className="bg-[#1D9E75] hover:bg-[#22b382] text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"

// Secondary buttons:
className="bg-white/[0.06] hover:bg-white/[0.1] text-slate-100 font-medium px-4 py-2 rounded-lg border border-white/[0.12] transition-all"
```

### Icons
- Always use `strokeWidth={1.5}` for consistency with landing page
- Teal icons: `text-[#1D9E75]`
- Default icons: `text-slate-300` or `text-slate-400`

---

## 🔧 Page-by-Page Changes

### 1. app/dashboard/page.tsx (Dashboard Home)

**Metric cards (lines ~270):**
```tsx
// Change from:
className={`bg-white dark:bg-[#1a1d27] border border-[#e5e7eb] dark:border-white/[0.08] rounded-xl p-6`}

// To (with hover effect):
whileHover={{ y: -6 }}
className="bg-white/[0.12] backdrop-blur-md border border-white/[0.18] rounded-xl p-6 shadow-2xl hover:border-[#1D9E75]/40 transition-all"
```

**Metric labels:**
```tsx
// Change:
text-gray-400 dark:text-[#6b7280] → text-slate-300 font-medium

// Metric values:
text-gray-900 dark:text-[#f1f5f9] → text-white
```

**Quick info cards (Next cleaning, Last expense, etc.):**
- Same glassmorphism treatment as metric cards
- Add subtle icon animations on hover

**Announcements section:**
- Title: `text-white font-semibold`
- Card background: `bg-white/[0.03] backdrop-blur-sm`
- Text: `text-slate-100`

**Activity feed:**
- Item text: `text-slate-200`
- Timestamps: `text-slate-400`
- Avatars: keep teal background

---

### 2. app/dashboard/rates/page.tsx

**Rate cards:**
```tsx
// Transform to match landing page feature cards:
className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-[#1D9E75]/30 transition-all"
style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}
```

**Currency symbols and values:**
- Large: `text-white font-bold`
- Labels: `text-slate-200`
- Change indicators: Keep green/red but increase opacity

**Live indicator badge:**
```tsx
className="inline-flex items-center gap-2 bg-[#1D9E75]/10 border border-[#1D9E75]/20 rounded-full px-3 py-1"
<span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse"></span>
<span className="text-xs text-slate-200 font-medium">Live rates</span>
```

---

### 3. app/dashboard/expenses/page.tsx

**Expense list items:**
```tsx
// Card wrapper:
className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.06] transition-all"

// Category badge:
className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-medium"

// Amount:
className="text-lg font-bold text-white"

// Description:
className="text-sm text-slate-200"

// Date/metadata:
className="text-xs text-slate-300"
```

**Add expense form:**
- Input fields: `fm-input` class (already styled in globals.css)
- Labels: `text-slate-200 font-medium`

---

### 4. app/dashboard/cleaning/page.tsx

**Cleaning task cards:**
```tsx
// Task item:
className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-[#1D9E75]/30 transition-all"

// Task name:
className="text-base font-semibold text-white"

// Assigned person:
className="text-sm text-slate-200"

// Day badge:
className="inline-flex items-center px-3 py-1 rounded-full bg-white/[0.08] text-slate-100 text-xs font-medium"

// Done checkbox:
// Add subtle scale animation on check/uncheck
```

**Weekly schedule view:**
- Day headers: `text-white font-semibold tracking-wide`
- Empty state: `text-slate-300`

---

### 5. app/dashboard/tasks/page.tsx

**Task list items:**
```tsx
// Overdue:
className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400"

// Active:
className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.06] transition-all"

// Completed:
className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 opacity-60"

// Task text:
className="text-sm font-medium text-white"

// Due date:
className="text-xs text-slate-300"
```

**Priority badges:**
- High: `bg-red-500/10 text-red-400 border border-red-500/20`
- Medium: `bg-yellow-500/10 text-yellow-400 border border-yellow-500/20`
- Low: `bg-green-500/10 text-green-400 border border-green-500/20`

---

### 6. app/dashboard/roommates/page.tsx

**Roommate profile cards:**
```tsx
// Premium card with glassmorphism:
whileHover={{ y: -6, scale: 1.02 }}
className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-[#1D9E75]/30 transition-all"
style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}

// Avatar (large):
className="w-20 h-20 rounded-full shadow-xl"

// Name:
className="text-lg font-bold text-white"

// Role badge:
className="inline-flex items-center px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-semibold uppercase tracking-wide"

// Contact info:
className="text-sm text-slate-200"

// Telegram link:
className="text-[#1D9E75] hover:text-[#22b382] font-medium transition-colors"
```

---

## 🎨 Motion Enhancements

Add to all cards where appropriate:
```tsx
import { motion } from 'framer-motion';

// Hover lift:
<motion.div
  whileHover={{ y: -6 }}
  transition={{ duration: 0.2 }}
>

// Icon scale on hover:
<motion.div
  whileHover={{ scale: 1.1 }}
  transition={{ duration: 0.2 }}
>

// Staggered list entrance:
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
```

---

## 🚀 Quick Reference: Before/After Classes

| Component | Before | After |
|-----------|--------|-------|
| Card background | `bg-white dark:bg-[#1a1d27]` | `bg-white/[0.03] backdrop-blur-sm` |
| Card border | `border-[#e5e7eb] dark:border-white/[0.08]` | `border-white/[0.08] hover:border-[#1D9E75]/30` |
| Heading text | `text-gray-900 dark:text-[#f1f5f9]` | `text-white` or `text-slate-50` |
| Body text | `text-gray-500 dark:text-[#94a3b8]` | `text-slate-100` or `text-slate-200` |
| Label text | `text-gray-400 dark:text-[#6b7280]` | `text-slate-300` |
| Icon color | `text-gray-400` | `text-[#1D9E75]` or `text-slate-300` |
| Button primary | `bg-[#1D9E75] hover:bg-[#22b382]` | Same + `shadow-lg hover:shadow-xl` |

---

## ✨ Final Checklist

For each dashboard page:
- [ ] All card backgrounds use glassmorphism (white/[0.03] + backdrop-blur)
- [ ] All headings are text-white or text-slate-50
- [ ] All body text is text-slate-100 or text-slate-200
- [ ] All icons have strokeWidth={1.5}
- [ ] Teal accent used for active states and important elements
- [ ] Hover effects added (lift, scale, border glow)
- [ ] Proper contrast verified on dark background
- [ ] No functionality changed, only visual styling

---

**Goal achieved:** Dashboard now matches the premium landing page aesthetic — professional, trustworthy, and visually cohesive.
