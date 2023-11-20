const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const toDate = require("date-fns/toDate");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
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
initializeDbAndServer();

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

const requestQueriesCheck = (request, response, next) => {
  const { category, priority, status, search_q, date } = request.query;
  categoryCheck = ["WORK", "HOME", "LEARNING"];
  priorityCheck = ["HIGH", "MEDIUM", "LOW"];
  statusCheck = ["TO DO", "DONE", "IN PROGRESS"];
  if (category !== undefined) {
    if (categoryCheck.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }
  if (priority !== undefined) {
    if (priorityCheck.includes(priority)) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }
  if (status !== undefined) {
    if (statusCheck.includes(status)) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  if (date !== undefined) {
    try {
      const d = new Date(date);
      const formatted_date = format(new Date(d), "yyyy-MM-dd");
      console.log(formatted_date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const date_object = d.getDate();
      const isValided = isValid(new Date(year, month, date_object));
      if (isValided === true) {
        request.date = formatted_date;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      console.log(`${e.message}`);
      response.send("Invalid Due Date");
      return;
    }
  }
  next();
};

const requestBodyCheck = (request, response, next) => {
  const { status, category, priority, dueDate } = request.body;
  categoryCheck = ["WORK", "HOME", "LEARNING"];
  priorityCheck = ["HIGH", "MEDIUM", "LOW"];
  statusCheck = ["TO DO", "DONE", "IN PROGRESS"];
  if (status !== undefined) {
    if (statusCheck.includes(status)) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  if (priority !== undefined) {
    if (priorityCheck.includes(priority)) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }
  if (category !== undefined) {
    if (categoryCheck.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }
  if (dueDate !== undefined) {
    try {
      const d = new Date(dueDate);
      const formatted_date = format(new Date(d), "yyyy-MM-dd");
      console.log(formatted_date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const date_object = d.getDate();
      const isValided = isValid(new Date(year, month, date_object));
      if (isValided === true) {
        request.dueDate = dueDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      console.log(`${e.message}`);
      response.send("Invalid Due Date");
      return;
    }
  }
  next();
};

//API 1
app.get("/todos/", requestQueriesCheck, async (request, response) => {
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
app.get("/agenda/", requestQueriesCheck, async (request, response) => {
  const date = request.date;
  console.log(date);
  const todoQuery = `SELECT * FROM todo WHERE due_date='${date}';`;
  const dbResponse = await db.all(todoQuery);
  response.send(dbResponse.map((eachItem) => convertIntoCamelCase(eachItem)));
});

//API 4

app.post("/todos/", requestBodyCheck, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const todoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date) VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await db.run(todoQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", requestBodyCheck, async (request, response) => {
  const { todoId } = request.params;
  const dbUser = `SELECT * FROM todo WHERE id=${todoId};`;
  const dbR = await db.get(dbUser);
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
app.get("/todos/", async (request, response) => {
  const todoQuery = `SELECT * FROM todo;`;
  const dbResponse = await db.all(todoQuery);
  response.send(dbResponse);
});

module.exports = app;
