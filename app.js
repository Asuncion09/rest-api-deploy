const express = require("express");
const crypto = require("node:crypto");
const cors = require("cors");
const movies = require("./movies.json");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");
const { resourceUsage } = require("node:process");

const app = express();

//app.use(cors()); // esto soluciona todos los cors pero hay que tener cuidado ya que en lugar
// de asignar diferentes access point esto asigna *, es decir, le da permiso a todo.

// una mejor forma es esta
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        "http://localhost:8080",
        "http://localhost:3000",
        "https://myapp.com",
      ];

      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      if (!origin) {
        return callback(null, true);
      }

      return callback(new Error("No allowed by CORS"));
    },
  }),
);

app.use(express.json());
app.disable("x-powered-by");

const PORT = process.env.PORT ?? 1234;

// todos los recursos que sean movie se identifican como /movie
app.get("/movies", (req, res) => {
  // const origin = req.header("origin");
  // cuando la peticion es del mismo origen el navegador nunca manda la cabecera origin.
  // http://locahlost:1234 -> http://localhost:1234 no se envia la cabecera
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header("Access-Control-Allow-Origin", origin);
  // }

  res.json(movies);
});

// segmentos dinámicos, path-to-regexp
app.get("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === id);
  if (movie) return res.json(movie);

  res.status(404).json({ message: "Movie not found" });
});

app.get("/movies/genre/:genre", (req, res) => {
  const { genre } = req.params;
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase()),
    );
    return res.json(filteredMovies);
  }
  res.status(404).json({ message: "Genre not found" });
});

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data,
  };

  // Esto no seria necesaria REST porque estamos guardando el estado
  // de la aplicacion en memoria
  movies.push(newMovie);

  res.status(201).json(newMovie); // devolver el recurso creado para actualizar la cache del cliente
});

app.delete("/movies/:id", (req, res) => {
  // const origin = req.header("origin");
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header("Access-Control-Allow-Origin", origin);
  // }

  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);
  if (movieIndex === -1)
    return res.status(404).json({ message: "Movie not found" });
  movies.splice(movieIndex, 1);
  return res.json({ message: "Movie deleted" });
});

app.patch("/movies/:id", (req, res) => {
  const { id } = req.params;
  const result = validatePartialMovie(req.body);

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1)
    return res.status(404).json({ message: "Movie not found" });

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };

  movies[movieIndex] = updateMovie;
  return res.json(updateMovie);
});

// app.options("/movies/:id", (req, res) => {
//  const origin = req.header("origin");
//  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
//    res.header("Access-Control-Allow-Origin", origin);
//    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH");
//  }
//  res.send();
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
