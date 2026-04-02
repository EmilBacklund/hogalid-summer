# Hogalid F15 -- UI Improvements Plan

## Context
The website is a summer training gamification app for Hogalid F15 (girls' football team, age ~15). The developer's brother flagged that: avatars don't look like girls, rewards are bland, colors are too dark/masculine, and badges need work. This plan addresses all those issues in priority order, split across **3 chat sessions** so context is preserved.

---

## SESSION 1: Avatar Overhaul + Rewards (do first)

### 1A. Redesign Avatar SVG
**File:** `src/components/avatar/AvatarSVG.jsx`

The SVG viewBox is `0 0 52 52`. Currently avatars are gender-neutral circles with barely visible hair ellipses. Changes:

- **Add eyelashes**: 2-3 short lines radiating upward from the top of each eye (at cx=22 and cx=30, cy=26). Use `strokeWidth=0.8, strokeLinecap="round"`.
- **Add eyebrows**: Thin arcs above eyes using `<path>` with subtle opacity.
- **Overhaul "long" hair**: Add flowing side strands that come down past the neck to ~y=38 using bezier curve `<path>` elements (not just ellipses). Hair should clearly hang below shoulders.
- **Overhaul "pony" hair**: Make ponytail much more prominent. Add a visible hair tie (small colored circle at base). The ponytail should sweep out and down to one side.
- **Overhaul "afro" hair**: Make dramatically larger and add wavy edge texture (small arcs along the perimeter).
- **Add new "braids" style**: Two braids hanging down with zigzag paths and hair ties at the bottom.
- **Add subtle nose**: Small arc at (26, 28).
- **Increase cheek opacity**: 0.5 -> 0.6 for rosy cheeks.

### 1B. Add New Avatar Configs
**File:** `src/constants/avatar.js`

Keep existing indices 0-7 unchanged (preserves existing user data). Add 4 new configs at indices 8-11 using the "braids" style:
```
{ skin: "#FDBCB4", hair: "#8B4513", hairStyle: "braids", label: "I" }
{ skin: "#C68642", hair: "#F4A460", hairStyle: "braids", label: "J" }
{ skin: "#8D5524", hair: "#2C1810", hairStyle: "braids", label: "K" }
{ skin: "#FAEBD7", hair: "#D2691E", hairStyle: "long",  label: "L" }
```

### 1C. Overhaul Reward Items
**File:** `src/constants/avatar.js` (AVATAR_ITEMS_LOCKED)

Keep existing item IDs (`hat1`, `star1`, `fire1`, `crown1`, `lightning`) so existing user unlocks are preserved. Add new girl-relevant items:

| ID | Label | Cost | SVG Design |
|---|---|---|---|
| hat1 | Keps | 100 | Keep existing SVG cap |
| headband1 | Pannband | 150 | Thin arc across top of head, pink |
| star1 | Stjarna | 200 | Convert from emoji to SVG 5-pointed star |
| sunglasses | Solglasogon | 300 | Two dark rounded rects over eyes + bridge |
| fire1 | Eld | 400 | Convert from emoji to SVG flame paths |
| bow1 | Rosett | 500 | Hair bow on side of head, bright pink |
| crown1 | Krona | 800 | Keep existing SVG crown |
| lightning | Blixt | 1000 | Convert from emoji to SVG bolt polygon |
| wings1 | Vingar | 1500 | Decorative wings behind body |
| sparkle1 | Glitter | 2000 | Small SVG star shapes scattered around avatar |

**File:** `src/components/avatar/AvatarSVG.jsx` -- render ALL items as proper SVG (remove emoji `<text>` elements).

### 1D. Update Avatar Screen
**File:** `src/screens/AvatarScreen.jsx`

- Rename "Min gubbe" -> "Min avatar"
- Show **preview** for locked items: render a mini AvatarSVG with the item applied, grayed out with `filter: grayscale(0.7), opacity: 0.5`, and a lock overlay on top
- Adjust grid for more items: `gridTemplateColumns: "1fr 1fr 1fr"` if > 6 items

### 1E. Update References to "gubbe"
- `src/screens/LoginScreen.jsx` line 127: "Valj din gubbe" -> "Valj din avatar"
- `src/screens/HomeScreen.jsx` line ~188: "Min gubbe" -> "Min avatar"

### 1F. Fix LoginScreen Logo
**File:** `src/screens/LoginScreen.jsx`

Lines 66-72 use Tailwind classes that don't work (no Tailwind configured). Replace with inline styles and use the already-imported `CLUB_LOGO` base64 constant instead of the file path `/img/hogalid-logo.png`.

### Session 1 Verification
- Log in and check avatar on dashboard (52px) looks clearly feminine
- Go to "Ny spelare" and verify all 12 avatars render correctly and are distinguishable
- Go to "Min avatar" and verify locked items show previews
- Check avatar at all 3 sizes: ~44px (login selector), ~52px (dashboard), 90px (avatar screen)
- Verify existing user with old avatar index still works

---

## SESSION 2: Badges Screen + Colors + Polish

### 2A. Create Badge Screen
**New file:** `src/screens/BadgeScreen.jsx`

Grid showing all 12 badges:
- Earned: full color, icon at 40px, label, green checkmark
- Locked: grayed out (`opacity: 0.5, filter: grayscale(0.7)`), with hint text showing what's needed
- Progress indicator for numeric badges (e.g., "23/50 jonglingar")

**File:** `src/constants/badges.js` -- add `hint` field to each badge:
```
"Logga din forsta traning", "Trana 3 dagar i rad", etc.
```

### 2B. Wire Badge Screen
- `src/App.jsx`: Add routing for `screen === "badges"`
- `src/screens/HomeScreen.jsx`: Make "Mina badges" header clickable with "Se alla ->" link, show count "3/12"
- Add "Badges" button to bottom navigation grid on HomeScreen

### 2C. Soften Color Theme
**File:** `src/constants/colors.js`

Changes (preserve brand colors, lighten backgrounds):
- `dark`: "#001540" -> "#001e4a" (slightly lighter base)
- `card`: opacity 0.10 -> 0.13
- `cardHover`: opacity 0.18 -> 0.20
- `accentPink`: "#ff6b6b" -> "#ff8fa3" (softer, more pink)
- `grass`: "#002864" -> "#003a8c" (lighter navy for cards)
- `grassLight`: "#003a8c" -> "#0050b3"

### 2D. Adjust Gradient
**Files:** `src/App.jsx`, `src/screens/LoginScreen.jsx`

Current: `linear-gradient(160deg, #001540 0%, #001e6e 50%, #dc2828 100%)`
New: `linear-gradient(160deg, #001e4a 0%, #002b80 45%, #4a1942 100%)`

This shifts the bottom from harsh red to warm plum/burgundy -- still nods at club red but softer. Verify visually and adjust.

### 2E. Fix Gendered Level Name
**File:** `src/constants/levels.js` line 12

"Passningskung" -> "Passningsdrottning" (since this is explicitly a girls' team)

### Session 2 Verification
- Navigate to badge screen from HomeScreen, verify all 12 show with correct earned/locked states
- Check overall color feel across all screens (login, dashboard, team, bingo, etc.)
- Verify gradient looks warm but not too different from brand identity
- Check card visibility is improved

---

## SESSION 3: Polish & Testing

### 3A. Confetti on Unlock
**File:** `src/screens/AvatarScreen.jsx`

Trigger the existing `<Confetti>` component when unlocking an item.

### 3B. Jersey Detail (Optional)
Add a small collar line or jersey number to the avatar body SVG for a more realistic look.

### 3C. Full Testing Pass
- Verify backward compatibility (existing avatarBase 0-7, existing unlockedItems)
- Test at mobile widths: 320, 375, 414px
- Test all flows: register, login, log training, bingo, team, avatar, badges, trainings list
- Check no regressions in admin screen

---

## Session Handoff Notes

When starting a new session, tell Claude:
- **Session 1**: "I have a UI improvement plan at `UI_IMPROVEMENT_PLAN.md` in the project root. Please read it and start Session 1: Avatar overhaul + rewards."
- **Session 2**: "Continue the UI improvement plan at `UI_IMPROVEMENT_PLAN.md`. Session 1 (avatar overhaul + rewards) is done. Now do Session 2: badge screen, color theme, and quick fixes."
- **Session 3**: "Continue the UI improvement plan at `UI_IMPROVEMENT_PLAN.md`. Sessions 1+2 are done. Now do Session 3: polish and testing."
