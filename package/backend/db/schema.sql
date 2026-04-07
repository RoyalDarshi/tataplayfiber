DROP TABLE IF EXISTS performance_records;

CREATE TABLE performance_records (
  id SERIAL PRIMARY KEY,
  record_date DATE NOT NULL,
  circle VARCHAR(32) NOT NULL,
  city VARCHAR(64) NOT NULL,
  cluster VARCHAR(64) NOT NULL,
  society VARCHAR(128) NOT NULL,
  home_passed INTEGER NOT NULL DEFAULT 0,
  customer_base INTEGER NOT NULL DEFAULT 0,
  entity_ms BIGINT NOT NULL,
  manager_name VARCHAR(128) NOT NULL,
  role VARCHAR(32) NOT NULL,
  kpi_name VARCHAR(64) NOT NULL,
  target INTEGER NOT NULL DEFAULT 0,
  ftd INTEGER NOT NULL DEFAULT 0,
  mtd INTEGER NOT NULL DEFAULT 0,
  lm INTEGER NOT NULL DEFAULT 0,
  lmtd INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_records_record_date ON performance_records (record_date);
CREATE INDEX idx_performance_records_circle ON performance_records (circle);
CREATE INDEX idx_performance_records_city ON performance_records (city);
CREATE INDEX idx_performance_records_cluster ON performance_records (cluster);
CREATE INDEX idx_performance_records_society ON performance_records (society);
CREATE INDEX idx_performance_records_manager ON performance_records (manager_name);
CREATE INDEX idx_performance_records_kpi ON performance_records (kpi_name);

