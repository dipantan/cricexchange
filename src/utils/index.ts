import { Format } from "../types";

export const calculateBattingPoints = (batting: {
  runs_scored: any;
  four_x: any;
  six_x: any;
  strike_rate: number;
  fifties: any;
  hundreds: any;
}) => {
  let points = 0;

  points += batting?.runs_scored || 0; // 1 point per run
  points += (batting?.four_x || 0) * 2; // 2 points per four
  points += (batting?.six_x || 0) * 3; // 3 points per six

  if (batting?.strike_rate > 150) {
    points += 10; // 10 points for SR > 150
  } else if (batting?.strike_rate > 130) {
    points += 5; // 5 points for SR > 130
  } else if (batting?.strike_rate > 100) {
    points += 2; // 2 points for SR > 100
  } else if (batting?.strike_rate < 100) {
    points -= 5; // -5 points for SR < 100
  }

  points += (batting?.fifties || 0) * 20; // 20 points per fifty
  points += (batting?.hundreds || 0) * 50; // 50 points per hundred

  return points;
};

export const calculateBowlingPoints = (bowling: {
  wickets: any;
  econ_rate: number;
}) => {
  let points = 0;

  points += (bowling?.wickets || 0) * 20; // 20 points per wicket

  if (bowling?.econ_rate < 4) {
    points += 20; // 20 points for economy rate < 4
  } else if (bowling?.econ_rate < 5) {
    points += 10; // 10 points for economy rate < 5
  } else if (bowling?.econ_rate < 6) {
    points += 5; // 5 points for economy rate < 6
  }

  return points;
};

export const calculateFieldingPoints = (fielding: {
  catches: any;
  run_outs: any;
  stumpings: any;
}) => {
  let points = 0;

  points += (fielding?.catches || 0) * 10; // 10 points per catch
  points += (fielding?.run_outs || 0) * 10; // 10 points per run-out
  points += (fielding?.stumpings || 0) * 15; // 15 points per stumping

  return points;
};

export const calculateTotalPoints = (player: any[], id?: string) => {
  if (!Array.isArray(player)) return 0;

  try {
    let totalPoints = {
      T20: { batting: 0, bowling: 0, fielding: 0, fantasy: 0 },
      ODI: { batting: 0, bowling: 0, fielding: 0, fantasy: 0 },
      Test: { batting: 0, bowling: 0, fielding: 0, fantasy: 0 },
      List_A: { batting: 0, bowling: 0, fielding: 0, fantasy: 0 },
      T10: { batting: 0, bowling: 0, fielding: 0, fantasy: 0 },
    };

    let format: Format;

    player?.forEach((record) => {
      if (record.type === "T20" || record.type === "T20I") {
        format = "T20";
      } else if (record.type === "ODI" || record.type === "Youth ODI") {
        format = "ODI";
      } else if (
        record.type === "Test" ||
        record.type === "Test/5day" ||
        record.type === "4day"
      ) {
        format = "Test";
      } else if (record.type === "List A") {
        format = "List_A";
      } else if (record.type === "T10") {
        format = "T10";
      } else {
        format = "ODI";
      }

      totalPoints[format].batting += calculateBattingPoints(record?.batting);

      totalPoints[format].bowling += calculateBowlingPoints(record?.bowling);

      totalPoints[format].fielding += calculateFieldingPoints(record?.fielding);

      totalPoints[format].fantasy =
        totalPoints[format]?.batting +
        totalPoints[format]?.bowling +
        totalPoints[format]?.fielding;
    });

    const basePrice = 10; // Base price in currency units
    const pointMultiplier = 0.0006; // Currency units per point

    const totalPoint =
      totalPoints.ODI.fantasy +
      totalPoints.T20.fantasy +
      totalPoints.Test.fantasy;

    return Number(basePrice + totalPoint * pointMultiplier).toFixed(2);
  } catch (err) {
    console.log("Error player id: ", id);
  }
};

/**
 * Generates a random number between the given minimum and maximum values.
 *
 * @param {number} min - The minimum value of the range.
 * @param {number} max - The maximum value of the range.
 * @return {string} - A random number between the given minimum and maximum values.
 */
export function getRandomNumber(min: number, max: number): string {
  return Number(Math.random() * (max - min) + min).toFixed(2);
}

export function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function getThirdPreviousMonthFirstDate() {
  const now = new Date();
  const thirdPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const year = thirdPreviousMonth.getFullYear();
  const month = String(thirdPreviousMonth.getMonth() + 1).padStart(2, "0");
  const day = String(thirdPreviousMonth.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
