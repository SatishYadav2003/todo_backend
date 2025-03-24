const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// PostgreSQL Connection Setup (AWS RDS)
const pool = new Pool({
    user: "postgres",  
    host: "todo-db.cv8i0os84iaq.ap-south-1.rds.amazonaws.com",  // Your AWS RDS endpoint
    database: "todo_db",  // Your database name
    password: "satishyadav",  // Your RDS password
    port: 5432,
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

// Create Table (Run once)
pool.query(
    "CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, task TEXT NOT NULL)",
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
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Add a task
app.post("/tasks", async (req, res) => {
    try {
        const { task } = req.body;
        const result = await pool.query("INSERT INTO tasks (task) VALUES ($1) RETURNING *", [task]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Delete a task
app.delete("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
        res.send("Task deleted");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Update a task (Edit Task)
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

        res.json(result.rows[0]); // Send back updated task
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Start Server
app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
});
