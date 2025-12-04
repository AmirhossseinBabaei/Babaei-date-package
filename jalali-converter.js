(function (global, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define([], factory);
  } else {
    global.JalaliDateConverter = factory();
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  const GREGORIAN_MONTH_LENGTHS = [
    31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
  ];

  function pad(value) {
    return value.toString().padStart(2, "0");
  }

  function isLeapGregorian(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function normalizeInputs(jy, jm, jd) {
    const year = Number(jy);
    const month = Number(jm);
    const day = Number(jd);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day)
    ) {
      throw new TypeError("jy, jm and jd must be integers");
    }

    if (year < 1) {
      throw new RangeError("jy must be a positive Jalali year");
    }

    if (month < 1 || month > 12) {
      throw new RangeError("jm must be between 1 and 12");
    }

    const maxDay = month <= 6 ? 31 : month <= 11 ? 30 : 29;
    if (day < 1 || day > maxDay) {
      throw new RangeError("jd is out of range for the provided month");
    }

    return { year, month, day };
  }

  function jalaliToGregorian(jy, jm, jd) {
    const { year, month, day } = normalizeInputs(jy, jm, jd);
    const jalaliYear = year - 979;
    let days =
      365 * jalaliYear +
      Math.floor(jalaliYear / 33) * 8 +
      Math.floor(((jalaliYear % 33) + 3) / 4) +
      (month < 7 ? (month - 1) * 31 : (month - 7) * 30 + 186) +
      day -
      1;

    let gy = 1600 + 400 * Math.floor(days / 146097);
    days %= 146097;

    if (days >= 36525) {
      gy += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) {
        days++;
      }
    }

    gy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days >= 366) {
      gy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }

    let gm;
    for (gm = 0; gm < 12; gm++) {
      const monthLength =
        gm === 1 && isLeapGregorian(gy)
          ? GREGORIAN_MONTH_LENGTHS[gm] + 1
          : GREGORIAN_MONTH_LENGTHS[gm];
      if (days < monthLength) {
        break;
      }
      days -= monthLength;
    }

    const gd = days + 1;

    return {
      gy,
      gm: gm + 1,
      gd,
      date: new Date(Date.UTC(gy, gm, gd)),
    };
  }

  function convert(input, separator = "/") {
    if (typeof input === "string") {
      const parts = input.split(separator).map((chunk) => chunk.trim());
      if (parts.length !== 3) {
        throw new Error("String input must contain exactly 3 parts");
      }
      return jalaliToGregorian(parts[0], parts[1], parts[2]);
    }

    if (Array.isArray(input)) {
      const [jy, jm, jd] = input;
      if (input.length !== 3) {
        throw new Error("Array input must contain exactly [jy, jm, jd]");
      }
      return jalaliToGregorian(jy, jm, jd);
    }

    if (typeof input === "object" && input !== null) {
      const { jy, jm, jd } = input;
      if ([jy, jm, jd].some((value) => value === undefined)) {
        throw new Error("Object input must include jy, jm and jd fields");
      }
      return jalaliToGregorian(jy, jm, jd);
    }

    throw new TypeError(
      "Input must be a string, array, or object containing Jalali date parts"
    );
  }

  function format(result, separator = "-") {
    return `${result.gy}${separator}${pad(result.gm)}${separator}${pad(
      result.gd
    )}`;
  }

  return {
    jalaliToGregorian,
    convert,
    format,
  };
});

