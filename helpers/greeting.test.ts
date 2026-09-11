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
