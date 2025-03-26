const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
    user: "postgres",  
    host: "satish.cv8i0os84iaq.ap-south-1.rds.amazonaws.com", // Updated RDS endpoint
    database: "satish", // Updated database name
    password: "satishyadav", // Temporary password for testing
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

// Check Database Connection
pool.connect((err, client, release) => {
    if (err) {
        console.error("Error connecting to AWS RDS:", err);
    } else {
        console.log("Connected to AWS RDS PostgreSQL!");
        release();
    }
});

// Ensure the "tasks" table exists
pool.query(
    `CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        task TEXT NOT NULL
    )`,
    (err) => {
        if (err) console.error("Error creating table:", err);
        else console.log("Table is ready in RDS.");
    }
);

// Get all tasks
app.get("/tasks", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tasks");
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching tasks:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Add a new task
app.post("/tasks", async (req, res) => {
    try {
        const { task } = req.body;
        if (!task) return res.status(400).json({ error: "Task is required" });

        const result = await pool.query("INSERT INTO tasks (task) VALUES ($1) RETURNING *", [task]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error inserting task:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete a task
app.delete("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
        res.json({ message: "Task deleted" });
    } catch (err) {
        console.error("Error deleting task:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update a task
app.put("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { task } = req.body;

        if (!task) {
            return res.status(400).json({ error: "Task is required" });
        }

        const result = await pool.query(
            "UPDATE tasks SET task = $1 WHERE id = $2 RETURNING *",
            [task, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Start Server
app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
});
