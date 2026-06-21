# Wise EventFlow — Multi-Device Test

Verifies that changes on one phone propagate to the others through the 5-second
sync. All phones open the **same published URL** (one shared API key).

## Roles

| Phone | Role given to volunteer | Primarily uses |
|-------|-------------------------|----------------|
| **A** | Reception               | Add Group, Dashboard, Announcement, Toggles |
| **B** | Photography             | Photography Queue |
| **C** | Food                    | Food Queue |
| **D** | Stage                   | Requests, Dashboard |

> Expected propagation delay for every step below: **less than one sync interval
> (~5 seconds while the screen is active; ~15s if a phone is backgrounded).**

## Preparation
- [ ] All four phones open the published URL and show the same event name.
- [ ] (Optional) Phone A loads test data via `seedData()` in Apps Script.

## Scenarios

### 1. Add Group (A → all)
- [ ] On **A**, add "Test Family".
- [ ] Expected: appears on **B/C/D** dashboards within one interval with a queue
      number; appears in **B**'s Photography queue (PhotoStatus = Waiting).

### 2. Photo Done (B → all)
- [ ] On **B**, tap **Photo Done** for "Test Family".
- [ ] Expected: it leaves **B**'s photo queue and appears in **C**'s Food queue;
      Dashboard stats on **A/D** update.

### 3. Food Done (C → all)
- [ ] On **C**, tap **Food Done**.
- [ ] Expected: group completes; removed from **C**'s queue; **A/D** stats update.

### 4. Create Request (D → all)
- [ ] On **D**, create a request for any active group.
- [ ] Expected: a request banner appears at the top on **A/B/C/D**.

### 5. Resolve Request (B → all)
- [ ] On **B**, tap **Resolve** on the banner.
- [ ] Expected: banner clears on **all** phones; FoundBy is recorded once (first
      resolver wins — a near-simultaneous resolve on another phone is a no-op).

### 6. Announcement (A → all)
- [ ] On the Sheet (or via A), set `Settings!Announcement`.
- [ ] Expected: the announcement banner appears on **all** phones; clearing it
      hides it everywhere.

### 7. Photography Pause (A → B)
- [ ] On **A**, toggle **Photography → CLOSED**.
- [ ] Expected: on **B**, the Photo queue shows "Photography Temporarily Paused"
      and **Photo Done** is disabled (Skip still allowed). Re-open restores it.

### 8. Food Pause (A → C)
- [ ] On **A**, toggle **Food → CLOSED**.
- [ ] Expected: on **C**, the Food queue shows "Food Service Temporarily Paused"
      and **Food Done** is disabled. Re-open restores it.

## Race-condition spot checks
- [ ] **Simultaneous add:** A and D add a group at the same moment → both get
      distinct, sequential queue numbers (no duplicates, no gaps from the lock).
- [ ] **Simultaneous resolve:** B and C resolve the same request together → it
      resolves once; FoundBy keeps the first writer.

## Pass criteria
- [ ] Every scenario propagates within one sync interval.
- [ ] No duplicate groups, queue numbers, or requests.
- [ ] No phone gets "stuck"; backgrounding a phone and returning re-syncs it.
