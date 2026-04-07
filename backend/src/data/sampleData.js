import { formatDate } from "../utils/dateRange.js";

const KPI_FACTORS = [
  { name: "FTR", base: 95 },
  { name: "GAD", base: 80 },
  { name: "ACT SOCIETY", base: 110 },
  { name: "RETAIL OUTER", base: 88 }
];

const MANAGER_PROFILES = [
  {
    name: "Aarav Mehta",
    role: "ASM",
    circle: "West",
    city: "Mumbai",
    cluster: "Cluster A",
    society: "Lake View",
    asi: "Rajesh Kumar",
    csm: "Sanjay Gupta",
    asm: "Aarav Mehta"
  },
  {
    name: "Diya Shah",
    role: "ASM",
    circle: "West",
    city: "Mumbai",
    cluster: "Cluster B",
    society: "Skyline Heights",
    asi: "Rajesh Kumar",
    csm: "Sanjay Gupta",
    asm: "Diya Shah"
  },
  {
    name: "Neel Patil",
    role: "CSM",
    circle: "West",
    city: "Pune",
    cluster: "Cluster A",
    society: "Green Residency",
    asi: "Vikram Singh",
    csm: "Neel Patil",
    asm: "Kartik Joshi"
  },
  {
    name: "Riya Kulkarni",
    role: "CSM",
    circle: "West",
    city: "Pune",
    cluster: "Cluster B",
    society: "Cedar Bloom",
    asi: "Vikram Singh",
    csm: "Riya Kulkarni",
    asm: "Manoj Das"
  },
  {
    name: "Ishaan Verma",
    role: "ASM",
    circle: "North",
    city: "Delhi",
    cluster: "Cluster C",
    society: "Sunshine Homes",
    asi: "Ankit Sharma",
    csm: "Priya Singh",
    asm: "Ishaan Verma"
  },
  {
    name: "Sana Kapoor",
    role: "ASM",
    circle: "North",
    city: "Delhi",
    cluster: "Cluster D",
    society: "Metro Park",
    asi: "Ankit Sharma",
    csm: "Priya Singh",
    asm: "Sana Kapoor"
  },
  {
    name: "Kabir Singh",
    role: "CSM",
    circle: "North",
    city: "Jaipur",
    cluster: "Cluster C",
    society: "Cedar Court",
    asi: "Naveen Jain",
    csm: "Kabir Singh",
    asm: "Amit Agarwal"
  },
  {
    name: "Anaya Bedi",
    role: "CSM",
    circle: "North",
    city: "Jaipur",
    cluster: "Cluster D",
    society: "Amber Residency",
    asi: "Naveen Jain",
    csm: "Anaya Bedi",
    asm: "Rohit Verma"
  },
  {
    name: "Vihaan Rao",
    role: "ASM",
    circle: "South",
    city: "Bengaluru",
    cluster: "Cluster E",
    society: "Palm Meadows",
    asi: "Arjun Reddy",
    csm: "Kiran Rao",
    asm: "Vihaan Rao"
  },
  {
    name: "Mira Reddy",
    role: "ASM",
    circle: "South",
    city: "Bengaluru",
    cluster: "Cluster F",
    society: "Pearl Habitat",
    asi: "Arjun Reddy",
    csm: "Kiran Rao",
    asm: "Mira Reddy"
  },
  {
    name: "Aditi Nair",
    role: "CSM",
    circle: "South",
    city: "Hyderabad",
    cluster: "Cluster E",
    society: "Riverstone",
    asi: "Prasad Babu",
    csm: "Aditi Nair",
    asm: "Rahul Dev"
  },
  {
    name: "Reyansh Iyer",
    role: "CSM",
    circle: "South",
    city: "Hyderabad",
    cluster: "Cluster F",
    society: "Harbor Greens",
    asi: "Prasad Babu",
    csm: "Reyansh Iyer",
    asm: "Mohan Krishnan"
  }
];

function createRandom(seedValue = 84) {
  let seed = seedValue;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function createSeedRecords() {
  const random = createRandom();
  const startDate = new Date("2026-01-01");
  const endDate = new Date("2026-04-05");
  const records = [];
  let entityOffset = 0;

  for (
    const date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    const dayIndex = Math.round(
      (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    MANAGER_PROFILES.forEach((profile, managerIndex) => {
      KPI_FACTORS.forEach((kpi, kpiIndex) => {
        entityOffset += 1;

        const productionCurve =
          1 + Math.sin((dayIndex + managerIndex + kpiIndex) / 6) * 0.12;
        const variance = 0.9 + random() * 0.28;
        const baseTarget = 440 + managerIndex * 22 + kpi.base;
        const target = Math.round(baseTarget * productionCurve * variance);
        const ftd = Math.max(
          8,
          Math.round((20 + managerIndex * 1.3 + kpiIndex * 3.1) * variance)
        );
        const mtd = Math.round(
          ftd * (2.45 + (dayIndex % 6) * 0.14 + random() * 0.45)
        );
        const lm = Math.round(ftd * (3.15 + random() * 0.7));
        const lmtd = Math.round(ftd * (2.1 + random() * 0.65));
        const homePassed = Math.round(
          (88 + managerIndex * 6 + kpiIndex * 4) * (0.96 + random() * 0.17)
        );
        const customerBase = Math.round(
          (34 + managerIndex * 2.7 + kpiIndex * 1.2) * (0.98 + random() * 0.21)
        );

        records.push({
          recordDate: formatDate(date),
          circle: profile.circle,
          city: profile.city,
          cluster: profile.cluster,
          society: profile.society,
          homePassed,
          customerBase,
          entityMs: 920000000 + entityOffset,
          managerName: profile.name,
          role: profile.role,
          asi: profile.asi,
          csm: profile.csm,
          asm: profile.asm,
          kpiName: kpi.name,
          target,
          ftd,
          mtd,
          lm,
          lmtd
        });
      });
    });
  }

  return records;
}

