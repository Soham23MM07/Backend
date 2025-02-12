import express from "express";
import logger from "./logger.js";
import morgan from "morgan";

const app = express();
const port = 3000;

app.use(express.json());

let teaData = [];
let nextId = 1;

const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

//input
app.post("/teas", (req, res) => {
  logger.warn("Hello Soham");
  const { name, price } = req.body;
  const newTea = { id: nextId++, name, price };
  teaData.push(newTea);
  res.status(200).send(newTea);
});
app.get("/teas", (req, res) => {
  res.status(201).send(teaData);
});

// app.get("/teas/:id", (req, res) => {
//   teaData.forEach((t) => {
//     if (t.id === parseInt(req.params.id)) {
//       res.status(200).send(t);
//     }
//   });
// });

// Get a Element
app.get("/teas/:id", (req, res) => {
  const tea = teaData.find((t) => t.id === parseInt(req.params.id));
  if (!tea) {
    res.status(400).send("Error");
  } else {
    res.status(200).send(tea);
  }
});

// Update
app.put("/teas/:id", (req, res) => {
  const tea = teaData.find((t) => t.id === parseInt(req.params.id));
  if (!tea) {
    res.status(400).send("Error");
  } else {
    const { name, price } = req.body;
    tea.name = name;
    tea.price = price;
    res.status(200).send(tea);
  }
});

// app.delete("/teas/:id", (req, res) => {
//   teaData = teaData.filter((t) => t.id !== parseInt(req.params.id));

//   res.status(200).send(teaData);
// });

// Delete
app.delete("/teas/:id", (req, res) => {
  const index = teaData.findIndex((t) => t.id === parseInt(req.params.id));
  if (index == -1) {
    return res.status(404).send("Not Found");
  }
  teaData.splice(index, 1);
  return res.status(202).send("Element deleted");
});

app.listen(port, () => {
  console.log(`Server is running at port :${port}`);
});
