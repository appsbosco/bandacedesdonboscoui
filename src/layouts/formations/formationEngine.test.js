import {
  FREE_LAYOUT_AISLE_SECTION,
  FREE_LAYOUT_COLUMNS,
  addMemberToFreeFormation,
  computeFreeFormation,
  hasFreeLayout,
  slotKey,
  swapSlots,
} from "./formationEngine.js";

function makeGroup(section, count, offset = 0) {
  return {
    section,
    members: Array.from({ length: count }, (_, index) => ({
      userId: String(offset + index + 1),
      name: `${section} ${index + 1}`,
      avatar: null,
    })),
  };
}

describe("exceptional free formation", () => {
  it("creates 20 usable positions plus two locked aisle cells in the exact center", () => {
    const slots = computeFreeFormation({
      sectionGroups: [makeGroup("DANZA", 10), makeGroup("PERCUSION", 11, 10)],
    });

    expect(hasFreeLayout(slots)).toBe(true);
    expect(slots).toHaveLength(FREE_LAYOUT_COLUMNS * 2);
    expect(slots.filter((slot) => slot.userId)).toHaveLength(21);

    for (const row of [0, 1]) {
      const aisle = slots.filter(
        (slot) => slot.row === row && slot.section === FREE_LAYOUT_AISLE_SECTION
      );
      expect(aisle.map((slot) => slot.col)).toEqual([10, 11]);
      expect(aisle.every((slot) => slot.locked && !slot.userId)).toBe(true);
    }
  });

  it("preserves manual positions when the free grid is recomputed", () => {
    const groups = [makeGroup("DANZA", 3)];
    const initial = computeFreeFormation({ sectionGroups: groups });
    const source = initial.find((slot) => slot.userId === "1");
    const target = initial.find((slot) => slot.row === 0 && slot.col === 15);
    const moved = swapSlots(initial, slotKey(source), slotKey(target));

    const recomputed = computeFreeFormation({ sectionGroups: groups, existingSlots: moved });
    expect(recomputed.find((slot) => slot.userId === "1")).toMatchObject({ row: 0, col: 15 });
  });

  it("applies the requested left and right section combination as the initial order", () => {
    const sectionOrder = [
      "DANZA",
      "FLAUTAS",
      "CLARINETES",
      "SAXOFONES_ALTO",
      "STAFF",
      "DRUM_MAJOR",
      "COLOR_GUARD",
      "MELOFONOS",
      "EUFONIOS",
      "TROMBONES",
      "TROMPETAS",
      "TUBAS",
      "PERCUSION",
      "MALLETS",
    ];
    const slots = computeFreeFormation({
      sectionGroups: sectionOrder.map((section, index) => makeGroup(section, 1, index)),
    });
    const occupied = slots.filter((slot) => slot.userId);
    const left = occupied
      .filter((slot) => slot.col < 10 && !["STAFF", "DRUM_MAJOR"].includes(slot.section))
      .map((slot) => slot.section);
    const right = occupied
      .filter((slot) => slot.col > 11 && !["STAFF", "DRUM_MAJOR"].includes(slot.section))
      .map((slot) => slot.section);
    const staff = occupied.find((slot) => slot.section === "STAFF");
    const drumMajor = occupied.find((slot) => slot.section === "DRUM_MAJOR");

    expect(left).toEqual(["DANZA", "FLAUTAS", "CLARINETES", "SAXOFONES_ALTO"]);
    expect(right).toEqual([
      "COLOR_GUARD",
      "MELOFONOS",
      "EUFONIOS",
      "TROMBONES",
      "TROMPETAS",
      "TUBAS",
      "PERCUSION",
      "MALLETS",
    ]);
    expect(staff).toMatchObject({ row: 0, col: 4 });
    expect(drumMajor).toMatchObject({ row: 0, col: 5 });
  });

  it("places Staff and Drum Major in the last rows and fills their remaining spaces", () => {
    const slots = computeFreeFormation({
      sectionGroups: [
        makeGroup("COLOR_GUARD", 15),
        makeGroup("DANZA", 5, 100),
        makeGroup("STAFF", 3, 200),
        makeGroup("DRUM_MAJOR", 1, 300),
      ],
    });
    const staffSlots = slots.filter((slot) => slot.section === "STAFF");
    const drumMajorSlot = slots.find((slot) => slot.section === "DRUM_MAJOR");

    expect(staffSlots).toHaveLength(3);
    expect(staffSlots.map(({ row, col }) => ({ row, col }))).toEqual([
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ]);
    expect(drumMajorSlot).toMatchObject({ row: 1, col: 3 });
    expect(staffSlots.every((slot) => ![10, 11].includes(slot.col))).toBe(true);
    expect([10, 11]).not.toContain(drumMajorSlot.col);
  });

  it("can restore the preset after a manual cross-side move", () => {
    const groups = [makeGroup("DANZA", 1), makeGroup("COLOR_GUARD", 1, 1)];
    const initial = computeFreeFormation({ sectionGroups: groups });
    const dance = initial.find((slot) => slot.section === "DANZA");
    const rightEmpty = initial.find((slot) => slot.col === 13);
    const moved = swapSlots(initial, slotKey(dance), slotKey(rightEmpty));

    expect(moved.find((slot) => slot.section === "DANZA").col).toBe(13);
    const restored = computeFreeFormation({
      sectionGroups: groups,
      existingSlots: moved,
      resetToPreset: true,
    });
    expect(restored.find((slot) => slot.section === "DANZA").col).toBe(0);
  });

  it("adds an included musician only to a usable position", () => {
    const initial = computeFreeFormation({ sectionGroups: [makeGroup("COLOR_GUARD", 20)] });
    const expanded = addMemberToFreeFormation(initial, {
      userId: "99",
      displayName: "Nueva Persona",
      section: "MALLETS",
    });
    const added = expanded.find((slot) => slot.userId === "99");

    expect(added).toMatchObject({ row: 2, col: 12, section: "MALLETS" });
    expect(added.section).not.toBe(FREE_LAYOUT_AISLE_SECTION);
  });
});
