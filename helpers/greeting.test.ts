import { greeting } from "./greeting";

const at = (hour: number) => new Date(2026, 8, 11, hour, 0);

describe("greeting", () => {
  it("follows the hour of the day", () => {
    expect(greeting(at(3))).toBe("Good evening");
    expect(greeting(at(7))).toBe("Good morning");
    expect(greeting(at(11))).toBe("Good morning");
    expect(greeting(at(12))).toBe("Good afternoon");
    expect(greeting(at(17))).toBe("Good afternoon");
    expect(greeting(at(18))).toBe("Good evening");
    expect(greeting(at(23))).toBe("Good evening");
  });
});

describe("greeting in Spanish", () => {
  it("speaks the reader's language", () => {
    const at = (h: number) => new Date(2026, 8, 6, h);
    expect(greeting(at(9), "es")).toBe("Buenos días");
    expect(greeting(at(15), "es")).toBe("Buenas tardes");
    expect(greeting(at(21), "es")).toBe("Buenas noches");
  });
});
