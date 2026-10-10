import test from "node:test";
import assert from "node:assert/strict";
import {
  CITIES,
  METHODS,
  countdown,
  dateKey,
  nextPrayer,
  qiblaFrom,
  scheduleFor,
  shiftDay,
  streakCount,
  timeParts,
  validLocation,
  validLogs,
} from "../src/lib.js";

test("Cairo bearing and great-circle distance point toward Mecca", () => {
  const qibla = qiblaFrom(CITIES[0]);
  assert.ok(qibla.bearing > 136 && qibla.bearing < 137);
  assert.ok(qibla.distance > 1280 && qibla.distance < 1300);
  assert.equal(
    qiblaFrom({ latitude: 21.4225, longitude: 39.8262 }).distance,
    0,
  );
});
test("all supported methods produce ordered prayer times for each city", () => {
  for (const city of CITIES)
    for (const method of Object.keys(METHODS)) {
      const prayers = scheduleFor("2026-10-10", city, method);
      assert.equal(prayers.length, 6);
      prayers.forEach((prayer, index) => {
        assert.ok(
          Number.isFinite(+prayer.date),
          `${city.id} ${method} ${prayer.id}`,
        );
        if (index) assert.ok(prayer.date > prayers[index - 1].date);
      });
    }
});
test("next prayer skips sunrise and rolls over to tomorrow after Isha", () => {
  const today = scheduleFor("2026-10-10", CITIES[0]);
  const tomorrow = scheduleFor("2026-10-11", CITIES[0]);
  assert.equal(
    nextPrayer(new Date(+today[0].date + 1000), today, tomorrow).id,
    "dhuhr",
  );
  assert.equal(
    +nextPrayer(new Date(+today[5].date + 1000), today, tomorrow).date,
    +tomorrow[0].date,
  );
});
test("selected city determines calendar date independently of device timezone", () => {
  const instant = new Date("2026-10-10T22:30:00Z");
  assert.equal(dateKey(instant, "Africa/Cairo"), "2026-10-11");
  assert.equal(dateKey(instant, "America/New_York"), "2026-10-10");
  assert.notEqual(
    timeParts(instant, "Africa/Cairo").time,
    timeParts(instant, "America/New_York").time,
  );
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDay("2024-03-01", -1), "2024-02-29");
});
test("Hanafi setting moves Asr later without altering the other prayers", () => {
  const standard = scheduleFor("2026-10-10", CITIES[0]);
  const hanafi = scheduleFor("2026-10-10", CITIES[0], "Egyptian", "hanafi");
  assert.ok(hanafi[3].date > standard[3].date);
  assert.equal(+hanafi[0].date, +standard[0].date);
});
test("countdown clamps at zero and formats an overnight interval", () => {
  const now = new Date("2026-10-10T22:00:00Z");
  assert.deepEqual(countdown(new Date("2026-10-11T02:12:09Z"), now), [
    "04",
    "12",
    "09",
  ]);
  assert.deepEqual(countdown(new Date("2026-10-10T21:00:00Z"), now), [
    "00",
    "00",
    "00",
  ]);
});
test("corrupt stored locations and logs are rejected", () => {
  assert.equal(validLocation(CITIES[0]), true);
  assert.equal(validLocation({ ...CITIES[0], timezone: "wrong" }), false);
  assert.equal(validLocation({ ...CITIES[0], latitude: 150 }), false);
  assert.equal(validLogs({ yesterday: {} }), false);
  assert.equal(
    validLogs({
      "2026-10-10": {
        prayers: ["sunrise"],
        pages: 0,
        morning: false,
        evening: false,
      },
    }),
    false,
  );
});
test("streak survives an unfinished current day but breaks at a missing day", () => {
  const full = { prayers: ["fajr", "dhuhr", "asr", "maghrib", "isha"] };
  const logs = { "2026-10-09": full, "2026-10-08": full, "2026-10-06": full };
  assert.equal(streakCount(logs, "2026-10-10"), 2);
  assert.equal(streakCount({ ...logs, "2026-10-10": full }, "2026-10-10"), 3);
});
