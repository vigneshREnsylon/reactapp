# Bug Catalogue — BLE Bowling League Frontend

Five intentionally introduced bugs mapped to common fix categories.
Each entry includes the bug type, a one-line summary, a full description, the exact location, and the expected fix.

---

## BUG-1 · UI Label Corrections

**Summary:** Column header reads "First Names" (plural) instead of the grammatically correct singular "First Name".

**File:** `frontend/src/BowlersTable.tsx` — `<th>First Names</th>`

**Description:**
The table column that displays a bowler's given name and middle initial is labelled
`First Names`. Because each row represents a single person, the correct label is
`First Name`. This is a resource-string error with zero logic impact — data is fetched,
filtered, and displayed correctly; only the visible heading text is wrong.

**Reproduce:**
1. Start the app and open the bowlers table.
2. Observe the column header that says **"First Names"**.

**Fix:**
```tsx
// Before
<th>First Names</th>

// After
<th>First Name</th>
```

---

## BUG-2 · Null / Empty Guards

**Summary:** The team-name filter runs before the null check on `props.displayTeams`, crashing the page when the prop is omitted.

**File:** `frontend/src/BowlersTable.tsx` — lines 29–36

**Description:**
`filteredTeamNames.includes(b.team.teamName)` is evaluated inside `Array.filter()`
before the guard `if (!filteredTeamNames || filteredTeamNames.length === 0)` is
reached. If a parent component renders `<BowlersTable />` without passing
`displayTeams`, `filteredTeamNames` is `undefined` and the `.includes()` call throws:

```
TypeError: Cannot read properties of undefined (reading 'includes')
```

The fix is to move the null/empty check above the filter so that the array is only
filtered when a non-empty list of team names is actually provided.

**Reproduce:**
1. In `App.tsx`, render `<BowlersTable />` without the `displayTeams` prop.
2. The page throws a `TypeError` and goes blank.

**Fix:**
```tsx
// After (guard comes first)
const filteredTeamNames = props.displayTeams;

var filteredBowlers = bowlerData;
if (filteredTeamNames && filteredTeamNames.length > 0) {
  filteredBowlers = bowlerData.filter((b) =>
    filteredTeamNames.includes(b.team.teamName),
  );
}
```

---

## BUG-3 · Comparison Type Fixes

**Summary:** Bowler IDs are sorted as strings (lexicographic order) instead of numbers, producing the wrong sort sequence for multi-digit IDs.

**File:** `frontend/src/BowlersTable.tsx` — `sortedBowlers` sort block

**Description:**
The "Sort by ID" feature converts each `bowlerId` (a `number`) to a `string` before
comparing with `String.prototype.localeCompare()`. Lexicographic ordering treats each
character position independently, so `"10"` sorts before `"2"` because `"1" < "2"`.

| Numeric (correct) | Lexicographic (buggy) |
|-------------------|-----------------------|
| 1, 2, 3, 10, 11   | 1, 10, 11, 2, 3       |

**Reproduce:**
1. Open the app with enough bowlers that IDs reach two digits (≥ 10).
2. Click **Sort by ID (Asc)**.
3. Observe that ID `10` appears before ID `2`.

**Fix:**
```tsx
// Before — string comparison
const sortedBowlers = [...filteredBowlers].sort((a, b) => {
  const idA = String(a.bowlerId);
  const idB = String(b.bowlerId);
  return sortAsc ? idA.localeCompare(idB) : idB.localeCompare(idA);
});

// After — numeric comparison
const sortedBowlers = [...filteredBowlers].sort((a, b) =>
  sortAsc ? a.bowlerId - b.bowlerId : b.bowlerId - a.bowlerId,
);
```

---

## BUG-4 · DTO Default Values

**Summary:** The null guard for `bowlerMiddleInit` was removed, so rows where the API returns `null` display "null." instead of nothing.

**File:** `frontend/src/BowlersTable.tsx` — middle-initial cell

**Description:**
The original ternary guard `b.bowlerMiddleInit ? b.bowlerMiddleInit + '.' : ''`
was replaced with an unconditional concatenation `b.bowlerMiddleInit + '.'`.
When the backend DTO omits the middle initial (or sends `null`), JavaScript coerces
`null` to the string `"null"`, producing visible output `"null."` in the First Name
column. This is a default-value mapping error — the API contract allows null for
optional fields, but the view model does not handle the absent case.

**Reproduce:**
1. Ensure at least one bowler in the database has no middle initial (or set it to `null`).
2. Open the bowlers table.
3. Observe the First Name column showing a value like **"Jane null."**.

**Fix:**
```tsx
// Before — unconditional concatenation
{b.bowlerMiddleInit + '.'}

// After — guard restored
{b.bowlerMiddleInit ? b.bowlerMiddleInit + '.' : ''}
```

---

## BUG-5 · Export Formatting

**Summary:** `bowlerZip` is typed as `number`, silently dropping the leading zero from five-digit zip codes that begin with `0`.

**File:** `frontend/src/types/Bowler.ts` — line 9  
**Also visible in:** `frontend/src/BowlersTable.tsx` — address cell rendering

**Description:**
The `Bowler` type declares `bowlerZip: number`. When the JSON response is
deserialized, JavaScript converts `"02134"` to the integer `2134`, permanently
discarding the leading zero. The address column then renders `2134` instead of
`02134`. Any downstream export or copy-paste of the table will carry the wrong
postal code. The fix is to treat zip codes as strings throughout — they are
identifiers, not quantities.

**Reproduce:**
1. Add or update a bowler in the database with a zip code starting with `0`
   (e.g. `02134` — Boston, MA).
2. Open the bowlers table.
3. Observe the address column shows **2134** instead of **02134**.

**Fix:**
```ts
// types/Bowler.ts — Before
bowlerZip: number;

// After
bowlerZip: string;
```
No change is needed in `BowlersTable.tsx` — the value is already rendered with
`{b.bowlerZip}`, which works correctly for both types. The fix is purely in the
type definition and in ensuring the backend serializes the field as a string.

---

*Bug catalogue generated against commit state of `react-dotnet` — frontend only.*
