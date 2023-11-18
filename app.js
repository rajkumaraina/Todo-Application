const express = require("express");
const app = express();
const datefns = require("date-fns");
module.exports = app;
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initailizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error at ${e.message}`);
    process.exit(1);
  }
};
initailizeDbAndServer();

const convertIntoCamelCase = (dataObject) => {
  return {
    id: dataObject.id,
    todo: dataObject.todo,
    priority: dataObject.priority,
    status: dataObject.status,
    category: dataObject.category,
    dueDate: dataObject.due_date,
  };
};

//API 1
app.get("/todos/", async (request, response) => {
  const {
    category = "",
    priority = "",
    status = "",
    search_q = "",
  } = request.query;
  const todoQuery = `SELECT * FROM todo WHERE status LIKE '%${status}%' AND category LIKE '%${category}%' AND priority LIKE '%${priority}%' AND todo LIKE '%${search_q}%' ;`;
  const dbResponse = await db.all(todoQuery);
  response.send(dbResponse.map((eachItem) => convertIntoCamelCase(eachItem)));
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const dbResponse = await db.get(todoQuery);
  response.send(convertIntoCamelCase(dbResponse));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(date);
  const todoQuery = `SELECT * FROM todo WHERE due_date='${date}';`;
  console.log(todoQuery);
  const dbResponse = await db.get(todoQuery);
  response.send(dbResponse);
});

//API 4
app.post("/todos/", async (request, response) => {
  const { todo, priority, status, category, due_date } = request.body;
  const todoQuery = `INSERT INTO todo(todo,priority,status,category,due_date) VALUES('${todo}','${priority}','${status}','${category}','${due_date}');`;
  const dbResponse = await db.run(todoQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dbUser = `SELECT * FROM todo WHERE id=${todoId};`;
  const dbR = await db.get(dbUser);
  console.log(dbR);
  const {
    status = dbR.status,
    category = dbR.category,
    priority = dbR.priority,
    todo = dbR.todo,
    dueDate = dbR.due_date,
  } = request.body;
  if (request.body.status !== undefined) {
    const todoQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId}`;
    await db.run(todoQuery);
    response.send("Status Updated");
  } else if (request.body.category !== undefined) {
    const todoQuery = `UPDATE todo SET category='${category}' WHERE id=${todoId}`;
    await db.run(todoQuery);
    response.send("Category Updated");
  } else if (request.body.priority !== undefined) {
    const todoQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId}`;
    await db.run(todoQuery);
    response.send("Priority Updated");
  } else if (request.body.todo !== undefined) {
    const todoQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId}`;
    await db.run(todoQuery);
    response.send("Todo Updated");
  } else if (request.body.dueDate !== undefined) {
    const todoQuery = `UPDATE todo SET due_date='${dueDate}' WHERE id=${todoId}`;
    await db.run(todoQuery);
    response.send("Due Date Updated");
  }
});

//API6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `DELETE FROM todo WHERE id=${todoId}`;
  const dbResponse = await db.get(todoQuery);
  response.send("Todo Deleted");
});
