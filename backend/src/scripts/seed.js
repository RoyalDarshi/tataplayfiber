import { readFile } from "node:fs/promises";
import pool from "../database.js";
import { createSeedRecords } from "../data/sampleData.js";

function buildChunkInsert(rows) {
  const values = [];
  const placeholders = rows.map((row, rowIndex) => {
    const baseIndex = rowIndex * 16;
    values.push(
      row.recordDate,
      row.circle,
      row.city,
      row.cluster,
      row.society,
      row.homePassed,
      row.customerBase,
      row.entityMs,
      row.managerName,
      row.role,
      row.kpiName,
      row.target,
      row.ftd,
      row.mtd,
      row.lm,
      row.lmtd
    );

    const tuple = Array.from({ length: 16 }, (_, index) => `$${baseIndex + index + 1}`);
    return `(${tuple.join(", ")})`;
  });

  return { placeholders: placeholders.join(", "), values };
}

async function run() {
  try {
    const schema = await readFile(new URL("../../db/schema.sql", import.meta.url), "utf8");
    await pool.query(schema);

    const records = createSeedRecords();
    const chunkSize = 250;

    for (let index = 0; index < records.length; index += chunkSize) {
      const chunk = records.slice(index, index + chunkSize);
      const { placeholders, values } = buildChunkInsert(chunk);

      await pool.query(
        `INSERT INTO performance_records (
          record_date,
          circle,
          city,
          cluster,
          society,
          home_passed,
          customer_base,
          entity_ms,
          manager_name,
          role,
          kpi_name,
          target,
          ftd,
          mtd,
          lm,
          lmtd
        ) VALUES ${placeholders}`,
        values
      );
    }

    console.log(`Seeded ${records.length} performance records.`);
  } catch (error) {
    console.error("Failed to seed the database.");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
