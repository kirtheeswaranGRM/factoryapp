('op@factory.com', 'op123', 'OPERATOR'),
('head@factory.com', 'head123', 'PRODUCTION HEAD'),
('qa@factory.com', 'qa123', 'QUALITY'),
('pack@factory.com', 'pack123', 'PACKING'),
('admin@factory.com', 'admin123', 'ADMIN);

-- Create the machine status table
CREATE TABLE machine_status (
    id SERIAL PRIMARY KEY,
    machine_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'idle' -- 'running' or 'idle'
);

-- Seed exactly 4 machines
INSERT INTO machine_status (machine_name) VALUES 
('Machine 1'), 
('Machine 2'), 
('Machine 3'), 
('Machine 4');

-- This table stores the active and finished production runs
CREATE TABLE production_reports (
    report_id SERIAL PRIMARY KEY,
    machine_id INTEGER REFERENCES machine_status(id),
    shift_name VARCHAR(20),
    material_type VARCHAR(50),
    material_qty NUMERIC,
    mold_type VARCHAR(50),
    mold_qty NUMERIC,
    cavity_count INTEGER,
    start_time TIMESTAMP NOT NULL,
    stop_time TIMESTAMP, -- If this is NULL, the machine is still running
    stop_reason TEXT,
    total_output INTEGER DEFAULT 0,
    production_date DATE DEFAULT CURRENT_DATE
);

ALTER TABLE machine_status 
ADD COLUMN IF NOT EXISTS start_time VARCHAR(255),
ADD COLUMN IF NOT EXISTS material_qty VARCHAR(255),
ADD COLUMN IF NOT EXISTS mold_qty VARCHAR(255),
ADD COLUMN IF NOT EXISTS shift VARCHAR(255),
ADD COLUMN IF NOT EXISTS material_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS mold_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS cavity VARCHAR(255);

//report 
CREATE TABLE production_logs (
    log_id SERIAL PRIMARY KEY,
    machine_id VARCHAR(50),
    shift VARCHAR(50),
    material_info TEXT,
    mold_info TEXT,
    cavity VARCHAR(10),
    start_time VARCHAR(100),
    stop_time VARCHAR(100),
    runned_time VARCHAR(50),
    total_output INT,
    stop_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL,
    staff_name VARCHAR(100) NOT NULL,
    attendance_date DATE DEFAULT CURRENT_DATE,
    shift VARCHAR(20) NOT NULL, -- Morning, Afternoon, Night
    status VARCHAR(10) NOT NULL DEFAULT 'Absent' -- Present or Absent
);

