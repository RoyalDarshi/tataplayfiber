import { formatDate } from "../utils/dateRange.js";

const EMPLOYEE_PROFILES = [
  {
    employeeCode: "PE000001",
    employeeName: "Rohit Das",
    roleName: "Sales DST",
    managerName: "Manager A",
    asm: "ASM 2",
    csm: "CSM 1",
    state: "Maharashtra",
    city: "Mumbai"
  },
  {
    employeeCode: "PE000140",
    employeeName: "Rahul Sharma",
    roleName: "Sales DST",
    managerName: "Manager C",
    asm: "ASM 3",
    csm: "CSM 2",
    state: "Maharashtra",
    city: "Mumbai"
  },
  {
    employeeCode: "PE000314",
    employeeName: "Rohit Verma",
    roleName: "Sales DST",
    managerName: "Manager B",
    asm: "ASM 2",
    csm: "CSM 1",
    state: "Maharashtra",
    city: "Mumbai"
  },
  {
    employeeCode: "PE000386",
    employeeName: "Sanjay Bode",
    roleName: "Sales DST",
    managerName: "Manager B",
    asm: "ASM 2",
    csm: "CSM 2",
    state: "Maharashtra",
    city: "Mumbai"
  },
  {
    employeeCode: "PE000399",
    employeeName: "Amit Verma",
    roleName: "Sales DST",
    managerName: "Manager A",
    asm: "ASM 3",
    csm: "CSM 3",
    state: "Maharashtra",
    city: "Nagpur"
  },
  {
    employeeCode: "PE000411",
    employeeName: "Deepak More",
    roleName: "Sales DST",
    managerName: "Manager C",
    asm: "ASM 3",
    csm: "CSM 2",
    state: "Maharashtra",
    city: "Pune"
  },
  {
    employeeCode: "PE000428",
    employeeName: "Vikas Jadhav",
    roleName: "Sales DST",
    managerName: "Manager D",
    asm: "ASM 4",
    csm: "CSM 4",
    state: "Maharashtra",
    city: "Pune"
  },
  {
    employeeCode: "PE000512",
    employeeName: "Nitin Patel",
    roleName: "Sales DST",
    managerName: "Manager D",
    asm: "ASM 4",
    csm: "CSM 4",
    state: "Gujarat",
    city: "Ahmedabad"
  },
  {
    employeeCode: "PE000527",
    employeeName: "Harsh Mehta",
    roleName: "Sales DST",
    managerName: "Manager E",
    asm: "ASM 5",
    csm: "CSM 5",
    state: "Gujarat",
    city: "Surat"
  },
  {
    employeeCode: "PE000613",
    employeeName: "Priya Nair",
    roleName: "Senior Sales DST",
    managerName: "Manager E",
    asm: "ASM 5",
    csm: "CSM 5",
    state: "Karnataka",
    city: "Bengaluru"
  },
  {
    employeeCode: "PE000645",
    employeeName: "Ankit Shetty",
    roleName: "Sales DST",
    managerName: "Manager F",
    asm: "ASM 6",
    csm: "CSM 6",
    state: "Karnataka",
    city: "Bengaluru"
  },
  {
    employeeCode: "PE000702",
    employeeName: "Sakshi Rao",
    roleName: "Sales DST",
    managerName: "Manager F",
    asm: "ASM 6",
    csm: "CSM 6",
    state: "Karnataka",
    city: "Mysuru"
  }
];

const LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Earned Leave",
  "Comp Off"
];

function createRandom(seedValue = 132) {
  let seed = seedValue;

  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatClock(totalMinutes) {
  const minutesInDay = 24 * 60;
  const safeMinutes = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return `${pad(hours)}:${pad(minutes)}`;
}

function toHours(totalMinutes) {
  return Number((totalMinutes / 60).toFixed(1));
}

export function createAttendanceSeedRecords() {
  const random = createRandom();
  const startDate = new Date("2026-01-01");
  const endDate = new Date("2026-04-05");
  const records = [];

  for (
    const date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    const dayIndex = Math.round(
      (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dayOfWeek = date.getDay();

    EMPLOYEE_PROFILES.forEach((profile, employeeIndex) => {
      const attendanceDate = formatDate(date);
      const pulse = (dayIndex + employeeIndex * 3) % 19;
      const variance = random();
      const isWeekend = dayOfWeek === 0;

      let status = "PRESENT";
      let finalStatus = "PRESENT";
      let leaveType = "";
      let regularizationStatus = "Not Required";
      let checkInTime = "";
      let checkOutTime = "";
      let workingHours = 0;

      if (isWeekend && pulse % 4 === 0) {
        status = "LEAVE";
      } else if (pulse === 0 || variance < 0.07) {
        status = "ABSENT";
      } else if (pulse === 1 || pulse === 5 || variance < 0.15) {
        status = "LEAVE";
      }

      if (status === "PRESENT") {
        const checkInMinutes =
          9 * 60 + 2 + ((employeeIndex * 9 + dayIndex * 4) % 42);
        const sessionMinutes = 8 * 60 + 5 + ((employeeIndex * 11 + dayIndex * 5) % 82);

        checkInTime = formatClock(checkInMinutes);
        checkOutTime = formatClock(checkInMinutes + sessionMinutes);
        workingHours = toHours(sessionMinutes);
      } else if (status === "LEAVE") {
        leaveType = LEAVE_TYPES[(employeeIndex + dayIndex) % LEAVE_TYPES.length];
        regularizationStatus = pulse % 3 === 0 ? "Pending" : "Approved";
        finalStatus = "LEAVE";
      } else {
        regularizationStatus = pulse % 2 === 0 ? "Pending" : "Approved";

        if (regularizationStatus === "Approved" && variance > 0.42) {
          const checkInMinutes =
            9 * 60 + 20 + ((employeeIndex * 6 + dayIndex * 7) % 56);
          const sessionMinutes = 7 * 60 + 40 + ((employeeIndex * 13 + dayIndex * 3) % 70);

          finalStatus = "PRESENT";
          checkInTime = formatClock(checkInMinutes);
          checkOutTime = formatClock(checkInMinutes + sessionMinutes);
          workingHours = toHours(sessionMinutes);
        } else {
          finalStatus = "ABSENT";
        }
      }

      records.push({
        employeeCode: profile.employeeCode,
        employeeName: profile.employeeName,
        roleName: profile.roleName,
        managerName: profile.managerName,
        asm: profile.asm,
        csm: profile.csm,
        state: profile.state,
        city: profile.city,
        attendanceDate,
        status,
        finalStatus,
        checkInTime,
        checkOutTime,
        workingHours,
        leaveType,
        regularizationStatus
      });
    });
  }

  return records;
}
